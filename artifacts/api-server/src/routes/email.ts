import { Router, type IRouter } from "express";
import { db, reportsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/requireAuth";
import { logger } from "../lib/logger";
import type { Request } from "express";
import nodemailer from "nodemailer";

const router: IRouter = Router();
type AuthedRequest = Request & { clerkUserId: string };

function getTransporter() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT ?? "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  // Fallback: ethereal test account (dev only)
  return null;
}

function buildReportEmail(report: {
  url: string;
  overallScore: number | null;
  pageTitle: string | null;
  roastSummary: string | null;
  quickWins: unknown;
  shareSlug: string | null;
}, shareUrl: string): { subject: string; html: string; text: string } {
  const score = report.overallScore ?? 0;
  const scoreColor = score >= 70 ? "#10b981" : score >= 40 ? "#f97316" : "#ef4444";
  const wins = (report.quickWins as string[] | null) ?? [];

  const subject = `Your Brostique roast report: ${report.url.replace(/^https?:\/\//, "")} scored ${score}/100`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="background:#0a0a0f;color:#f8fafc;font-family:'Inter',Arial,sans-serif;margin:0;padding:0;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="font-size:24px;">🔥</span>
        <span style="font-size:20px;font-weight:900;letter-spacing:-0.5px;">Brostique</span>
      </div>
      <p style="color:#94a3b8;margin:0;font-size:14px;">Your roast report is ready</p>
    </div>

    <div style="background:#111117;border:1px solid #1e1e2e;border-radius:16px;padding:24px;margin-bottom:24px;text-align:center;">
      <p style="color:#94a3b8;font-size:13px;margin:0 0 8px;">Analyzed URL</p>
      <p style="font-size:16px;font-weight:700;margin:0 0 20px;word-break:break-all;">${report.url}</p>
      <div style="display:inline-block;background:${scoreColor}20;border:2px solid ${scoreColor}40;border-radius:50%;width:80px;height:80px;line-height:80px;font-size:28px;font-weight:900;color:${scoreColor};">
        ${score}
      </div>
      <p style="color:#94a3b8;font-size:13px;margin:8px 0 0;">out of 100</p>
    </div>

    ${report.roastSummary ? `
    <div style="background:#111117;border:1px solid #1e1e2e;border-radius:12px;padding:20px;margin-bottom:20px;">
      <p style="font-weight:700;margin:0 0 8px;font-size:15px;">The Verdict</p>
      <p style="color:#94a3b8;margin:0;line-height:1.6;font-size:14px;">${report.roastSummary}</p>
    </div>` : ""}

    ${wins.length > 0 ? `
    <div style="background:#111117;border:1px solid #1e1e2e;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="font-weight:700;margin:0 0 12px;font-size:15px;">⚡ Quick Wins</p>
      <ul style="margin:0;padding:0;list-style:none;">
        ${wins.slice(0, 3).map(w => `<li style="padding:6px 0;border-bottom:1px solid #1e1e2e;color:#94a3b8;font-size:14px;line-height:1.5;">→ ${w}</li>`).join("")}
      </ul>
    </div>` : ""}

    ${shareUrl ? `
    <div style="text-align:center;">
      <a href="${shareUrl}" style="display:inline-block;background:#ff5722;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:50px;text-decoration:none;box-shadow:0 0 20px rgba(255,87,34,0.4);">
        View Full Report →
      </a>
    </div>` : ""}

    <p style="color:#475569;font-size:12px;text-align:center;margin-top:32px;">
      Sent by Brostique · AI-powered conversion rate optimization
    </p>
  </div>
</body>
</html>`;

  const text = `Your Brostique Roast Report\n\nURL: ${report.url}\nScore: ${score}/100\n\n${report.roastSummary ?? ""}\n\nQuick Wins:\n${wins.slice(0, 3).map(w => `• ${w}`).join("\n")}\n\nView full report: ${shareUrl}`;

  return { subject, html, text };
}

// POST /reports/:id/email
router.post("/reports/:id/email", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = (req as AuthedRequest).clerkUserId;
  const reportId = parseInt(req.params.id, 10);
  const { to } = req.body as { to?: string };

  if (isNaN(reportId)) {
    res.status(400).json({ error: "Invalid report ID." });
    return;
  }

  const [report] = await db
    .select()
    .from(reportsTable)
    .where(and(eq(reportsTable.id, reportId), eq(reportsTable.userId, clerkUserId)));

  if (!report) {
    res.status(404).json({ error: "Report not found." });
    return;
  }

  if (report.status !== "completed") {
    res.status(400).json({ error: "Report is not yet completed." });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkUserId));
  const recipientEmail = to || user?.email;

  if (!recipientEmail) {
    res.status(400).json({ error: "No email address found. Please provide an email address." });
    return;
  }

  const domain = process.env.REPLIT_DOMAINS?.split(",")[0] ?? "localhost";

  // Ensure report is public with a share slug for the email link
  let shareSlug = report.shareSlug;
  if (!shareSlug) {
    const crypto = await import("crypto");
    shareSlug = crypto.randomBytes(8).toString("hex");
    await db.update(reportsTable)
      .set({ shareSlug, isPublic: true })
      .where(eq(reportsTable.id, reportId));
  }

  const shareUrl = `https://${domain}/share/${shareSlug}`;
  const { subject, html, text } = buildReportEmail({
    url: report.url,
    overallScore: report.overallScore,
    pageTitle: report.pageTitle,
    roastSummary: report.roastSummary,
    quickWins: report.quickWins,
    shareSlug,
  }, shareUrl);

  const transporter = getTransporter();
  if (!transporter) {
    logger.warn("No SMTP config, email not sent");
    res.status(503).json({ error: "Email delivery not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in your secrets." });
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? `"Brostique" <hello@brostique.com>`,
      to: recipientEmail,
      subject,
      html,
      text,
    });

    res.json({ success: true, sentTo: recipientEmail });
  } catch (err) {
    logger.error({ err }, "Failed to send email");
    res.status(500).json({ error: "Failed to send email. Please check your SMTP configuration." });
  }
});

export default router;
