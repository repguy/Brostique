import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useClerk } from "@clerk/react";
import { format } from "date-fns";
import {
  Flame, LogOut, Settings, ExternalLink, Share2,
  Heart, Loader2, Search, ArrowRight, ShieldAlert, Zap, CreditCard,
  TrendingUp, Star, CheckCircle2, Package, Sparkles, BarChart3, RefreshCw
} from "lucide-react";
import {
  useGetMe,
  useGetReportStats,
  useListReports,
  useCreateBillingPortalSession,
  useCreateCheckoutSession,
  useGetBillingPlans,
  useToggleFavoriteReport,
  useShareReport,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import URLInput from "@/components/URLInput";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

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

interface CreditPack {
  id: string;
  credits: number;
  price: number;
  label: string;
  popular: boolean;
}

export default function Dashboard() {
  const { signOut } = useClerk();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("roasts");
  const [buyingPack, setBuyingPack] = useState<string | null>(null);
  const [creditPacks, setCreditPacks] = useState<CreditPack[]>([]);

  const { data: user, refetch: refetchUser } = useGetMe();
  const { data: stats, refetch: refetchStats } = useGetReportStats();
  const { data: reports, isLoading: isLoadingReports, refetch: refetchReports } = useListReports();
  const { data: plans } = useGetBillingPlans();

  const createPortal = useCreateBillingPortalSession();
  const createCheckout = useCreateCheckoutSession();
  const toggleFav = useToggleFavoriteReport();
  const shareReport = useShareReport();

  const credits = stats?.credits ?? user?.credits ?? 0;
  const isPro = user?.isPro ?? false;

  useEffect(() => {
    fetch("/api/billing/credit-packs")
      .then(r => r.json())
      .then(setCreditPacks)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "1") {
      toast({ title: "Welcome to Pro!", description: "You now have unlimited roasts." });
      refetchUser();
      refetchStats();
      window.history.replaceState({}, "", window.location.pathname);
    }
    const creditsAdded = params.get("credits_added");
    if (creditsAdded) {
      toast({ title: `${creditsAdded} credits added!`, description: "Your credits are ready to use." });
      refetchUser();
      refetchStats();
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleManageBilling = () => {
    if (isPro) {
      createPortal.mutate(undefined, { onSuccess: (d) => { window.location.href = d.url; } });
    } else {
      const proPlan = plans?.find(p => p.name === "Pro");
      if (proPlan?.stripePriceId) {
        createCheckout.mutate({ data: { priceId: proPlan.stripePriceId } }, { onSuccess: (d) => { window.location.href = d.url; } });
      } else {
        createCheckout.mutate({ data: { priceId: "pro" } }, { onSuccess: (d) => { window.location.href = d.url; } });
      }
    }
  };

  const handleBuyCreditPack = async (packId: string) => {
    setBuyingPack(packId);
    try {
      const res = await fetch("/api/billing/credits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || "Checkout failed");
      }
      const result = await res.json() as { url: string };
      window.location.href = result.url;
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message || "Could not start checkout. Please try again.", variant: "destructive" });
    } finally {
      setBuyingPack(null);
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

  const handleRefresh = () => {
    refetchReports();
    refetchStats();
    refetchUser();
  };

  const completedReports = reports?.filter(r => r.status === "completed") ?? [];
  const processingReports = reports?.filter(r => r.status === "processing" || r.status === "pending") ?? [];

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
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold cursor-pointer ${isPro ? "border-primary/40 bg-primary/10 text-primary" : credits <= 1 ? "border-red-500/40 bg-red-500/10 text-red-400" : "border-border bg-secondary text-secondary-foreground"}`}
              onClick={() => setActiveTab("credits")}>
              <img src="/coin.svg" alt="credits" className="w-3.5 h-3.5" />
              {isPro ? "Unlimited" : `${credits} credit${credits !== 1 ? "s" : ""}`}
            </div>

            {!isPro && (
              <Button variant="outline" size="sm" className="hidden sm:flex border-primary/60 text-primary hover:bg-primary hover:text-primary-foreground transition-colors" onClick={() => setActiveTab("subscription")}>
                Upgrade
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4" />
            </Button>
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

        {/* Stats row */}
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
              value: isPro ? "Pro ∞" : credits,
              icon: <img src="/coin.svg" alt="credits" className="w-4 h-4" />,
              sub: isPro ? "unlimited roasts" : "roasts remaining",
              valueClass: !isPro && credits <= 1 ? "text-red-400" : isPro ? "text-primary" : "",
              special: true,
              onClick: () => setActiveTab("credits"),
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card
                className={`bg-card relative overflow-hidden transition-all ${stat.special && !isPro && credits <= 1 ? "border-red-500/30" : stat.special ? "border-primary/20" : "border-border"} ${stat.onClick ? "cursor-pointer hover:border-primary/30" : ""}`}
                onClick={stat.onClick}
              >
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

        {/* Processing banner */}
        <AnimatePresence>
          {processingReports.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-2xl bg-primary/10 border border-primary/30 flex items-center gap-3"
            >
              <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-sm text-primary">
                  {processingReports.length} roast{processingReports.length > 1 ? "s" : ""} in progress...
                </p>
                <p className="text-xs text-muted-foreground">Usually takes 20–40 seconds. Refresh to check.</p>
              </div>
              <Button size="sm" variant="ghost" className="text-primary" onClick={handleRefresh}>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Credits warning */}
        <AnimatePresence>
          {!isPro && credits === 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-start gap-3"
            >
              <Zap className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm text-orange-300">You're out of credits</p>
                <p className="text-xs text-muted-foreground mt-0.5">Buy a credit pack or upgrade to Pro for unlimited roasts.</p>
              </div>
              <Button size="sm" variant="outline" className="border-orange-500/40 text-orange-400 hover:bg-orange-500/10" onClick={() => setActiveTab("credits")}>
                Buy Credits
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 bg-card border border-border">
            <TabsTrigger value="roasts" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <BarChart3 className="w-4 h-4" /> Your Roasts
              {completedReports.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs h-4 px-1.5">{completedReports.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="credits" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <img src="/coin.svg" alt="" className="w-4 h-4" /> Credits
            </TabsTrigger>
            <TabsTrigger value="subscription" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Sparkles className="w-4 h-4" /> Subscription
            </TabsTrigger>
            <TabsTrigger value="account" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <CreditCard className="w-4 h-4" /> Account
            </TabsTrigger>
          </TabsList>

          {/* === ROASTS TAB === */}
          <TabsContent value="roasts">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black tracking-tight">Your Roasts</h2>
              {isPro && (
                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleManageBilling}>
                  <Settings className="w-4 h-4 mr-2" /> Manage Billing
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
                      {report.screenshotUrl ? (
                        <div className="h-36 w-full overflow-hidden border-b border-border relative bg-secondary flex-shrink-0">
                          <img src={report.screenshotUrl} alt={report.url} className="w-full h-full object-cover object-top opacity-70 group-hover:opacity-90 transition-opacity group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                          {report.status === "completed" && report.overallScore != null && (
                            <div className={`absolute top-3 right-3 w-11 h-11 rounded-full flex items-center justify-center font-black text-sm border-2 ${scoreBorder(report.overallScore)} ${scoreColor(report.overallScore)} backdrop-blur-sm bg-background/80`}>
                              {report.overallScore}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-36 w-full bg-secondary flex items-center justify-center border-b border-border relative flex-shrink-0">
                          <Search className="w-8 h-8 text-muted-foreground/30" />
                          {report.status === "completed" && report.overallScore != null && (
                            <div className={`absolute top-3 right-3 w-11 h-11 rounded-full flex items-center justify-center font-black text-sm border-2 ${scoreBorder(report.overallScore)} ${scoreColor(report.overallScore)}`}>
                              {report.overallScore}
                            </div>
                          )}
                        </div>
                      )}

                      <CardHeader className="pb-1 pt-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm truncate">{report.url.replace(/^https?:\/\//, "")}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(report.createdAt), "MMM d, yyyy")}</p>
                          </div>
                          {report.status === "failed" ? (
                            <ShieldAlert className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                          ) : (report.status === "pending" || report.status === "processing") ? (
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
                          <Button variant="ghost" size="icon" className={`h-8 w-8 ${report.isFavorite ? "text-primary" : "text-muted-foreground"}`}
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
          </TabsContent>

          {/* === CREDITS TAB === */}
          <TabsContent value="credits">
            <div className="max-w-4xl">
              <div className="mb-8">
                <h2 className="text-2xl font-black tracking-tight mb-1">Credits</h2>
                <p className="text-muted-foreground text-sm">Each roast uses 1 credit. Buy packs anytime — they never expire.</p>
              </div>

              {/* Current balance */}
              <Card className="mb-8 border-primary/20 bg-primary/5">
                <CardContent className="p-6 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center shadow-[0_0_20px_rgba(255,87,34,0.2)]">
                    <img src="/coin.svg" alt="credits" className="w-9 h-9" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium mb-1">Current Balance</p>
                    <p className="text-4xl font-black text-primary tracking-tight">
                      {isPro ? "∞" : credits}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isPro ? "Unlimited — Pro subscribers never run out" : `${credits} roast${credits !== 1 ? "s" : ""} remaining`}
                    </p>
                  </div>
                  {isPro && (
                    <div className="ml-auto">
                      <Badge className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 text-sm font-bold">
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Pro
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Credit packs */}
              {!isPro && (
                <>
                  <h3 className="text-lg font-bold mb-4">Buy Credit Packs</h3>
                  {creditPacks.length > 0 ? (
                    <div className="grid md:grid-cols-3 gap-4 mb-8">
                      {creditPacks.map((pack, i) => (
                        <motion.div
                          key={pack.id}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <Card className={`relative overflow-hidden transition-all hover:border-primary/40 hover:shadow-[0_0_20px_rgba(255,87,34,0.1)] ${pack.popular ? "border-primary/40 bg-primary/5" : "border-border"}`}>
                            {pack.popular && (
                              <div className="absolute top-3 right-3">
                                <Badge className="bg-primary text-primary-foreground text-[10px] font-bold px-2">Popular</Badge>
                              </div>
                            )}
                            <CardHeader className="pb-2 pt-5 px-5">
                              <div className="flex items-center gap-2 mb-2">
                                <img src="/coin.svg" alt="" className="w-7 h-7" />
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{pack.label}</span>
                              </div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-foreground">{pack.credits}</span>
                                <span className="text-sm text-muted-foreground font-medium">credits</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">${(pack.price / pack.credits).toFixed(2)} per roast</p>
                            </CardHeader>
                            <CardContent className="px-5 pb-5">
                              <Button
                                className={`w-full font-bold ${pack.popular ? "bg-primary hover:bg-primary/90 text-primary-foreground" : ""}`}
                                variant={pack.popular ? "default" : "outline"}
                                onClick={() => handleBuyCreditPack(pack.id)}
                                disabled={buyingPack === pack.id}
                              >
                                {buyingPack === pack.id ? (
                                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                                ) : (
                                  <><Package className="w-4 h-4 mr-2" /> Buy for ${pack.price}</>
                                )}
                              </Button>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <Card className="border-border bg-card/50 mb-8">
                      <CardContent className="p-8 text-center">
                        <Package className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                        <p className="text-sm font-semibold text-muted-foreground">Credit packs not yet configured</p>
                        <p className="text-xs text-muted-foreground mt-1">The admin needs to configure credit pack products in the admin panel.</p>
                      </CardContent>
                    </Card>
                  )}

                  <div className="p-4 rounded-2xl bg-card border border-border">
                    <p className="text-sm font-semibold mb-1">Want unlimited roasts?</p>
                    <p className="text-xs text-muted-foreground mb-3">Upgrade to Pro and never worry about credits again.</p>
                    <Button size="sm" onClick={() => setActiveTab("subscription")} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" /> View Pro Plan
                    </Button>
                  </div>
                </>
              )}

              {isPro && (
                <Card className="border-border">
                  <CardContent className="p-6 text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                    <p className="font-semibold">You're on Pro — credits are unlimited</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">Manage your subscription or cancel anytime.</p>
                    <Button variant="outline" size="sm" onClick={handleManageBilling}>
                      <Settings className="w-3.5 h-3.5 mr-1.5" /> Manage Subscription
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* === SUBSCRIPTION TAB === */}
          <TabsContent value="subscription">
            <div className="max-w-4xl">
              <div className="mb-8">
                <h2 className="text-2xl font-black tracking-tight mb-1">Subscription</h2>
                <p className="text-muted-foreground text-sm">Upgrade to Pro for unlimited roasts and full AI reports.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Free plan */}
                <Card className={`relative border-border ${!isPro ? "ring-1 ring-border" : ""}`}>
                  <CardHeader className="pb-2 pt-6 px-6">
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-lg font-black">Free</CardTitle>
                      {!isPro && <Badge variant="secondary" className="text-xs">Current Plan</Badge>}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black">$0</span>
                      <span className="text-muted-foreground text-sm">/month</span>
                    </div>
                    <CardDescription className="text-xs mt-1">Perfect to get started</CardDescription>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <ul className="space-y-2.5 mb-6">
                      {["3 starter credits", "Basic AI analysis", "Overall score", "3 improvement tips"].map(f => (
                        <li key={f} className="flex items-center gap-2.5 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button variant="outline" className="w-full" disabled={!isPro}>
                      {!isPro ? "Current Plan" : "Downgrade"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Pro plan */}
                <Card className={`relative border-primary/40 bg-primary/5 ${isPro ? "ring-2 ring-primary/60" : ""}`}>
                  {!isPro && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground font-bold px-3">Recommended</Badge>
                    </div>
                  )}
                  <CardHeader className="pb-2 pt-6 px-6">
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-lg font-black">Pro</CardTitle>
                      {isPro && <Badge className="bg-primary/20 text-primary border border-primary/30 text-xs font-bold">Active</Badge>}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black">$29</span>
                      <span className="text-muted-foreground text-sm">/month</span>
                    </div>
                    <CardDescription className="text-xs mt-1">For serious growth hackers</CardDescription>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <ul className="space-y-2.5 mb-6">
                      {[
                        "Unlimited roasts",
                        "Full AI analysis report",
                        "AI-rewritten headline & CTA",
                        "Score breakdown by 8 axes",
                        "Public share links",
                        "Priority processing",
                      ].map(f => (
                        <li key={f} className="flex items-center gap-2.5 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    {isPro ? (
                      <Button variant="outline" className="w-full border-primary/40 text-primary hover:bg-primary/10" onClick={handleManageBilling}
                        disabled={createPortal.isPending}>
                        {createPortal.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Settings className="w-4 h-4 mr-2" />}
                        Manage Subscription
                      </Button>
                    ) : (
                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold" onClick={handleManageBilling}
                        disabled={createCheckout.isPending}>
                        {createCheckout.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        Upgrade to Pro — $29/mo
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border text-center">
                <p className="text-xs text-muted-foreground">
                  Payments are powered by <strong>Polar</strong>. Cancel anytime from your billing portal. No hidden fees.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* === ACCOUNT TAB === */}
          <TabsContent value="account">
            <div className="max-w-2xl">
              <div className="mb-8">
                <h2 className="text-2xl font-black tracking-tight mb-1">Account</h2>
                <p className="text-muted-foreground text-sm">Your profile and billing details.</p>
              </div>

              <div className="space-y-4">
                <Card className="border-border">
                  <CardContent className="p-6">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Profile</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b border-border/60">
                        <span className="text-sm text-muted-foreground">Email</span>
                        <span className="text-sm font-medium">{user?.email ?? "—"}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-border/60">
                        <span className="text-sm text-muted-foreground">Plan</span>
                        <Badge className={isPro ? "bg-primary/20 text-primary border border-primary/30" : ""} variant={isPro ? "outline" : "secondary"}>
                          {isPro ? "Pro" : "Free"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-border/60">
                        <span className="text-sm text-muted-foreground">Credits</span>
                        <span className="text-sm font-bold flex items-center gap-1.5">
                          <img src="/coin.svg" alt="" className="w-4 h-4" />
                          {isPro ? "Unlimited" : credits}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-muted-foreground">Member Since</span>
                        <span className="text-sm font-medium">
                          {user?.createdAt ? format(new Date(user.createdAt), "MMM d, yyyy") : "—"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardContent className="p-6">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Billing</h3>
                    <div className="space-y-3">
                      {isPro ? (
                        <>
                          <p className="text-sm text-muted-foreground mb-4">Manage your Pro subscription, view invoices, or cancel anytime.</p>
                          <Button variant="outline" className="border-primary/40 text-primary hover:bg-primary/10" onClick={handleManageBilling}
                            disabled={createPortal.isPending}>
                            {createPortal.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                            Open Billing Portal
                          </Button>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground mb-4">You're on the free plan. Upgrade to Pro or buy credits.</p>
                          <div className="flex gap-3 flex-wrap">
                            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold" onClick={() => setActiveTab("subscription")}>
                              <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Upgrade to Pro
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setActiveTab("credits")}>
                              <img src="/coin.svg" alt="" className="w-3.5 h-3.5 mr-1.5" /> Buy Credits
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-destructive/30 bg-destructive/5">
                  <CardContent className="p-6">
                    <h3 className="text-sm font-semibold text-destructive uppercase tracking-wider mb-2">Danger Zone</h3>
                    <p className="text-xs text-muted-foreground mb-4">Sign out of your account on this device.</p>
                    <Button variant="destructive" size="sm" onClick={() => signOut({ redirectUrl: "/" })}>
                      <LogOut className="w-3.5 h-3.5 mr-1.5" /> Sign Out
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
