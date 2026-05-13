import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import {
  Share2, Heart, ExternalLink, ShieldAlert, Info, Lightbulb, Flame,
  TrendingUp, AlertTriangle, CheckCircle2, Copy, Zap, Target, Sparkles,
  Bot, ChevronDown, ChevronUp, BarChart3, Twitter, Download, Mail, Lock
} from "lucide-react";
import { useToggleFavoriteReport, useShareReport } from "@workspace/api-client-react";
import type { Report } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface ReportViewProps {
  report: Report;
  isShared?: boolean;
}

function getScoreColor(score: number | null | undefined) {
  if (score == null) return "text-muted-foreground";
  if (score >= 70) return "text-emerald-500";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
}

function getScoreGlow(score: number | null | undefined) {
  if (score == null) return "";
  if (score >= 70) return "shadow-[0_0_40px_rgba(16,185,129,0.25)]";
  if (score >= 40) return "shadow-[0_0_40px_rgba(249,115,22,0.25)]";
  return "shadow-[0_0_40px_rgba(239,68,68,0.25)]";
}

function getScoreLabel(score: number | null | undefined) {
  if (score == null) return "—";
  if (score >= 80) return "Solid Foundation";
  if (score >= 60) return "Needs Work";
  if (score >= 40) return "Underperforming";
  if (score >= 20) return "Critically Flawed";
  return "On Fire 🔥";
}

function getBarColor(pct: number) {
  if (pct >= 70) return "bg-emerald-500";
  if (pct >= 40) return "bg-orange-500";
  return "bg-red-500";
}

function getBarGlow(pct: number) {
  if (pct >= 70) return "shadow-[0_0_8px_rgba(16,185,129,0.5)]";
  if (pct >= 40) return "shadow-[0_0_8px_rgba(249,115,22,0.5)]";
  return "shadow-[0_0_8px_rgba(239,68,68,0.5)]";
}

function getSeverityConfig(severity: string | null | undefined) {
  switch (severity) {
    case 'critical': return {
      color: 'text-red-400', bg: 'bg-red-500/8 border-red-500/25',
      badgeClass: 'bg-red-500/15 text-red-400 border-red-500/30',
      icon: <AlertTriangle className="w-4 h-4 text-red-400" />,
      dotColor: 'bg-red-500',
    };
    case 'warning': return {
      color: 'text-orange-400', bg: 'bg-orange-500/8 border-orange-500/25',
      badgeClass: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
      icon: <Zap className="w-4 h-4 text-orange-400" />,
      dotColor: 'bg-orange-500',
    };
    default: return {
      color: 'text-blue-400', bg: 'bg-blue-500/8 border-blue-500/25',
      badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      icon: <Info className="w-4 h-4 text-blue-400" />,
      dotColor: 'bg-blue-500',
    };
  }
}

function AnimatedScore({ target, color }: { target: number; color: string }) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    const steps = 60;
    const stepTime = duration / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += target / steps;
      if (current >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(current));
    }, stepTime);
    return () => clearInterval(timer);
  }, [inView, target]);

  const circumference = 2 * Math.PI * 46;
  const progress = (value / 100) * circumference;

  return (
    <div ref={ref} className="relative flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/20" />
        <motion.circle
          cx="50" cy="50" r="46"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          className={color}
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${progress} ${circumference}` }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="text-center relative z-10">
        <div className={`text-6xl md:text-7xl font-black tracking-tighter tabular-nums ${color}`}>{value}</div>
        <div className="text-xs font-semibold text-muted-foreground tracking-widest uppercase mt-1">Score</div>
      </div>
    </div>
  );
}

function useInView(ref: React.RefObject<Element | null>, options: { once?: boolean } = {}) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        if (options.once) obs.disconnect();
      } else if (!options.once) {
        setInView(false);
      }
    });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref, options.once]);
  return inView;
}

function AnimatedBar({ pct, delay = 0 }: { pct: number; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref as React.RefObject<Element>, { once: true });
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => setWidth(pct), delay * 1000 + 100);
    return () => clearTimeout(t);
  }, [inView, pct, delay]);

  return (
    <div ref={ref} className="h-2 bg-muted/30 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${getBarColor(pct)} ${getBarGlow(pct)}`}
        style={{ width: `${width}%`, transitionDelay: `${delay * 1000}ms` }}
      />
    </div>
  );
}

