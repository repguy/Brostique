import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { GetMeResponse } from "@workspace/api-zod";
import { requireAuth } from "../lib/requireAuth";
import type { Request } from "express";

const router: IRouter = Router();

type AuthedRequest = Request & { clerkUserId: string };

// GET /users/me
router.get("/users/me", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = (req as AuthedRequest).clerkUserId;

  let [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUserId));

  if (!user) {
    // JIT provision user
    [user] = await db
      .insert(usersTable)
      .values({ clerkId: clerkUserId })
      .returning();
  }

  res.json(GetMeResponse.parse({
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    isPro: user.isPro,
    stripeCustomerId: user.stripeCustomerId,
    stripeSubscriptionId: user.stripeSubscriptionId,
    dailyRoastsUsed: user.dailyRoastsUsed,
    dailyRoastsResetAt: user.dailyRoastsResetAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  }));
});

export default router;
