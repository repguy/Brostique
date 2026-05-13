import { pgTable, text, serial, boolean, integer, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reportsTable = pgTable("reports", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  url: text("url").notNull(),
  status: text("status").notNull().default("pending"), // pending | processing | completed | failed
  screenshotUrl: text("screenshot_url"),
  pageTitle: text("page_title"),
  metaDescription: text("meta_description"),
  overallScore: real("overall_score"),
  scoreCategories: jsonb("score_categories"), // ScoreCategory[]
  firstImpression: text("first_impression"),
  roastSummary: text("roast_summary"),
  sections: jsonb("sections"), // RoastSection[]
  rewrittenHeadline: text("rewritten_headline"),
  rewrittenCta: text("rewritten_cta"),
  quickWins: jsonb("quick_wins"), // string[]
  shareSlug: text("share_slug").unique(),
  isPublic: boolean("is_public").notNull().default(false),
  isFavorite: boolean("is_favorite").notNull().default(false),
  lighthouseScore: real("lighthouse_score"),
  performanceScore: real("performance_score"),
  rawExtractedData: jsonb("raw_extracted_data"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertReportSchema = createInsertSchema(reportsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reportsTable.$inferSelect;
