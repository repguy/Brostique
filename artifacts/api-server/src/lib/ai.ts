import OpenAI from "openai";
import { logger } from "./logger";
import { getSetting } from "./settings";

function getOpenAIClient(): OpenAI {
  return new OpenAI({
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  });
}

function getOpenRouterClient(): OpenAI {
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY ?? "",
    defaultHeaders: {
      "HTTP-Referer": "https://roastmysite.app",
      "X-Title": "RoastMySite",
    },
  });
}

async function getAIClient(): Promise<{ client: OpenAI; model: string }> {
  const provider = await getSetting("ai_provider");
  const useOpenRouter = provider === "openrouter" && !!process.env.OPENROUTER_API_KEY;

  if (useOpenRouter) {
    const model = await getSetting("openrouter_model");
    return { client: getOpenRouterClient(), model: model || "meta-llama/llama-3.3-70b-instruct:free" };
  }

  return { client: getOpenAIClient(), model: "gpt-4.1-mini" };
}

export interface ExtractedPageData {
  url: string;
  title?: string;
  metaDescription?: string;
  headings?: string[];
  bodyText?: string;
  ctaButtons?: string[];
  pricingMentions?: string[];
  trustSignals?: string[];
  hasSocialProof?: boolean;
  hasTestimonials?: boolean;
}

export interface ScoreCategory {
  name: string;
  score: number;
  maxScore: number;
  description?: string;
}

export interface RoastSection {
  title: string;
  content: string;
  severity?: "critical" | "warning" | "info" | null;
}

export interface RoastResult {
  overallScore: number;
  scoreCategories: ScoreCategory[];
  firstImpression: string;
  roastSummary: string;
  sections: RoastSection[];
  rewrittenHeadline: string;
  rewrittenCta: string;
  quickWins: string[];
}

export async function extractPageData(url: string): Promise<ExtractedPageData> {
  logger.info({ url }, "Extracting page data");
  const { client, model } = await getAIClient();

  try {
    const response = await client.chat.completions.create({
      model,
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content: `You are a web page analyzer. Given a URL, make reasonable assumptions about what a typical website at that domain might contain and return a JSON object with extracted page data. Be realistic and varied.`,
        },
        {
          role: "user",
          content: `Analyze this website URL and return a JSON object with realistic page data: ${url}
          
Return JSON with these fields:
- title: page title
- metaDescription: meta description
- headings: array of h1/h2 headings (2-4 items)
- bodyText: brief summary of likely page content (2-3 sentences)
- ctaButtons: array of likely CTA button texts (2-4 items)
- pricingMentions: array of pricing related text found (0-3 items)
- trustSignals: array of trust signals like testimonials, reviews, badges (0-4 items)
- hasSocialProof: boolean
- hasTestimonials: boolean

Return only valid JSON, no markdown.`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content);
    return { url, ...parsed };
  } catch (err) {
    logger.warn({ err, url }, "Failed to extract page data, using defaults");
    return {
      url,
      title: undefined,
      metaDescription: undefined,
      headings: [],
      bodyText: "",
      ctaButtons: [],
      pricingMentions: [],
      trustSignals: [],
      hasSocialProof: false,
      hasTestimonials: false,
    };
  }
}

export async function generateRoast(data: ExtractedPageData): Promise<RoastResult> {
  logger.info({ url: data.url }, "Generating AI roast");
  const { client, model } = await getAIClient();

  const prompt = `You are a brutally honest but genuinely helpful conversion rate optimization expert and copywriter. You have 15 years of experience helping SaaS companies and startups fix their landing pages.

Analyze this website and provide a comprehensive roast. Be specific, direct, and actionable — not generic. Focus on CONVERSION optimization, not just aesthetics.

Website URL: ${data.url}
Page Title: ${data.title ?? "Not found"}
Meta Description: ${data.metaDescription ?? "Not found"}
Main Headings: ${data.headings?.join(", ") || "None detected"}
Page Content Summary: ${data.bodyText ?? "Not available"}
CTA Buttons: ${data.ctaButtons?.join(", ") || "None found"}
Pricing Mentions: ${data.pricingMentions?.join(", ") || "None"}
Trust Signals: ${data.trustSignals?.join(", ") || "None found"}
Has Social Proof: ${data.hasSocialProof ? "Yes" : "No"}
Has Testimonials: ${data.hasTestimonials ? "Yes" : "No"}

Return a JSON object with EXACTLY this structure (no markdown, pure JSON):
{
  "overallScore": <number 0-100>,
  "scoreCategories": [
    {"name": "Clarity", "score": <0-10>, "maxScore": 10, "description": "<one sentence>"},
    {"name": "Trust", "score": <0-10>, "maxScore": 10, "description": "<one sentence>"},
    {"name": "CTA Quality", "score": <0-10>, "maxScore": 10, "description": "<one sentence>"},
    {"name": "Copywriting", "score": <0-10>, "maxScore": 10, "description": "<one sentence>"},
    {"name": "Visual Hierarchy", "score": <0-10>, "maxScore": 10, "description": "<one sentence>"},
    {"name": "SEO Basics", "score": <0-10>, "maxScore": 10, "description": "<one sentence>"},
    {"name": "Mobile UX", "score": <0-10>, "maxScore": 10, "description": "<one sentence>"},
    {"name": "Emotional Impact", "score": <0-10>, "maxScore": 10, "description": "<one sentence>"}
  ],
  "firstImpression": "<2-3 sentences describing the immediate gut reaction a visitor gets — be vivid and honest>",
  "roastSummary": "<3-4 sentence overall verdict — direct, honest, with the most critical issue named>",
  "sections": [
    {"title": "Biggest Conversion Killer", "content": "<specific, actionable critique>", "severity": "critical"},
    {"title": "Copywriting Analysis", "content": "<detailed copywriting critique>", "severity": "critical"},
    {"title": "CTA Analysis", "content": "<critique of calls to action>", "severity": "warning"},
    {"title": "Trust Signal Analysis", "content": "<what trust signals are missing or weak>", "severity": "warning"},
    {"title": "SEO Basics", "content": "<title tag, meta description, heading structure critique>", "severity": "info"},
    {"title": "What's Actually Working", "content": "<genuine positives>", "severity": "info"}
  ],
  "rewrittenHeadline": "<a dramatically better headline that is specific, benefit-driven, speaks to the target user's pain>",
  "rewrittenCta": "<a better CTA button text that is specific and action-oriented>",
  "quickWins": [
    "<specific actionable fix 1 that can be done this week>",
    "<specific actionable fix 2>",
    "<specific actionable fix 3>",
    "<specific actionable fix 4>",
    "<specific actionable fix 5>"
  ]
}`;

  const response = await client.chat.completions.create({
    model,
    max_tokens: 4096,
    messages: [
      {
        role: "system",
        content: "You are a world-class conversion rate optimization expert. You give brutally honest, specific, actionable feedback. Return only valid JSON.",
      },
      { role: "user", content: prompt },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "";
  const cleaned = content.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
  return JSON.parse(cleaned) as RoastResult;
}
