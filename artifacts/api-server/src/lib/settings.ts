import { eq } from "drizzle-orm";
import { db, settingsTable } from "@workspace/db";
import { logger } from "./logger";

const DEFAULTS: Record<string, string> = {
  openrouter_model: process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.3-70b-instruct:free",
  polar_product_id: process.env.POLAR_PRODUCT_ID ?? "",
  ai_provider: process.env.OPENROUTER_API_KEY ? "openrouter" : "openai",
};

export async function getSetting(key: string): Promise<string> {
  try {
    const [row] = await db
      .select()
      .from(settingsTable)
      .where(eq(settingsTable.key, key));
    return row?.value ?? DEFAULTS[key] ?? "";
  } catch (err) {
    logger.warn({ err, key }, "Failed to get setting, using default");
    return DEFAULTS[key] ?? "";
  }
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db
    .insert(settingsTable)
    .values({ key, value })
    .onConflictDoUpdate({ target: settingsTable.key, set: { value } });
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(settingsTable);
  const result: Record<string, string> = { ...DEFAULTS };
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}
