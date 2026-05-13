import { Router, type IRouter } from "express";
import { desc, sql, eq, count } from "drizzle-orm";
import { db, usersTable, reportsTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/requireAdmin";
import { getSetting, setSetting, getAllSettings } from "../lib/settings";

const router: IRouter = Router();

// GET /admin/stats
router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [
    [totalUsersRow],
    [proUsersRow],
    [totalReportsRow],
    [todayReportsRow],
    [completedReportsRow],
    dailyActivity,
    topUrls,
  ] = await Promise.all([
    db.select({ count: count() }).from(usersTable),
    db.select({ count: count() }).from(usersTable).where(eq(usersTable.isPro, true)),
    db.select({ count: count() }).from(reportsTable),
    db.select({ count: count() }).from(reportsTable).where(
      sql`created_at >= ${today.toISOString()}`
    ),
    db.select({ count: count() }).from(reportsTable).where(
      eq(reportsTable.status, "completed")
    ),
    db.execute(sql`
      SELECT 
        date_trunc('day', created_at AT TIME ZONE 'UTC') AS day,
        COUNT(*)::int AS reports
      FROM reports
      WHERE created_at >= ${sevenDaysAgo.toISOString()}
      GROUP BY 1
      ORDER BY 1 ASC
    `),
    db.execute(sql`
      SELECT url, COUNT(*)::int AS roast_count
      FROM reports
      GROUP BY url
      ORDER BY roast_count DESC
      LIMIT 10
    `),
  ]);

  const completedCount = completedReportsRow?.count ?? 0;
  const avgScoreRow = completedCount > 0
    ? await db.execute(sql`SELECT AVG(overall_score)::numeric(5,1) AS avg FROM reports WHERE status = 'completed' AND overall_score IS NOT NULL`)
    : null;

  res.json({
    users: {
      total: totalUsersRow?.count ?? 0,
      pro: proUsersRow?.count ?? 0,
      free: (totalUsersRow?.count ?? 0) - (proUsersRow?.count ?? 0),
    },
    reports: {
      total: totalReportsRow?.count ?? 0,
      today: todayReportsRow?.count ?? 0,
      completed: completedCount,
      avgScore: avgScoreRow?.rows?.[0]?.avg ?? null,
    },
    dailyActivity: (dailyActivity.rows as Array<{ day: string; reports: number }>).map(r => ({
      day: new Date(r.day).toISOString().slice(0, 10),
      reports: r.reports,
    })),
    topUrls: (topUrls.rows as Array<{ url: string; roast_count: number }>).map(r => ({
      url: r.url,
      count: r.roast_count,
    })),
  });
});

// GET /admin/users
router.get("/admin/users", requireAdmin, async (req, res): Promise<void> => {
  const limit = parseInt(String(req.query.limit ?? "50"), 10);
  const offset = parseInt(String(req.query.offset ?? "0"), 10);

  const users = await db
    .select()
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json(users.map(u => ({
    id: u.id,
    clerkId: u.clerkId,
    email: u.email,
    isPro: u.isPro,
    credits: u.credits,
    createdAt: u.createdAt.toISOString(),
  })));
});

// POST /admin/users/:clerkId/credits
router.post("/admin/users/:clerkId/credits", requireAdmin, async (req, res): Promise<void> => {
  const { clerkId } = req.params;
  const { amount } = req.body as { amount: number; note?: string };

  if (!amount || typeof amount !== "number" || amount < 1) {
    res.status(400).json({ error: "amount must be a positive integer" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId));

  if (!user) {
    res.status(404).json({ error: `User with clerkId '${clerkId}' not found. Make sure the user has signed in at least once.` });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({ credits: sql`${usersTable.credits} + ${amount}` })
    .where(eq(usersTable.clerkId, clerkId))
    .returning();

  res.json({
    clerkId: updated.clerkId,
    credits: updated.credits,
    added: amount,
  });
});

// PATCH /admin/users/:clerkId/pro — toggle Pro status
router.patch("/admin/users/:clerkId/pro", requireAdmin, async (req, res): Promise<void> => {
  const { clerkId } = req.params;
  const { isPro } = req.body as { isPro: boolean };

  if (typeof isPro !== "boolean") {
    res.status(400).json({ error: "isPro must be a boolean" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({ isPro })
    .where(eq(usersTable.clerkId, clerkId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ clerkId: updated.clerkId, isPro: updated.isPro });
});

// GET /admin/settings
router.get("/admin/settings", requireAdmin, async (_req, res): Promise<void> => {
  const settings = await getAllSettings();
  res.json({
    openrouter_model: settings.openrouter_model ?? "",
    polar_product_id: settings.polar_product_id ?? "",
    polar_product_id_credits_10: settings.polar_product_id_credits_10 ?? "",
    polar_product_id_credits_25: settings.polar_product_id_credits_25 ?? "",
    polar_product_id_credits_100: settings.polar_product_id_credits_100 ?? "",
    ai_provider: settings.ai_provider ?? "openai",
    has_openrouter_key: !!process.env.OPENROUTER_API_KEY,
    has_polar_key: !!process.env.POLAR_ACCESS_TOKEN,
    has_polar_webhook_secret: !!process.env.POLAR_WEBHOOK_SECRET,
    admin_clerk_id_configured: !!process.env.ADMIN_CLERK_ID,
  });
});

// PUT /admin/settings
router.put("/admin/settings", requireAdmin, async (req, res): Promise<void> => {
  const allowed = [
    "openrouter_model",
    "polar_product_id",
    "polar_product_id_credits_10",
    "polar_product_id_credits_25",
    "polar_product_id_credits_100",
    "ai_provider",
  ];
  const updates = req.body as Record<string, string>;

  const errors: string[] = [];
  for (const [key, value] of Object.entries(updates)) {
    if (!allowed.includes(key)) {
      errors.push(`Unknown setting: ${key}`);
      continue;
    }
    if (typeof value !== "string") {
      errors.push(`Invalid value for ${key}`);
      continue;
    }
    await setSetting(key, value);
  }

  if (errors.length > 0) {
    res.status(400).json({ error: errors.join("; ") });
    return;
  }

  const settings = await getAllSettings();
  res.json({
    openrouter_model: settings.openrouter_model ?? "",
    polar_product_id: settings.polar_product_id ?? "",
    polar_product_id_credits_10: settings.polar_product_id_credits_10 ?? "",
    polar_product_id_credits_25: settings.polar_product_id_credits_25 ?? "",
    polar_product_id_credits_100: settings.polar_product_id_credits_100 ?? "",
    ai_provider: settings.ai_provider ?? "openai",
    has_openrouter_key: !!process.env.OPENROUTER_API_KEY,
    has_polar_key: !!process.env.POLAR_ACCESS_TOKEN,
    has_polar_webhook_secret: !!process.env.POLAR_WEBHOOK_SECRET,
    admin_clerk_id_configured: !!process.env.ADMIN_CLERK_ID,
  });
});

export default router;
