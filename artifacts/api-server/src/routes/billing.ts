import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { GetBillingPlansResponse } from "@workspace/api-zod";
import { requireAuth } from "../lib/requireAuth";
import { getPolarClient } from "../lib/polar";
import { getSetting } from "../lib/settings";
import { logger } from "../lib/logger";
import type { Request } from "express";

const router: IRouter = Router();

type AuthedRequest = Request & { clerkUserId: string };

const FREE_PLAN = {
  id: "free",
  name: "Free",
  price: 0,
  interval: "month",
  stripePriceId: null,
  features: [
    "3 starter credits",
    "Basic AI analysis",
    "Overall score",
    "3 improvement tips",
  ],
};

const PRO_PLAN = {
  id: "pro",
  name: "Pro",
  price: 29,
  interval: "month",
  stripePriceId: null,
  features: [
    "Unlimited roasts",
    "Full AI analysis report",
    "AI-rewritten copy suggestions",
    "Score breakdown by category",
    "Public share links",
    "Export reports",
    "Priority processing",
  ],
};

export const CREDIT_PACKS = [
  { id: "credits_10", credits: 10, price: 9, label: "Starter Pack", popular: false },
  { id: "credits_25", credits: 25, price: 19, label: "Growth Pack", popular: true },
  { id: "credits_100", credits: 100, price: 49, label: "Scale Pack", popular: false },
];

// GET /billing/plans
router.get("/billing/plans", async (_req, res): Promise<void> => {
  res.json(GetBillingPlansResponse.parse([FREE_PLAN, PRO_PLAN]));
});

// GET /billing/credit-packs
router.get("/billing/credit-packs", async (_req, res): Promise<void> => {
  res.json(CREDIT_PACKS);
});

// POST /billing/checkout — creates a Polar checkout session for Pro subscription
router.post("/billing/checkout", requireAuth, async (req, res): Promise<void> => {
  const polar = getPolarClient();
  if (!polar) {
    res.status(503).json({ error: "Billing not configured. Add POLAR_ACCESS_TOKEN to environment secrets." });
    return;
  }

  const clerkUserId = (req as AuthedRequest).clerkUserId;
  const productId = await getSetting("polar_product_id");

  if (!productId) {
    res.status(503).json({ error: "Polar product ID not configured. Set it in the admin dashboard." });
    return;
  }

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkUserId));
    const domain = process.env.REPLIT_DOMAINS?.split(",")[0] ?? process.env.VERCEL_URL ?? "localhost";
    const protocol = domain === "localhost" ? "http" : "https";
    const successUrl = `${protocol}://${domain}/dashboard?upgraded=1`;

    const checkout = await polar.checkouts.create({
      products: [productId],
      customerEmail: user?.email ?? undefined,
      successUrl,
      metadata: { clerkUserId, type: "subscription" },
    });

    res.json({ url: checkout.url });
  } catch (err) {
    logger.error({ err }, "Polar checkout creation failed");
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// POST /billing/credits/checkout — creates a Polar checkout session for a credit pack
router.post("/billing/credits/checkout", requireAuth, async (req, res): Promise<void> => {
  const polar = getPolarClient();
  if (!polar) {
    res.status(503).json({ error: "Billing not configured. Add POLAR_ACCESS_TOKEN to environment secrets." });
    return;
  }

  const clerkUserId = (req as AuthedRequest).clerkUserId;
  const { packId } = req.body as { packId: string };

  const pack = CREDIT_PACKS.find(p => p.id === packId);
  if (!pack) {
    res.status(400).json({ error: "Invalid credit pack ID." });
    return;
  }

  const settingKey = `polar_product_id_${packId}`;
  const productId = await getSetting(settingKey);

  if (!productId) {
    res.status(503).json({ error: `Credit pack product not configured. Set '${settingKey}' in admin settings.` });
    return;
  }

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkUserId));
    const domain = process.env.REPLIT_DOMAINS?.split(",")[0] ?? process.env.VERCEL_URL ?? "localhost";
    const protocol = domain === "localhost" ? "http" : "https";
    const successUrl = `${protocol}://${domain}/dashboard?credits_added=${pack.credits}`;

    const checkout = await polar.checkouts.create({
      products: [productId],
      customerEmail: user?.email ?? undefined,
      successUrl,
      metadata: { clerkUserId, type: "credits", packId, credits: String(pack.credits) },
    });

    res.json({ url: checkout.url });
  } catch (err) {
    logger.error({ err }, "Polar credit pack checkout failed");
    res.status(500).json({ error: "Failed to create credit checkout session" });
  }
});

