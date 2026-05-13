import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Share2, Heart, ExternalLink, ShieldAlert, Loader2, Info, Lightbulb, Zap, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToggleFavoriteReport, useShareReport } from "@workspace/api-client-react";
import type { Report } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface ReportViewProps {
  report: Report;
  isShared?: boolean;
}

export default function ReportView({ report, isShared = false }: ReportViewProps) {
  const { toast } = useToast();
  const toggleFav = useToggleFavoriteReport();
  const shareReport = useShareReport();
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    if (report.overallScore != null && report.status === 'completed') {
      const duration = 1500;
      const steps = 60;
      const stepTime = duration / steps;
      const target = report.overallScore;
      let current = 0;

      const timer = setInterval(() => {
        current += target / steps;
        if (current >= target) {
          setAnimatedScore(target);
          clearInterval(timer);
        } else {
          setAnimatedScore(Math.floor(current));
        }
      }, stepTime);

      return () => clearInterval(timer);
    }
    return undefined;
  }, [report.overallScore, report.status]);

  const handleShare = () => {
    if (isShared) {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied!", description: "You can share this URL with others." });
      return;
    }
    
    shareReport.mutate({ id: report.id }, {
      onSuccess: (data) => {
        navigator.clipboard.writeText(data.shareUrl);
        toast({
          title: "Link copied!",
          description: "Public report link has been copied to your clipboard.",
        });
      }
    });
  };

  const handleToggleFav = () => {
    if (isShared) return;
    toggleFav.mutate({ id: report.id }, {
      onSuccess: (data) => {
        toast({
          title: data.isFavorite ? "Added to favorites" : "Removed from favorites"
        });
      }
    });
  };

  const getScoreColor = (score: number | null | undefined) => {
    if (score == null) return "text-muted-foreground";
    if (score >= 71) return "text-green-500";
    if (score >= 41) return "text-orange-500";
    return "text-red-500";
  };

  const getScoreBg = (score: number | null | undefined) => {
    if (score == null) return "bg-muted";
    if (score >= 71) return "bg-green-500";
    if (score >= 41) return "bg-orange-500";
    return "bg-red-500";
  };

  if (report.status === 'failed') {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-2xl">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Roast Failed</h1>
        <p className="text-muted-foreground text-lg mb-8">
          We couldn't analyze {report.url}. This usually happens if the site blocks bots, is offline, or took too long to respond.
        </p>
      </div>
    );
  }

  if (report.status === 'pending' || report.status === 'processing') {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-2xl">
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-muted"></div>
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-4">Roasting in progress...</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Analyzing {report.url}. Our AI is tearing down your UX, copy, and layout. 
          Please hold tight.
        </p>
        <div className="space-y-4 max-w-md mx-auto text-left opacity-60">
          <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-5/6 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-4/6 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Hero Section */}
      <section className="bg-card border-b border-border py-12 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="container mx-auto px-4 max-w-5xl relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{report.pageTitle || 'Untitled Page'}</h1>
                <a href={report.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
              <p className="text-lg text-muted-foreground font-mono">{report.url.replace(/^https?:\/\//, '')}</p>
            </div>

            <div className="flex items-center gap-3 self-end md:self-center shrink-0">
              <span className="text-sm text-muted-foreground mr-2">
                {format(new Date(report.createdAt), 'MMM d, yyyy')}
              </span>
              <Button variant="outline" size="sm" onClick={handleShare} className="gap-2 bg-background">
                <Share2 className="w-4 h-4" /> Share
              </Button>
              {!isShared && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleToggleFav}
                  className={`gap-2 bg-background ${report.isFavorite ? 'border-primary text-primary' : ''}`}
                >
                  <Heart className="w-4 h-4" fill={report.isFavorite ? "currentColor" : "none"} />
                  {report.isFavorite ? 'Saved' : 'Save'}
                </Button>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-[1fr_2fr] gap-12 items-center">
            {/* Score circle */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.2)] bg-background">
                {/* SVG Circle for progress */}
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted opacity-20" />
                  <circle 
                    cx="50" cy="50" r="46" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    strokeLinecap="round"
                    strokeDasharray={`${(animatedScore / 100) * 289} 289`}
                    className={`transition-all duration-1000 ease-out ${getScoreColor(report.overallScore)}`}
                  />
                </svg>
                <div className="text-center">
                  <div className={`text-6xl md:text-7xl font-black tracking-tighter ${getScoreColor(report.overallScore)}`}>
                    {animatedScore}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground tracking-widest uppercase mt-1">Overall Score</div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-background border border-border p-6 md:p-8 rounded-3xl relative">
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                The Brutal Truth
              </h3>
              <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {report.roastSummary || "No summary available."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 max-w-5xl py-16 space-y-24">
        
        {/* Categories */}
        <section>
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-primary" /> Breakdown
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(report.scoreCategories || []).map((cat, i) => (
              <Card key={i} className="bg-card">
                <CardContent className="p-5 flex flex-col items-center text-center">
                  <div className="w-full flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-muted-foreground">{cat.name}</span>
                    <span className={`font-bold ${getScoreColor(cat.score)}`}>{cat.score}/{cat.maxScore}</span>
                  </div>
                  <Progress value={(cat.score / cat.maxScore) * 100} className={`h-1.5 w-full [&>div]:${getScoreBg(cat.score)}`} />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <div className="grid md:grid-cols-[2fr_1fr] gap-12">
          {/* Detailed Roast Sections */}
          <div className="space-y-12">
            <section>
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-primary" /> Deep Dive Analysis
              </h2>
              
              <div className="space-y-6">
                {report.firstImpression && (
                  <div className="border border-border rounded-2xl p-6 bg-card/50">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-blue-500/20 p-2 rounded-lg"><Info className="w-5 h-5 text-blue-500" /></div>
                      <h3 className="text-xl font-bold">First Impression (3 Second Test)</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{report.firstImpression}</p>
                  </div>
                )}

                {(report.sections || []).map((section, i) => (
                  <div key={i} className="border border-border rounded-2xl p-6 bg-card/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <h3 className="text-xl font-bold">{section.title}</h3>
                      {section.severity && (
                        <Badge variant={section.severity === 'critical' ? 'destructive' : section.severity === 'warning' ? 'default' : 'secondary'} className={section.severity === 'warning' ? 'bg-orange-500 text-white hover:bg-orange-600' : ''}>
                          {section.severity.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{section.content}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar / Fixes */}
          <div className="space-y-8">
            <section className="bg-primary/5 border border-primary/20 rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px]"></div>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-primary">
                <Lightbulb className="w-5 h-5" /> AI Rewrites
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Better Headline</h4>
                  <div className="bg-background border border-primary/30 p-4 rounded-xl shadow-inner font-serif text-lg leading-tight text-foreground">
                    "{report.rewrittenHeadline}"
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Stronger CTA</h4>
                  <div className="bg-background border border-primary/30 p-4 rounded-xl shadow-inner font-medium text-foreground">
                    "{report.rewrittenCta}"
                  </div>
                </div>
              </div>
            </section>

            {(report.quickWins && report.quickWins.length > 0) && (
              <section className="bg-card border border-border rounded-3xl p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" /> Quick Wins
                </h2>
                <ul className="space-y-4">
                  {report.quickWins.map((win, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-1 bg-green-500/20 rounded-full p-0.5 shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                      </div>
                      <span className="text-sm text-muted-foreground leading-relaxed">{win}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {report.screenshotUrl && (
              <section className="rounded-3xl overflow-hidden border border-border bg-card">
                <div className="p-4 border-b border-border bg-muted/30">
                  <h3 className="font-semibold text-sm">Target Captured</h3>
                </div>
                <img src={report.screenshotUrl} alt="Site Screenshot" className="w-full h-auto" />
              </section>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
