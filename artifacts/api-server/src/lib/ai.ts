import OpenAI from "openai";
import { logger } from "./logger";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

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
  // Use OpenAI to simulate extraction based on the URL for now
  // In production this would use Puppeteer/Playwright
  logger.info({ url }, "Extracting page data");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 1024,
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
    {
      "title": "Biggest Conversion Killer",
      "content": "<specific, actionable critique — what's broken and exactly why it hurts conversions>",
      "severity": "critical"
    },
    {
      "title": "Copywriting Analysis",
      "content": "<detailed copywriting critique — is the message clear? does it speak to the right person? is there jargon?>",
      "severity": "critical"
    },
    {
      "title": "CTA Analysis",
      "content": "<critique of calls to action — are they visible, compelling, specific? do they create urgency?>",
      "severity": "warning"
    },
    {
      "title": "Trust Signal Analysis",
      "content": "<what trust signals are missing or weak? social proof, testimonials, security badges, logos?>",
      "severity": "warning"
    },
    {
      "title": "SEO Basics",
      "content": "<title tag, meta description, heading structure, keyword targeting critique>",
      "severity": "info"
    },
    {
      "title": "What's Actually Working",
      "content": "<genuine positives — be honest, not empty praise. what is this site doing well?>",
      "severity": "info"
    }
  ],
  "rewrittenHeadline": "<a dramatically better headline that is specific, benefit-driven, and speaks to the target user's pain>",
  "rewrittenCta": "<a better CTA button text that is specific and action-oriented>",
  "quickWins": [
    "<specific actionable fix 1 that can be done this week>",
    "<specific actionable fix 2>",
    "<specific actionable fix 3>",
    "<specific actionable fix 4>",
    "<specific actionable fix 5>"
  ]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 4096,
    messages: [
      {
        role: "system",
        content: "You are a world-class conversion rate optimization expert. You give brutally honest, specific, actionable feedback. You never give generic advice. You always name the specific problem and the specific fix. Return only valid JSON.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "";

  // Clean up any markdown code blocks
  const cleaned = content.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
  const result = JSON.parse(cleaned) as RoastResult;

  return result;
}
