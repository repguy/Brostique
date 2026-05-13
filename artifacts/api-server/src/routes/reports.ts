import { Router, type IRouter } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { db, reportsTable, usersTable } from "@workspace/db";
import {
  CreateReportBody,
  GetReportParams,
  DeleteReportParams,
  ToggleFavoriteReportParams,
  ShareReportParams,
  GetPublicReportParams,
  ListReportsQueryParams,
  GetReportStatsResponse,
  ListReportsResponse,
  GetReportResponse,
  ToggleFavoriteReportResponse,
  ShareReportResponse,
  GetPublicReportResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/requireAuth";
import { extractPageData, generateRoast } from "../lib/ai";
import { logger } from "../lib/logger";
import type { Request } from "express";
import crypto from "crypto";

const router: IRouter = Router();

type AuthedRequest = Request & { clerkUserId: string };

async function getOrCreateUser(clerkUserId: string) {
  let [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUserId));

  if (!user) {
    [user] = await db
      .insert(usersTable)
      .values({ clerkId: clerkUserId, credits: 3 })
      .returning();
  }
  return user;
}

function serializeReport(report: typeof reportsTable.$inferSelect) {
  return {
    id: report.id,
    userId: report.userId,
    url: report.url,
    status: report.status as "pending" | "processing" | "completed" | "failed",
    screenshotUrl: report.screenshotUrl ?? null,
    pageTitle: report.pageTitle ?? null,
    metaDescription: report.metaDescription ?? null,
    overallScore: report.overallScore ?? null,
    scoreCategories: (report.scoreCategories as unknown[] ?? null),
    firstImpression: report.firstImpression ?? null,
    roastSummary: report.roastSummary ?? null,
    sections: (report.sections as unknown[] ?? null),
    rewrittenHeadline: report.rewrittenHeadline ?? null,
    rewrittenCta: report.rewrittenCta ?? null,
    quickWins: (report.quickWins as string[] ?? null),
    shareSlug: report.shareSlug ?? null,
    isPublic: report.isPublic,
    isFavorite: report.isFavorite,
    lighthouseScore: report.lighthouseScore ?? null,
    performanceScore: report.performanceScore ?? null,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt?.toISOString() ?? null,
  };
}

// GET /reports/stats
router.get("/reports/stats", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = (req as AuthedRequest).clerkUserId;
  const user = await getOrCreateUser(clerkUserId);

  const allReports = await db
    .select()
    .from(reportsTable)
    .where(eq(reportsTable.userId, clerkUserId));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayReports = allReports.filter(r => new Date(r.createdAt) >= today);
  const favorites = allReports.filter(r => r.isFavorite);
  const completed = allReports.filter(r => r.overallScore != null);
  const avgScore = completed.length > 0
    ? completed.reduce((sum, r) => sum + (r.overallScore ?? 0), 0) / completed.length
    : null;

  const dailyLimit = user.isPro ? 999 : 3;

  res.json(GetReportStatsResponse.parse({
    totalReports: allReports.length,
    todayReports: todayReports.length,
    dailyLimit,
    favoriteReports: favorites.length,
    avgScore: avgScore != null ? Math.round(avgScore * 10) / 10 : null,
    isPro: user.isPro,
    credits: user.credits,
  }));
});

// GET /reports/public/:shareSlug
router.get("/reports/public/:shareSlug", async (req, res): Promise<void> => {
  const parsed = GetPublicReportParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [report] = await db
    .select()
    .from(reportsTable)
    .where(and(
      eq(reportsTable.shareSlug, parsed.data.shareSlug),
      eq(reportsTable.isPublic, true),
    ));

  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  res.json(GetPublicReportResponse.parse(serializeReport(report)));
});

// GET /reports
router.get("/reports", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = (req as AuthedRequest).clerkUserId;
  const params = ListReportsQueryParams.safeParse(req.query);

  const limit = params.success ? (params.data.limit ?? 20) : 20;
  const offset = params.success ? (params.data.offset ?? 0) : 0;

  const reports = await db
    .select()
    .from(reportsTable)
    .where(eq(reportsTable.userId, clerkUserId))
    .orderBy(desc(reportsTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json(ListReportsResponse.parse(reports.map(serializeReport)));
});

// POST /reports
router.post("/reports", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = (req as AuthedRequest).clerkUserId;

  const parsed = CreateReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const user = await getOrCreateUser(clerkUserId);

  // Check credits
  if (user.credits <= 0) {
    res.status(429).json({ error: "No credits remaining. Purchase more credits to continue roasting." });
    return;
  }

  // Validate URL
  let validUrl: string;
  try {
    const u = new URL(parsed.data.url);
    if (!["http:", "https:"].includes(u.protocol)) throw new Error("Invalid protocol");
    validUrl = u.toString();
  } catch {
    res.status(400).json({ error: "Invalid URL. Please provide a valid http or https URL." });
    return;
  }

  // Deduct 1 credit atomically
  await db.update(usersTable)
    .set({ credits: sql`${usersTable.credits} - 1` })
    .where(and(
      eq(usersTable.clerkId, clerkUserId),
      sql`${usersTable.credits} > 0`,
    ));

  // Create the report record
  const [report] = await db
    .insert(reportsTable)
    .values({
      userId: clerkUserId,
      url: validUrl,
      status: "processing",
    })
    .returning();

  // Kick off async analysis
  analyzeReport(report.id, validUrl).catch(err => {
    logger.error({ err, reportId: report.id }, "Background analysis failed");
  });

  res.status(202).json(GetReportResponse.parse(serializeReport(report)));
});

