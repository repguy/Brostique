import { Router, type IRouter } from "express";
import { db, reportsTable } from "@workspace/db";
import { eq, and, desc, asc, isNotNull, sql } from "drizzle-orm";

const router: IRouter = Router();

// GET /leaderboard — public top worst + best scored reports
router.get("/leaderboard", async (req, res): Promise<void> => {
  const mode = (req.query.mode as string) || "worst";
  const limit = Math.min(parseInt(String(req.query.limit ?? "20"), 10), 50);

  const order = mode === "best" ? desc(reportsTable.overallScore) : asc(reportsTable.overallScore);

  const rows = await db
    .select({
      id: reportsTable.id,
      url: reportsTable.url,
      overallScore: reportsTable.overallScore,
      pageTitle: reportsTable.pageTitle,
      screenshotUrl: reportsTable.screenshotUrl,
      shareSlug: reportsTable.shareSlug,
      createdAt: reportsTable.createdAt,
    })
    .from(reportsTable)
    .where(and(
      eq(reportsTable.isPublic, true),
      isNotNull(reportsTable.overallScore),
      isNotNull(reportsTable.shareSlug),
    ))
    .orderBy(order)
    .limit(limit);

  res.json(rows.map(r => ({
    id: r.id,
    url: r.url,
    overallScore: r.overallScore,
    pageTitle: r.pageTitle,
    screenshotUrl: r.screenshotUrl,
    shareSlug: r.shareSlug,
    createdAt: r.createdAt.toISOString(),
  })));
});

// GET /stats/public — total roasts count for live counter
router.get("/stats/public", async (_req, res): Promise<void> => {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(reportsTable)
    .where(eq(reportsTable.status, "completed"));

  res.json({ totalRoasts: row?.count ?? 0 });
});

export default router;
