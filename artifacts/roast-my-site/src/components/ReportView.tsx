import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Share2, Heart, ExternalLink, ShieldAlert, Loader2, Info, Lightbulb, Flame, TrendingUp, AlertTriangle, CheckCircle2, Copy, Zap, Target } from "lucide-react";
import { useToggleFavoriteReport, useShareReport } from "@workspace/api-client-react";
import type { Report } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion, useInView, AnimatePresence } from "framer-motion";

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

function getSeverityConfig(severity: string | null | undefined) {
  switch (severity) {
    case 'critical': return { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', badgeClass: 'bg-red-500/15 text-red-400 border-red-500/30', icon: <AlertTriangle className="w-4 h-4 text-red-400" /> };
    case 'warning': return { color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', badgeClass: 'bg-orange-500/15 text-orange-400 border-orange-500/30', icon: <Zap className="w-4 h-4 text-orange-400" /> };
    default: return { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: <Info className="w-4 h-4 text-blue-400" /> };
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

  return (
    <div className="pb-24">
      {/* Hero */}
      <section className="bg-card/60 border-b border-border py-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-primary/6 rounded-full blur-[120px]" />
        </div>

        <div className="container mx-auto px-4 max-w-5xl relative z-10">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-10">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <h1 className="text-2xl md:text-3xl font-black truncate">{report.pageTitle || 'Untitled Page'}</h1>
                <a href={report.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors shrink-0">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <p className="text-muted-foreground font-mono text-sm">{report.url.replace(/^https?:\/\//, '')}</p>
              <p className="text-xs text-muted-foreground/60 mt-1">{format(new Date(report.createdAt), 'MMMM d, yyyy · h:mm a')}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={handleShare} className="gap-2 rounded-xl bg-background">
                <Share2 className="w-3.5 h-3.5" /> Share
              </Button>
              {!isShared && (
                <Button variant="outline" size="sm" onClick={handleToggleFav}
                  className={`gap-2 rounded-xl bg-background ${report.isFavorite ? 'border-primary text-primary' : ''}`}
                >
                  <Heart className="w-3.5 h-3.5" fill={report.isFavorite ? "currentColor" : "none"} />
                  {report.isFavorite ? 'Saved' : 'Save'}
                </Button>
              )}
            </div>
          </div>

          {/* Score + Summary */}
          <div className="grid md:grid-cols-[220px_1fr] gap-8 items-center">
            {/* Score circle */}
            <div className="flex flex-col items-center">
              <div className={`relative w-44 h-44 md:w-52 md:h-52 rounded-full bg-background flex items-center justify-center ${scoreGlow}`}>
                <AnimatedScore target={report.overallScore ?? 0} color={scoreColor} />
              </div>
              <div className={`mt-3 text-sm font-bold ${scoreColor}`}>{scoreLabel}</div>
            </div>

            {/* Summary */}
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

      {/* Scores breakdown */}
      {(report.scoreCategories && report.scoreCategories.length > 0) && (
        <section className="border-b border-border bg-card/20 py-10">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-lg font-black mb-6 flex items-center gap-2.5">
              <TrendingUp className="w-5 h-5 text-primary" /> Score Breakdown
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {report.scoreCategories.map((cat: any, i: number) => {
                const pct = (cat.score / cat.maxScore) * 100;
                const c = getScoreColor(pct);
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    className="bg-card border border-border rounded-2xl p-4"
                  >
                    <div className="text-xs text-muted-foreground mb-2 font-medium">{cat.name}</div>
                    <div className="flex items-end justify-between">
                      <span className={`text-2xl font-black ${c}`}>{cat.score}</span>
                      <span className="text-xs text-muted-foreground mb-0.5">/{cat.maxScore}</span>
                    </div>
                    <div className="mt-2.5 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-orange-500' : 'bg-red-500'}`}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${pct}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 + i * 0.05, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                      />
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
          <div className="space-y-6">
            <h2 className="text-xl font-black flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-primary" /> Deep Dive Analysis
            </h2>

            {/* First impression */}
            {report.firstImpression && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5 }}
                className="border border-blue-500/30 bg-blue-500/5 rounded-2xl p-6"
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

            {/* Sections */}
            {(report.sections || []).map((section: any, i: number) => {
              const sev = getSeverityConfig(section.severity);
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.07, duration: 0.5 }}
                  className={`border rounded-2xl p-6 ${sev.bg}`}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
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
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-sm">{section.content}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-6">
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
            {report.quickWins && report.quickWins.length > 0 && (
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
                  {report.quickWins.map((win: string, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
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
    </div>
  );
}