async function analyzeReport(reportId: number, url: string): Promise<void> {
  try {
    await db.update(reportsTable)
      .set({ status: "processing" })
      .where(eq(reportsTable.id, reportId));

    const extractedData = await extractPageData(url);
    const roastResult = await generateRoast(extractedData);

    await db.update(reportsTable)
      .set({
        status: "completed",
        pageTitle: extractedData.title,
        metaDescription: extractedData.metaDescription,
        overallScore: roastResult.overallScore,
        scoreCategories: roastResult.scoreCategories as unknown as object,
        firstImpression: roastResult.firstImpression,
        roastSummary: roastResult.roastSummary,
        sections: roastResult.sections as unknown as object,
        rewrittenHeadline: roastResult.rewrittenHeadline,
        rewrittenCta: roastResult.rewrittenCta,
        quickWins: roastResult.quickWins as unknown as object,
        rawExtractedData: extractedData as unknown as object,
      })
      .where(eq(reportsTable.id, reportId));

    logger.info({ reportId }, "Report analysis completed");
  } catch (err) {
    logger.error({ err, reportId }, "Report analysis failed");
    await db.update(reportsTable)
      .set({
        status: "failed",
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      })
      .where(eq(reportsTable.id, reportId));
  }
}

// GET /reports/:id
router.get("/reports/:id", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = (req as AuthedRequest).clerkUserId;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetReportParams.safeParse({ id: rawId });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [report] = await db
    .select()
    .from(reportsTable)
    .where(and(
      eq(reportsTable.id, parsed.data.id),
      eq(reportsTable.userId, clerkUserId),
    ));

  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  res.json(GetReportResponse.parse(serializeReport(report)));
});

// DELETE /reports/:id
router.delete("/reports/:id", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = (req as AuthedRequest).clerkUserId;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = DeleteReportParams.safeParse({ id: rawId });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [deleted] = await db
    .delete(reportsTable)
    .where(and(
      eq(reportsTable.id, parsed.data.id),
      eq(reportsTable.userId, clerkUserId),
    ))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  res.sendStatus(204);
});

// PATCH /reports/:id/favorite
router.patch("/reports/:id/favorite", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = (req as AuthedRequest).clerkUserId;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = ToggleFavoriteReportParams.safeParse({ id: rawId });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(reportsTable)
    .where(and(
      eq(reportsTable.id, parsed.data.id),
      eq(reportsTable.userId, clerkUserId),
    ));

  if (!existing) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  const [updated] = await db
    .update(reportsTable)
    .set({ isFavorite: !existing.isFavorite })
    .where(eq(reportsTable.id, parsed.data.id))
    .returning();

  res.json(ToggleFavoriteReportResponse.parse(serializeReport(updated)));
});

// POST /reports/:id/share
router.post("/reports/:id/share", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = (req as AuthedRequest).clerkUserId;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = ShareReportParams.safeParse({ id: rawId });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(reportsTable)
    .where(and(
      eq(reportsTable.id, parsed.data.id),
      eq(reportsTable.userId, clerkUserId),
    ));

  if (!existing) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  let shareSlug = existing.shareSlug;
  if (!shareSlug) {
    shareSlug = crypto.randomBytes(8).toString("hex");
    await db.update(reportsTable)
      .set({ shareSlug, isPublic: true })
      .where(eq(reportsTable.id, parsed.data.id));
  } else {
    await db.update(reportsTable)
      .set({ isPublic: true })
      .where(eq(reportsTable.id, parsed.data.id));
  }

  const domains = process.env.REPLIT_DOMAINS?.split(",")[0] ?? "localhost";
  const shareUrl = `https://${domains}/share/${shareSlug}`;

  res.json(ShareReportResponse.parse({ shareSlug, shareUrl }));
});

// GET /reports/:id/history — before/after comparison for same URL
router.get("/reports/:id/history", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = (req as AuthedRequest).clerkUserId;
  const reportId = parseInt(req.params.id, 10);
  if (isNaN(reportId)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [current] = await db
    .select()
    .from(reportsTable)
    .where(and(eq(reportsTable.id, reportId), eq(reportsTable.userId, clerkUserId)));

  if (!current) { res.status(404).json({ error: "Report not found" }); return; }

  // Find earlier roasts for the same URL (by same user, completed, earlier date)
  const history = await db
    .select({
      id: reportsTable.id,
      overallScore: reportsTable.overallScore,
      createdAt: reportsTable.createdAt,
      status: reportsTable.status,
    })
    .from(reportsTable)
    .where(and(
      eq(reportsTable.userId, clerkUserId),
      eq(reportsTable.url, current.url),
      eq(reportsTable.status, "completed"),
    ))
    .orderBy(desc(reportsTable.createdAt))
    .limit(10);

  res.json(history.map(h => ({
    id: h.id,
    overallScore: h.overallScore,
    createdAt: h.createdAt.toISOString(),
    isCurrent: h.id === reportId,
  })));
});

export default router;