// POST /billing/portal — creates a Polar customer portal session
router.post("/billing/portal", requireAuth, async (req, res): Promise<void> => {
  const polar = getPolarClient();
  if (!polar) {
    res.status(503).json({ error: "Billing not configured. Add POLAR_ACCESS_TOKEN to environment secrets." });
    return;
  }

  const clerkUserId = (req as AuthedRequest).clerkUserId;

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkUserId));
    if (!user?.stripeCustomerId) {
      res.status(400).json({ error: "No billing subscription found for this user." });
      return;
    }

    const session = await polar.customerSessions.create({
      customerId: user.stripeCustomerId,
    });

    res.json({ url: session.customerPortalUrl });
  } catch (err) {
    logger.error({ err }, "Polar portal session failed");
    res.status(500).json({ error: "Failed to create billing portal session" });
  }
});

// POST /billing/webhook — Polar webhook handler
router.post("/billing/webhook", async (req, res): Promise<void> => {
  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.warn("POLAR_WEBHOOK_SECRET not set — skipping webhook signature verification");
  }

  let event: { type: string; data: Record<string, unknown> };

  try {
    const rawBody = req.body instanceof Buffer ? req.body.toString("utf-8") : JSON.stringify(req.body);
    event = JSON.parse(rawBody);
  } catch (err) {
    logger.error({ err }, "Failed to parse webhook body");
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  logger.info({ type: event?.type }, "Polar webhook received");

  try {
    const eventType = event?.type ?? "";
    const data = (event?.data ?? {}) as Record<string, unknown>;

    if (eventType === "order.created" || eventType === "checkout.order_created") {
      const metadata = (data.metadata ?? (data.checkout as Record<string, unknown> | undefined)?.metadata ?? {}) as Record<string, string>;
      const clerkUserId = metadata.clerkUserId;
      const type = metadata.type;
      const credits = metadata.credits ? parseInt(metadata.credits, 10) : 0;

      if (!clerkUserId) {
        logger.warn({ data }, "Webhook missing clerkUserId in metadata");
        res.status(200).json({ received: true });
        return;
      }

      if (type === "credits" && credits > 0) {
        await db.update(usersTable)
          .set({ credits: sql`${usersTable.credits} + ${credits}` })
          .where(eq(usersTable.clerkId, clerkUserId));
        logger.info({ clerkUserId, credits }, "Credits added via webhook");
      }

      if (type === "subscription") {
        const customerId = (data.customerId ?? data.customer_id) as string | undefined;
        const subscriptionId = (data.subscriptionId ?? data.subscription_id) as string | undefined;

        await db.update(usersTable)
          .set({
            isPro: true,
            ...(customerId ? { stripeCustomerId: customerId } : {}),
            ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
          })
          .where(eq(usersTable.clerkId, clerkUserId));
        logger.info({ clerkUserId }, "User upgraded to Pro via webhook");
      }
    }

    if (eventType === "subscription.created" || eventType === "subscription.active") {
      const metadata = (data.metadata ?? {}) as Record<string, string>;
      const clerkUserId = metadata.clerkUserId;
      const customerId = (data.customerId ?? data.customer_id) as string | undefined;
      const subscriptionId = (data.id ?? data.subscriptionId) as string | undefined;

      if (clerkUserId) {
        await db.update(usersTable)
          .set({
            isPro: true,
            ...(customerId ? { stripeCustomerId: customerId } : {}),
            ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
          })
          .where(eq(usersTable.clerkId, clerkUserId));
        logger.info({ clerkUserId }, "User subscription activated via webhook");
      }
    }

    if (eventType === "subscription.canceled" || eventType === "subscription.revoked") {
      const metadata = (data.metadata ?? {}) as Record<string, string>;
      const clerkUserId = metadata.clerkUserId;

      if (clerkUserId) {
        await db.update(usersTable)
          .set({ isPro: false })
          .where(eq(usersTable.clerkId, clerkUserId));
        logger.info({ clerkUserId }, "User subscription canceled via webhook");
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    logger.error({ err }, "Webhook processing error");
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

export default router;
