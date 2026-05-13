import { Link } from "wouter";
import { ArrowLeft, Flame, Zap, CreditCard, Share2, Trophy, Gift, Mail, Download, BarChart3, Shield, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      className="mb-12"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
          <Icon className="w-4.5 h-4.5 text-primary" />
        </div>
        <h2 className="text-xl font-black">{title}</h2>
      </div>
      <div className="pl-12 text-muted-foreground leading-relaxed space-y-3 text-sm">
        {children}
      </div>
    </motion.div>
  );
}

function QA({ q, a }: { q: string; a: string }) {
  return (
    <div className="border-b border-border pb-4 last:border-0">
      <p className="font-semibold text-foreground mb-1">{q}</p>
      <p className="text-muted-foreground text-sm">{a}</p>
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
              <Flame className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-black text-base">Brostique</span>
          </div>
          <Link href="/sign-up">
            <Button size="sm" className="rounded-full text-xs px-4">Get Started Free</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-sm font-semibold text-primary mb-6">
            Documentation
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">How Brostique works</h1>
          <p className="text-muted-foreground">Everything you need to know to get the most out of your roasts.</p>
        </div>

        <Section icon={Zap} title="Getting started">
          <p>Brostique analyzes your landing page using AI and gives you a brutally honest conversion rate optimization (CRO) report.</p>
          <p><strong className="text-foreground">1.</strong> Sign up for a free account — you get 3 credits immediately, no card required.</p>
          <p><strong className="text-foreground">2.</strong> Paste any URL into the input box and click "Roast It".</p>
          <p><strong className="text-foreground">3.</strong> Our AI analyzes your page across 8 conversion dimensions and returns a full report in ~30 seconds.</p>
          <p><strong className="text-foreground">4.</strong> Each roast costs 1 credit. Pro subscribers get unlimited roasts.</p>
        </Section>

        <Section icon={BarChart3} title="What the score means">
          <p>Your overall score is out of 100. It's calculated across 8 categories:</p>
          <ul className="space-y-1.5 mt-2">
            {[
              ["Clarity", "How clear is your headline and value proposition?"],
              ["Trust", "Social proof, testimonials, logos, guarantees"],
              ["CTA Quality", "Is your call-to-action specific and compelling?"],
              ["Copywriting", "Headlines, sub-copy, tone, benefit-driven language"],
              ["Visual Hierarchy", "Does the layout guide the eye to conversion?"],
              ["SEO Basics", "Title tag, meta description, heading structure"],
              ["Mobile UX", "How does it perform on smaller screens?"],
              ["Emotional Impact", "Does it create urgency, desire, or FOMO?"],
            ].map(([name, desc]) => (
              <li key={name} className="flex gap-2">
                <span className="text-primary font-semibold shrink-0">{name}:</span>
                <span>{desc}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3">Scores below 40 are critical. 40–70 needs work. Above 70 is solid.</p>
        </Section>

        <Section icon={CreditCard} title="Credits & pricing">
          <p>Each roast costs 1 credit. New accounts start with 3 free credits.</p>
          <p>You can buy credit packs or upgrade to Pro for unlimited roasts:</p>
          <ul className="space-y-1 mt-2">
            <li>• <strong className="text-foreground">Starter Pack</strong> — 10 credits for $9</li>
            <li>• <strong className="text-foreground">Growth Pack</strong> — 25 credits for $19</li>
            <li>• <strong className="text-foreground">Scale Pack</strong> — 100 credits for $49</li>
            <li>• <strong className="text-foreground">Pro</strong> — $29/month, unlimited roasts + all features</li>
          </ul>
        </Section>

        <Section icon={Gift} title="Referral program">
          <p>Share your unique referral link with others. When someone signs up using your link and applies your code:</p>
          <ul className="space-y-1 mt-2">
            <li>• <strong className="text-foreground">They get</strong> 3 bonus credits added to their account</li>
            <li>• <strong className="text-foreground">You get</strong> 3 bonus credits for each successful referral</li>
          </ul>
          <p>Find your referral link in your Dashboard under the "Account" tab.</p>
        </Section>

        <Section icon={Share2} title="Sharing reports">
          <p>Every completed report can be shared publicly. Click "Share" on any report to generate a public link.</p>
          <p>Shared reports are visible to anyone with the link — no sign-in required. They appear on the public leaderboard if enabled.</p>
        </Section>

        <Section icon={Trophy} title="Leaderboard">
          <p>The public leaderboard shows the top worst and best-scored sites whose reports have been shared publicly.</p>
          <p>Your report appears automatically on the leaderboard when you share it. You can remove it by making the report private from your dashboard.</p>
        </Section>

        <Section icon={RefreshCw} title="Before/After tracking">
          <p>You can re-roast any URL you've already analyzed. Brostique tracks your score history and shows a comparison between your original and latest scores.</p>
          <p>Great for validating that your CRO changes actually moved the needle.</p>
        </Section>

        <Section icon={Download} title="PDF export">
          <p>Download any completed report as a PDF from the report page. The PDF includes your full roast, score breakdown, rewritten copy, and quick wins list.</p>
          <p>Useful for sharing with your team, clients, or investors.</p>
        </Section>

        <Section icon={Mail} title="Email delivery">
          <p>Send any report directly to your email (or any email address). Click the email button on a completed report page.</p>
          <p>Note: Email delivery requires SMTP configuration by the app administrator.</p>
        </Section>

        <Section icon={Shield} title="Privacy & data">
          <p>Your URLs and reports are private by default. Only you can see them unless you explicitly share a public link.</p>
          <p>We do not store your full page content — only the AI-extracted summary and roast data.</p>
        </Section>

        <div className="border border-border rounded-2xl p-6 bg-card mt-6">
          <h2 className="text-lg font-black mb-5">FAQ</h2>
          <div className="space-y-5">
            <QA q="Does Brostique actually visit my website?" a="Our AI analyzes your URL based on publicly available information. It uses its knowledge of the domain and any accessible content to generate realistic, specific feedback." />
            <QA q="How long does a roast take?" a="Usually 15–45 seconds. Complex pages may take slightly longer." />
            <QA q="Can I roast the same URL twice?" a="Yes — use the Before/After feature to track your improvements over time. Each roast costs 1 credit (Pro = unlimited)." />
            <QA q="What if my roast fails?" a="If a roast fails, you are not charged a credit. Try again — occasional AI hiccups are normal." />
            <QA q="Can I delete my reports?" a="Yes. From your dashboard, click the trash icon on any report to delete it permanently." />
            <QA q="Is there an API?" a="Not yet publicly. If you're interested in API access, reach out to us." />
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground text-sm mb-4">Ready to find out what's costing you conversions?</p>
          <Link href="/sign-up">
            <Button className="rounded-full shadow-[0_0_20px_rgba(255,87,34,0.3)]">
              Get 3 Free Roasts <Flame className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