function generateAIPrompt(report: Report): string {
  const url = report.url;
  const title = report.pageTitle || "Untitled Page";
  const score = report.overallScore ?? "N/A";
  const label = getScoreLabel(report.overallScore);
  const scoreCategories = (report.scoreCategories as any[] | null) ?? [];
  const sections = (report.sections as any[] | null) ?? [];
  const quickWins = (report.quickWins as string[] | null) ?? [];

  const criticals = sections.filter((s: any) => s.severity === "critical");
  const warnings = sections.filter((s: any) => s.severity === "warning");
  const infos = sections.filter((s: any) => s.severity !== "critical" && s.severity !== "warning");

  let prompt = `You are an expert conversion rate optimization (CRO) specialist and UX designer. I have a landing page that has been professionally analyzed and scored. I need you to help me fix it with specific, implementable changes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LANDING PAGE ANALYSIS REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

URL: ${url}
Page Title: ${title}
Overall Conversion Score: ${score}/100 — ${label}

`;

  if (report.firstImpression) {
    prompt += `FIRST 3-SECOND IMPRESSION:
${report.firstImpression}

`;
  }

  if (report.roastSummary) {
    prompt += `OVERALL ROAST SUMMARY:
${report.roastSummary}

`;
  }

  if (scoreCategories.length > 0) {
    prompt += `SCORE BREAKDOWN BY CATEGORY:\n`;
    scoreCategories.forEach((cat: any) => {
      const pct = Math.round((cat.score / cat.maxScore) * 100);
      const bar = "█".repeat(Math.round(pct / 10)) + "░".repeat(10 - Math.round(pct / 10));
      prompt += `  ${cat.name.padEnd(25)} ${bar} ${cat.score}/${cat.maxScore} (${pct}%)\n`;
    });
    prompt += "\n";
  }

  if (criticals.length > 0) {
    prompt += `🚨 CRITICAL ISSUES (fix immediately — biggest conversion killers):\n`;
    criticals.forEach((s: any, i: number) => {
      prompt += `\n${i + 1}. ${s.title}\n${s.content}\n`;
    });
    prompt += "\n";
  }

  if (warnings.length > 0) {
    prompt += `⚠️ WARNINGS (high-impact improvements):\n`;
    warnings.forEach((s: any, i: number) => {
      prompt += `\n${i + 1}. ${s.title}\n${s.content}\n`;
    });
    prompt += "\n";
  }

  if (infos.length > 0) {
    prompt += `ℹ️ ADDITIONAL OBSERVATIONS:\n`;
    infos.forEach((s: any, i: number) => {
      prompt += `\n${i + 1}. ${s.title}\n${s.content}\n`;
    });
    prompt += "\n";
  }

  if (quickWins.length > 0) {
    prompt += `✅ QUICK WINS (implement today, no dev required):\n`;
    quickWins.forEach((win: string, i: number) => {
      prompt += `${i + 1}. ${win}\n`;
    });
    prompt += "\n";
  }

  if (report.rewrittenHeadline || report.rewrittenCta) {
    prompt += `AI-SUGGESTED COPY IMPROVEMENTS:\n`;
    if (report.rewrittenHeadline) {
      prompt += `  Improved Headline: "${report.rewrittenHeadline}"\n`;
    }
    if (report.rewrittenCta) {
      prompt += `  Stronger CTA: "${report.rewrittenCta}"\n`;
    }
    prompt += "\n";
  }

  prompt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Based on the analysis above, provide a complete, actionable improvement plan:

1. REWRITE THE HERO SECTION
   - New headline (clear value prop, specific, benefit-led)
   - New subheadline (supports headline, removes objections)
   - New CTA button copy (action-oriented, low friction)
   - Above-the-fold layout recommendations

2. FIX ALL CRITICAL ISSUES
   - For each critical issue listed above, provide the exact fix with example copy or UI change

3. TRUST & SOCIAL PROOF
   - What trust signals to add and where to place them
   - Specific copy for testimonials, social proof, or credibility markers

4. CONVERSION FLOW IMPROVEMENTS
   - Remove friction from the user journey
   - Optimize the visual hierarchy for the primary CTA
   - Address the specific score weaknesses identified above

5. COPY REWRITE (if needed)
   - Rewrite any weak copy sections identified
   - Ensure messaging matches the visitor's intent and pain points

IMPORTANT: Give me specific, implementable examples — not generic advice. Include exact copy where possible. Format changes clearly so I know exactly what to update in my code or CMS.`;

  return prompt;
}

const ANALYSIS_STATES = [
  "Capturing screenshot...",
  "Reading your copy...",
  "Analyzing CTAs...",
  "Detecting trust signals...",
  "Auditing visual hierarchy...",
  "Roasting your funnel...",
  "Calculating damage...",
];

export default function ReportView({ report, isShared = false }: ReportViewProps) {
  const { toast } = useToast();
  const toggleFav = useToggleFavoriteReport();
  const shareReport = useShareReport();
  const [stateIndex, setStateIndex] = useState(0);
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const isPending = report.status === 'pending' || report.status === 'processing';

  useEffect(() => {
    if (!isPending) return;
    const t = setInterval(() => setStateIndex(i => (i + 1) % ANALYSIS_STATES.length), 2000);
    return () => clearInterval(t);
  }, [isPending]);

  const handleShare = () => {
    if (isShared) {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied!", description: "Share this URL with anyone." });
      return;
    }
    shareReport.mutate({ id: report.id }, {
      onSuccess: (data) => {
        navigator.clipboard.writeText(data.shareUrl);
        toast({ title: "Link copied!", description: "Public report link copied to clipboard." });
      }
    });
  };

  const handleToggleFav = () => {
    if (isShared) return;
    toggleFav.mutate({ id: report.id }, {
      onSuccess: (data) => toast({ title: data.isFavorite ? "Saved to favorites" : "Removed from favorites" })
    });
  };

  const handleCopyPrompt = () => {
    const prompt = generateAIPrompt(report);
    navigator.clipboard.writeText(prompt);
    setPromptCopied(true);
    toast({ title: "Prompt copied!", description: "Paste it into ChatGPT, Claude, or Cursor." });
    setTimeout(() => setPromptCopied(false), 2500);
  };

  const handleTweet = () => {
    const score = report.overallScore ? Math.round(report.overallScore) : 0;
    const url = report.shareSlug
      ? `${window.location.origin}/share/${report.shareSlug}`
      : window.location.href;
    const domain = report.url.replace(/^https?:\/\//, "").split("/")[0];
    const text = `Just roasted ${domain} with @Brostique — it scored ${score}/100. ${score < 40 ? "Ouch. 🔥" : score < 70 ? "Needs work. ⚠️" : "Solid! ✅"} Check the full breakdown:`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
  };

  const handlePdfExport = async () => {
    if (pdfExporting) return;
    setPdfExporting(true);
    toast({ title: "Generating PDF...", description: "This may take a few seconds." });
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;
      const el = reportRef.current;
      if (!el) throw new Error("No element");
      const canvas = await html2canvas(el, { scale: 1.5, useCORS: true, backgroundColor: "#0a0a0f" });
      const imgData = canvas.toDataURL("image/jpeg", 0.85);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pageW) / canvas.width;
      let y = 0;
      while (y < imgH) {
        if (y > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, -y, pageW, imgH);
        y += pageH;
      }
      const domain = report.url.replace(/^https?:\/\//, "").split("/")[0].replace(/\./g, "-");
      pdf.save(`brostique-roast-${domain}.pdf`);
      toast({ title: "PDF saved!", description: "Your report has been downloaded." });
    } catch (err) {
      toast({ title: "PDF export failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setPdfExporting(false);
    }
  };

  const handleSendEmail = async () => {
    if (emailSending || isShared) return;
    setEmailSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/reports/${report.id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(d.error ?? "Failed");
      }
      const d = await res.json() as { sentTo?: string };
      toast({ title: "Report emailed!", description: `Sent to ${d.sentTo ?? "your email"}.` });
    } catch (err) {
      toast({ title: "Email failed", description: (err as Error).message || "Could not send email.", variant: "destructive" });
    } finally {
      setEmailSending(false);
    }
  };

  if (report.status === 'failed') {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-lg">
        <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-3xl font-black mb-3">Roast Failed</h1>
        <p className="text-muted-foreground leading-relaxed">
          We couldn't analyze <span className="text-foreground font-mono text-sm">{report.url}</span>. The site may be blocking bots, offline, or took too long to respond.
        </p>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-xl flex flex-col items-center">
        <div className="relative w-28 h-28 mb-8">
          <div className="absolute inset-0 rounded-full border-[3px] border-muted/30" />
          <div className="absolute inset-0 rounded-full border-[3px] border-primary border-t-transparent animate-spin" />
          <div className="absolute inset-3 rounded-full border-[2px] border-primary/30 border-b-transparent animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Flame className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </div>
        <h1 className="text-3xl font-black mb-3">Roasting in progress...</h1>
        <AnimatePresence mode="wait">
          <motion.p
            key={stateIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="text-primary/80 font-medium mb-4"
          >
            {ANALYSIS_STATES[stateIndex]}
          </motion.p>
        </AnimatePresence>
        <p className="text-muted-foreground text-sm mb-10 leading-relaxed max-w-sm">
          Analyzing <span className="text-foreground font-mono">{report.url.replace(/^https?:\/\//, '')}</span>. Our AI is tearing apart your UX, copy, and conversion signals.
        </p>
        <div className="space-y-3 w-full max-w-md opacity-40">
          {[100, 80, 65, 90, 50].map((w, i) => (
            <div key={i} className="h-3 bg-primary/20 rounded-full animate-pulse" style={{ width: `${w}%`, animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  const scoreColor = getScoreColor(report.overallScore);
  const scoreGlow = getScoreGlow(report.overallScore);
  const scoreLabel = getScoreLabel(report.overallScore);
  const scoreCategories = (report.scoreCategories as any[] | null) ?? [];
  const sections = (report.sections as any[] | null) ?? [];
  const quickWins = (report.quickWins as string[] | null) ?? [];

  const aiPrompt = generateAIPrompt(report);
  const promptPreview = aiPrompt.slice(0, 400) + "...";

  return (
    <div className="pb-24" ref={reportRef}>
      {/* Hero */}
      <section className="bg-card/60 border-b border-border py-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-primary/6 rounded-full blur-[120px]" />
        </div>
        <div className="container mx-auto px-4 max-w-5xl relative z-10">
          <div className="flex flex-col gap-5 mb-8">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black truncate">{report.pageTitle || 'Untitled Page'}</h1>
                <a href={report.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors shrink-0">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <p className="text-muted-foreground font-mono text-sm">{report.url.replace(/^https?:\/\//, '')}</p>
              <p className="text-xs text-muted-foreground/60 mt-1">{format(new Date(report.createdAt), 'MMMM d, yyyy · h:mm a')}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5 rounded-xl bg-background h-8 px-3 text-xs">
                <Share2 className="w-3.5 h-3.5" /> Share
              </Button>
              <Button variant="outline" size="sm" onClick={handleTweet} className="gap-1.5 rounded-xl bg-background text-sky-400 border-sky-500/30 hover:bg-sky-500/10 h-8 px-3 text-xs">
                <Twitter className="w-3.5 h-3.5" /> Tweet
              </Button>
              {!isShared && (
                <>
                  <Button variant="outline" size="sm" onClick={handlePdfExport} disabled={pdfExporting} className="gap-1.5 rounded-xl bg-background h-8 px-3 text-xs">
                    <Download className="w-3.5 h-3.5" /> {pdfExporting ? "Exporting…" : "PDF"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleSendEmail} disabled={emailSending} className="gap-1.5 rounded-xl bg-background h-8 px-3 text-xs">
                    <Mail className="w-3.5 h-3.5" /> {emailSending ? "Sending…" : "Email"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleToggleFav}
                    className={`gap-1.5 rounded-xl bg-background h-8 px-3 text-xs ${report.isFavorite ? 'border-primary text-primary' : ''}`}
                  >
                    <Heart className="w-3.5 h-3.5" fill={report.isFavorite ? "currentColor" : "none"} />
                    {report.isFavorite ? 'Saved' : 'Save'}
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-[220px_1fr] gap-8 items-center">
            <div className="flex flex-col items-center">
              <div className={`relative w-44 h-44 md:w-52 md:h-52 rounded-full bg-background flex items-center justify-center ${scoreGlow}`}>
                <AnimatedScore target={report.overallScore ?? 0} color={scoreColor} />
              </div>
              <div className={`mt-3 text-sm font-bold ${scoreColor}`}>{scoreLabel}</div>
            </div>
            <div className="relative bg-background border border-border/60 rounded-3xl p-6 md:p-8">
              <div className="absolute -top-3.5 left-6 bg-primary px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,87,34,0.4)]">
                <Flame className="w-3.5 h-3.5 text-primary-foreground" />
                <span className="text-xs font-bold text-primary-foreground uppercase tracking-wider">The Roast</span>
              </div>
              <p className="text-base md:text-lg leading-relaxed text-foreground/85 whitespace-pre-wrap pt-2">
                {report.roastSummary || "No summary available."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Score Breakdown — full-width bar chart */}
      {scoreCategories.length > 0 && (
        <section className="border-b border-border bg-card/30 py-10">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-lg font-black mb-8 flex items-center gap-2.5">
              <BarChart3 className="w-5 h-5 text-primary" /> Score Breakdown
            </h2>
            <div className="grid sm:grid-cols-2 gap-x-12 gap-y-5">
              {scoreCategories.map((cat: any, i: number) => {
                const pct = Math.round((cat.score / cat.maxScore) * 100);
                const c = getScoreColor(pct);
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06, duration: 0.4 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-foreground/80">{cat.name}</span>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-xl font-black tabular-nums ${c}`}>{cat.score}</span>
                        <span className="text-xs text-muted-foreground">/{cat.maxScore}</span>
                      </div>
                    </div>
                    <AnimatedBar pct={pct} delay={i * 0.06} />
                    <div className="mt-1 flex justify-between">
                      <span className="text-[10px] text-muted-foreground/50">0</span>
                      <span className={`text-[10px] font-semibold ${c}`}>{pct}%</span>
                      <span className="text-[10px] text-muted-foreground/50">{cat.maxScore}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Main content */}
      <div className="container mx-auto px-4 max-w-5xl py-12">
        <div className="grid md:grid-cols-[1fr_340px] gap-10">

          {/* Left: Analysis sections */}
          <div className="space-y-5">
            <h2 className="text-xl font-black flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-primary" /> Deep Dive Analysis
            </h2>

            {report.firstImpression && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5 }}
                className="border border-blue-500/25 bg-blue-500/5 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Info className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">3-Second First Impression</h3>
                    <p className="text-xs text-muted-foreground">What a first-time visitor sees instantly</p>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed">{report.firstImpression}</p>
              </motion.div>
            )}

            {sections.map((section: any, i: number) => {
              const sev = getSeverityConfig(section.severity);
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.06, duration: 0.5 }}
                  className={`border rounded-2xl p-6 relative overflow-hidden ${sev.bg}`}
                >
                  <div className={`absolute top-0 left-0 w-1 h-full rounded-l-2xl ${sev.dotColor}`} />
                  <div className="flex items-start justify-between gap-4 mb-4 pl-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-background/60 flex items-center justify-center shrink-0">
                        {sev.icon}
                      </div>
                      <h3 className="font-bold text-base">{section.title}</h3>
                    </div>
                    {section.severity && (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${sev.badgeClass} shrink-0`}>
                        {section.severity}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-sm pl-2">{section.content}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-5">
            {/* AI Rewrites */}
            {(report.rewrittenHeadline || report.rewrittenCta) && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-primary/8 border border-primary/25 rounded-2xl p-6 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-[60px] pointer-events-none" />
                <h2 className="text-base font-black mb-5 flex items-center gap-2 text-primary">
                  <Lightbulb className="w-4 h-4" /> AI Rewrites
                </h2>
                {report.rewrittenHeadline && (
                  <div className="mb-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-2.5">Improved Headline</p>
                    <div className="bg-background border border-primary/30 p-4 rounded-xl relative group">
                      <p className="font-serif text-lg leading-snug text-foreground">"{report.rewrittenHeadline}"</p>
                      <button
                        onClick={() => { navigator.clipboard.writeText(report.rewrittenHeadline ?? ''); toast({ title: "Headline copied!" }); }}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-primary/10"
                      >
                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                )}
                {report.rewrittenCta && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-2.5">Stronger CTA</p>
                    <div className="bg-background border border-primary/30 p-4 rounded-xl relative group">
                      <p className="font-bold text-base text-foreground">"{report.rewrittenCta}"</p>
                      <button
                        onClick={() => { navigator.clipboard.writeText(report.rewrittenCta ?? ''); toast({ title: "CTA copied!" }); }}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-primary/10"
                      >
                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Quick Wins */}
            {quickWins.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="bg-card border border-border rounded-2xl p-6"
              >
                <h2 className="text-base font-black mb-5 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Quick Wins
                </h2>
                <ul className="space-y-3">
                  {quickWins.map((win: string, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-black text-emerald-400">{i + 1}</span>
                      </div>
                      <span className="text-sm text-muted-foreground leading-relaxed">{win}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Screenshot */}
            {report.screenshotUrl && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="rounded-2xl overflow-hidden border border-border bg-card"
              >
                <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">Page Captured</span>
                </div>
                <img src={report.screenshotUrl} alt="Screenshot" className="w-full h-auto" />
              </motion.div>
            )}

            {/* Share card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="bg-card border border-border rounded-2xl p-5 text-center"
            >
              <Flame className="w-8 h-8 text-primary mx-auto mb-3" />
              <p className="font-bold mb-1 text-sm">Share this roast</p>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">Let your team (or Twitter) see how bad it is — before you fix it.</p>
              <Button variant="outline" size="sm" className="w-full gap-2 rounded-xl" onClick={handleShare}>
                <Share2 className="w-3.5 h-3.5" /> Copy Share Link
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* AI Improvement Prompt — Full Width */}
      <div className="container mx-auto px-4 max-w-5xl pb-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-500/8 via-background to-background overflow-hidden"
        >
          {/* Glow */}
          <div className="absolute top-0 left-0 w-[500px] h-[300px] bg-violet-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[300px] h-[200px] bg-purple-500/8 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10 p-6 md:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.25)]">
                  <Bot className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="text-xl font-black">AI Fix-It Prompt</h2>
                    <span className="px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-[10px] font-black text-violet-400 uppercase tracking-widest">New</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Paste this into ChatGPT, Claude, Cursor, or Lovable to get your site fixed by AI</p>
                </div>
              </div>
              <Button
                onClick={handleCopyPrompt}
                className={`gap-2 rounded-xl shrink-0 transition-all ${promptCopied ? 'bg-emerald-600 hover:bg-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-violet-600 hover:bg-violet-700 shadow-[0_0_20px_rgba(139,92,246,0.35)]'}`}
              >
                {promptCopied ? (
                  <><CheckCircle2 className="w-4 h-4" /> Copied!</>
                ) : (
                  <><Copy className="w-4 h-4" /> Copy Prompt</>
                )}
              </Button>
            </div>

            {/* What it covers */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { icon: <Target className="w-3.5 h-3.5 text-violet-400" />, label: `${sections.filter((s: any) => s.severity === 'critical').length} Critical Issues` },
                { icon: <Zap className="w-3.5 h-3.5 text-orange-400" />, label: `${quickWins.length} Quick Wins` },
                { icon: <BarChart3 className="w-3.5 h-3.5 text-blue-400" />, label: `${scoreCategories.length} Score Categories` },
                { icon: <Sparkles className="w-3.5 h-3.5 text-emerald-400" />, label: "Copy Rewrites" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 bg-background/60 border border-border/60 rounded-xl px-3 py-2.5">
                  {item.icon}
                  <span className="text-xs font-semibold text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Prompt preview */}
            <div className="relative bg-background/70 border border-border/60 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60 bg-muted/20">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                </div>
                <span className="text-xs text-muted-foreground font-mono ml-2">ai-improvement-prompt.txt</span>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground/60">{aiPrompt.split('\n').length} lines · {Math.round(aiPrompt.length / 4)} tokens</span>
                </div>
              </div>

              <AnimatePresence initial={false}>
                <div className={`relative overflow-hidden transition-all duration-500 ${promptExpanded ? '' : 'max-h-48'}`}>
                  <pre className="p-4 text-xs text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap break-words">
                    {promptExpanded ? aiPrompt : promptPreview}
                  </pre>
                  {!promptExpanded && (
                    <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-background/90 to-transparent" />
                  )}
                </div>
              </AnimatePresence>

              <button
                onClick={() => setPromptExpanded(!promptExpanded)}
                className="flex items-center justify-center gap-2 w-full py-3 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors border-t border-border/60 bg-muted/10 hover:bg-muted/20"
              >
                {promptExpanded ? (
                  <><ChevronUp className="w-3.5 h-3.5" /> Collapse</>
                ) : (
                  <><ChevronDown className="w-3.5 h-3.5" /> Show full prompt ({Math.ceil(aiPrompt.length / 250)} pages)</>
                )}
              </button>
            </div>

            {/* How to use */}
            <div className="mt-5 flex flex-wrap gap-3">
              {[
                { name: "ChatGPT", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25" },
                { name: "Claude", color: "text-orange-400 bg-orange-500/10 border-orange-500/25" },
                { name: "Cursor", color: "text-blue-400 bg-blue-500/10 border-blue-500/25" },
                { name: "Lovable", color: "text-pink-400 bg-pink-500/10 border-pink-500/25" },
                { name: "Bolt", color: "text-violet-400 bg-violet-500/10 border-violet-500/25" },
              ].map((tool) => (
                <span key={tool.name} className={`px-3 py-1 rounded-full text-xs font-semibold border ${tool.color}`}>
                  {tool.name}
                </span>
              ))}
              <span className="px-3 py-1 rounded-full text-xs font-semibold border border-border text-muted-foreground">
                or any AI assistant
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
