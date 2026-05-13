import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../lib/requireAuth";
import type { Request } from "express";
import crypto from "crypto";

const router: IRouter = Router();
type AuthedRequest = Request & { clerkUserId: string };

const REFERRAL_CREDITS = 3;

function generateReferralCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

async function getOrCreateUser(clerkUserId: string) {
  let [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkUserId));
  if (!user) {
    const code = generateReferralCode();
    [user] = await db.insert(usersTable).values({ clerkId: clerkUserId, credits: 3, referralCode: code }).returning();
  }
  if (!user.referralCode) {
    const code = generateReferralCode();
    [user] = await db.update(usersTable).set({ referralCode: code }).where(eq(usersTable.clerkId, clerkUserId)).returning();
  }
  return user;
}

// GET /referrals/me
router.get("/referrals/me", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = (req as AuthedRequest).clerkUserId;
  const user = await getOrCreateUser(clerkUserId);

  const referredUsers = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usersTable)
    .where(eq(usersTable.referredBy, user.referralCode ?? ""));

  const domain = process.env.REPLIT_DOMAINS?.split(",")[0] ?? "localhost";
  const referralLink = `https://${domain}/sign-up?ref=${user.referralCode}`;

  res.json({
    referralCode: user.referralCode,
    referralLink,
    referralCreditsEarned: user.referralCreditsEarned,
    referredCount: referredUsers[0]?.count ?? 0,
    creditsPerReferral: REFERRAL_CREDITS,
  });
});

// POST /referrals/apply
router.post("/referrals/apply", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = (req as AuthedRequest).clerkUserId;
  const { code } = req.body as { code?: string };

  if (!code || typeof code !== "string") {
    res.status(400).json({ error: "Referral code is required." });
    return;
  }

  const user = await getOrCreateUser(clerkUserId);

  if (user.referredBy) {
    res.status(400).json({ error: "You have already applied a referral code." });
    return;
  }

  if (user.referralCode === code.toUpperCase()) {
    res.status(400).json({ error: "You cannot use your own referral code." });
    return;
  }

  const [referrer] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.referralCode, code.toUpperCase()));

  if (!referrer) {
    res.status(404).json({ error: "Referral code not found." });
    return;
  }

  // Grant credits to both parties
  await db.update(usersTable)
    .set({
      referredBy: code.toUpperCase(),
      credits: sql`${usersTable.credits} + ${REFERRAL_CREDITS}`,
    })
    .where(eq(usersTable.clerkId, clerkUserId));

  await db.update(usersTable)
    .set({
      credits: sql`${usersTable.credits} + ${REFERRAL_CREDITS}`,
      referralCreditsEarned: sql`${usersTable.referralCreditsEarned} + ${REFERRAL_CREDITS}`,
    })
    .where(eq(usersTable.clerkId, referrer.clerkId));

  res.json({ success: true, creditsAdded: REFERRAL_CREDITS, message: `You and your referrer each received ${REFERRAL_CREDITS} free credits!` });
});

export default router;
