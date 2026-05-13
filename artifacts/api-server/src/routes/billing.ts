import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
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
    "1 roast per day",
    "Basic analysis",
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

// GET /billing/plans
router.get("/billing/plans", async (_req, res): Promise<void> => {
  res.json(GetBillingPlansResponse.parse([FREE_PLAN, PRO_PLAN]));
});

// POST /billing/checkout — creates a Polar checkout session
router.post("/billing/checkout", requireAuth, async (req, res): Promise<void> => {
  const polar = getPolarClient();
  if (!polar) {
    res.status(503).json({ error: "Billing not configured. Add POLAR_ACCESS_TOKEN to Replit Secrets." });
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
    const domains = process.env.REPLIT_DOMAINS?.split(",")[0] ?? "localhost";
    const successUrl = `https://${domains}/dashboard?upgraded=1`;

    const checkout = await polar.checkouts.create({
      products: [productId],
      customerEmail: user?.email ?? undefined,
      successUrl,
    });

    res.json({ url: checkout.url });
  } catch (err) {
    logger.error({ err }, "Polar checkout creation failed");
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// POST /billing/portal — creates a Polar customer portal session
router.post("/billing/portal", requireAuth, async (req, res): Promise<void> => {
  const polar = getPolarClient();
  if (!polar) {
    res.status(503).json({ error: "Billing not configured. Add POLAR_ACCESS_TOKEN to Replit Secrets." });
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

export default router;
