import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useClerk } from "@clerk/react";
import { format } from "date-fns";
import { 
  Flame, LogOut, Settings, ExternalLink, Share2, 
  Heart, Loader2, Search, ArrowRight, ShieldAlert, Zap, CreditCard, TrendingUp, Star
} from "lucide-react";
import { 
  useGetMe, 
  useGetReportStats, 
  useListReports,
  useCreateBillingPortalSession,
  useCreateCheckoutSession,
  useGetBillingPlans,
  useToggleFavoriteReport,
  useShareReport
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import URLInput from "@/components/URLInput";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

function scoreColor(score: number | null | undefined) {
  if (score == null) return "text-muted-foreground";
  if (score >= 70) return "text-emerald-500";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
}

function scoreBorder(score: number | null | undefined) {
  if (score == null) return "border-border";
  if (score >= 70) return "border-emerald-500/40 bg-emerald-500/10";
  if (score >= 40) return "border-orange-500/40 bg-orange-500/10";
  return "border-red-500/40 bg-red-500/10";
}

export default function Dashboard() {
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: user } = useGetMe();
  const { data: stats } = useGetReportStats();
  const { data: reports, isLoading: isLoadingReports } = useListReports();
  const { data: plans } = useGetBillingPlans();
  
  const createPortal = useCreateBillingPortalSession();
  const createCheckout = useCreateCheckoutSession();
  const toggleFav = useToggleFavoriteReport();
  const shareReport = useShareReport();

  const credits = stats?.credits ?? user?.credits ?? 0;
  const isPro = user?.isPro ?? false;

  const handleManageBilling = () => {
    if (isPro) {
      createPortal.mutate(undefined, { onSuccess: (d) => { window.location.href = d.url; } });
    } else {
      const proPlan = plans?.find(p => p.name === 'Pro');
      if (proPlan?.stripePriceId) {
        createCheckout.mutate({ data: { priceId: proPlan.stripePriceId } }, { onSuccess: (d) => { window.location.href = d.url; } });
      }
    }
  };

  const handleShare = (id: number) => {
    shareReport.mutate({ id }, {
      onSuccess: (data) => {
        navigator.clipboard.writeText(data.shareUrl);
        toast({ title: "Link copied!", description: "Share link has been copied to your clipboard." });
      }
    });
  };

  const handleToggleFav = (id: number) => {
    toggleFav.mutate({ id });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center shadow-[0_0_10px_rgba(255,87,34,0.25)]">
              <Flame className="w-4 h-4 text-primary" />
            </div>
            <span className="font-black text-lg tracking-tight hidden sm:inline-block">Brostique</span>
          </Link>
          
          <div className="flex-1 max-w-xl mx-8 hidden md:block">
            <URLInput className="h-10" />
          </div>

          <div className="flex items-center gap-3">
            {/* Credits badge */}
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${isPro ? 'border-primary/40 bg-primary/10 text-primary' : credits <= 1 ? 'border-red-500/40 bg-red-500/10 text-red-400' : 'border-border bg-secondary text-secondary-foreground'}`}>
              <Zap className="w-3 h-3" />
              {isPro ? 'Unlimited' : `${credits} credit${credits !== 1 ? 's' : ''}`}
            </div>

            {!isPro && (
              <Button variant="outline" size="sm" className="hidden sm:flex border-primary/60 text-primary hover:bg-primary hover:text-primary-foreground transition-colors" onClick={handleManageBilling}>
                Upgrade
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => signOut({ redirectUrl: "/" })} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* Mobile URL input */}
        <div className="md:hidden mb-6">
          <URLInput className="h-12" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total Roasts",
              value: stats?.totalReports ?? 0,
              icon: <Flame className="w-4 h-4 text-primary" />,
              sub: "all time",
            },
            {
              label: "Avg Score",
              value: stats?.avgScore != null ? `${Math.round(stats.avgScore)}` : "—",
              icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
              sub: "out of 100",
              valueClass: stats?.avgScore != null ? scoreColor(stats.avgScore) : "",
            },
            {
              label: "Favorites",
              value: stats?.favoriteReports ?? 0,
              icon: <Star className="w-4 h-4 text-amber-400" />,
              sub: "saved reports",
            },
            {
              label: isPro ? "Plan" : "Credits Left",
              value: isPro ? "Pro" : credits,
              icon: <CreditCard className="w-4 h-4 text-violet-400" />,
              sub: isPro ? "unlimited roasts" : "roasts remaining",
              valueClass: !isPro && credits <= 1 ? "text-red-400" : isPro ? "text-primary" : "",
              special: true,
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className={`bg-card relative overflow-hidden ${stat.special && !isPro && credits <= 1 ? 'border-red-500/30' : stat.special ? 'border-primary/20' : 'border-border'}`}>
                {stat.special && !isPro && (
                  <div className="absolute inset-0 bg-primary/3 pointer-events-none" />
                )}
                <CardHeader className="pb-1 pt-4 px-5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-medium text-muted-foreground">{stat.label}</CardTitle>
                    <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">{stat.icon}</div>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-4">
                  <div className={`text-3xl font-black tracking-tight ${stat.valueClass ?? ""}`}>{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Credits warning */}
        {!isPro && credits === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-start gap-3"
          >
            <Zap className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-sm text-orange-300">You're out of credits</p>
              <p className="text-xs text-muted-foreground mt-0.5">Upgrade to Pro for unlimited roasts, or ask the admin to top you up.</p>
            </div>
            <Button size="sm" variant="outline" className="border-orange-500/40 text-orange-400 hover:bg-orange-500/10" onClick={handleManageBilling}>
              Upgrade
            </Button>
          </motion.div>
        )}

        {/* Reports */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black tracking-tight">Your Roasts</h2>
            {isPro && (
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleManageBilling}>
                <Settings className="w-4 h-4 mr-2" /> Billing
              </Button>
            )}
          </div>

          {isLoadingReports ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
              <p className="text-sm">Loading your roasts...</p>
            </div>
          ) : reports && reports.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {reports.map((report, i) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Card className="group bg-card hover:border-primary/30 transition-all duration-300 hover:shadow-[0_0_25px_rgba(255,87,34,0.08)] border-border overflow-hidden flex flex-col h-full">
                    {/* Screenshot */}
                    {report.screenshotUrl ? (
                      <div className="h-36 w-full overflow-hidden border-b border-border relative bg-secondary flex-shrink-0">
                        <img src={report.screenshotUrl} alt={report.url} className="w-full h-full object-cover object-top opacity-70 group-hover:opacity-90 transition-opacity group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                        {/* Score overlay */}
                        {report.status === 'completed' && report.overallScore != null && (
                          <div className={`absolute top-3 right-3 w-11 h-11 rounded-full flex items-center justify-center font-black text-sm border-2 ${scoreBorder(report.overallScore)} ${scoreColor(report.overallScore)} backdrop-blur-sm bg-background/80`}>
                            {report.overallScore}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-36 w-full bg-secondary flex items-center justify-center border-b border-border relative flex-shrink-0">
                        <Search className="w-8 h-8 text-muted-foreground/30" />
                        {report.status === 'completed' && report.overallScore != null && (
                          <div className={`absolute top-3 right-3 w-11 h-11 rounded-full flex items-center justify-center font-black text-sm border-2 ${scoreBorder(report.overallScore)} ${scoreColor(report.overallScore)}`}>
                            {report.overallScore}
                          </div>
                        )}
                      </div>
                    )}

                    <CardHeader className="pb-1 pt-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm truncate">{report.url.replace(/^https?:\/\//, '')}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(report.createdAt), 'MMM d, yyyy')}</p>
                        </div>
                        {report.status === 'failed' ? (
                          <ShieldAlert className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                        ) : (report.status === 'pending' || report.status === 'processing') ? (
                          <div className="flex items-center gap-1.5 text-xs text-primary shrink-0">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Roasting...</span>
                          </div>
                        ) : null}
                      </div>
                    </CardHeader>

                    {report.roastSummary && (
                      <CardContent className="py-0 px-5 flex-1">
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{report.roastSummary}</p>
                      </CardContent>
                    )}

                    <CardContent className="mt-auto pt-3 pb-4 px-5 flex items-center justify-between border-t border-border/60">
                      <div className="flex items-center gap-0.5">
                        <Button variant="ghost" size="icon" className={`h-8 w-8 ${report.isFavorite ? 'text-primary' : 'text-muted-foreground'}`}
                          onClick={(e) => { e.preventDefault(); handleToggleFav(report.id); }}>
                          <Heart className="w-3.5 h-3.5" fill={report.isFavorite ? "currentColor" : "none"} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"
                          onClick={(e) => { e.preventDefault(); handleShare(report.id); }}>
                          <Share2 className="w-3.5 h-3.5" />
                        </Button>
                        {report.url && (
                          <a href={report.url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </a>
                        )}
                      </div>
                      <Link href={`/report/${report.id}`}>
                        <Button variant="secondary" size="sm" className="h-8 rounded-xl gap-1.5 text-xs font-semibold group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          View Report <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center py-24 border border-dashed border-border rounded-3xl bg-card/20"
            >
              <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_25px_rgba(255,87,34,0.15)]">
                <Flame className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-black mb-2">No roasts yet</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-8 text-sm leading-relaxed">
                Paste any URL in the bar above and our AI will tear it apart in ~30 seconds.
              </p>
              <div className="max-w-md mx-auto">
                <URLInput className="h-12" />
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
