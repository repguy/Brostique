import { Router, type IRouter } from "express";
import { GetBillingPlansResponse } from "@workspace/api-zod";
import { requireAuth } from "../lib/requireAuth";

const router: IRouter = Router();

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
  stripePriceId: process.env.STRIPE_PRO_PRICE_ID ?? null,
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

// POST /billing/checkout
router.post("/billing/checkout", requireAuth, async (_req, res): Promise<void> => {
  // Stripe not yet connected — return informative message
  res.status(503).json({
    error: "Billing not configured. Connect Stripe to enable payments.",
  });
});

// POST /billing/portal
router.post("/billing/portal", requireAuth, async (_req, res): Promise<void> => {
  res.status(503).json({
    error: "Billing not configured. Connect Stripe to enable payments.",
  });
});

export default router;
