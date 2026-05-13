import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useClerk } from "@clerk/react";
import { format } from "date-fns";
import { 
  Zap, LogOut, Settings, ExternalLink, Share2, 
  Heart, Plus, Loader2, Search, ArrowRight, ShieldAlert, CheckCircle2
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import URLInput from "@/components/URLInput";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

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

  const handleManageBilling = () => {
    if (user?.isPro) {
      createPortal.mutate(undefined, {
        onSuccess: (data) => { window.location.href = data.url; }
      });
    } else {
      const proPlan = plans?.find(p => p.name === 'Pro');
      if (proPlan?.stripePriceId) {
        createCheckout.mutate({ data: { priceId: proPlan.stripePriceId } }, {
          onSuccess: (data) => window.location.href = data.url
        });
      }
    }
  };

  const handleShare = (id: number) => {
    shareReport.mutate({ id }, {
      onSuccess: (data) => {
        navigator.clipboard.writeText(data.shareUrl);
        toast({
          title: "Link copied!",
          description: "Report link has been copied to your clipboard.",
        });
      }
    });
  };

  const handleToggleFav = (id: number) => {
    toggleFav.mutate({ id });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Dashboard Nav */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-lg tracking-tight hidden sm:inline-block">RoastMySite</span>
          </Link>
          
          <div className="flex-1 max-w-xl mx-8 hidden md:block">
            <URLInput className="h-10 text-sm" />
          </div>

          <div className="flex items-center gap-4">
            {!user?.isPro && (
              <Button variant="outline" size="sm" className="hidden sm:flex border-primary text-primary hover:bg-primary hover:text-primary-foreground" onClick={handleManageBilling}>
                Upgrade to Pro
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => signOut({ redirectUrl: "/" })}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="md:hidden mb-8">
          <URLInput className="h-12" />
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Roasts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalReports || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {stats?.avgScore ? Math.round(stats.avgScore) : '--'}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Favorites</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.favoriteReports || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-primary/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-sm font-medium flex justify-between items-center">
                <span className="text-muted-foreground">Daily Usage</span>
                {user?.isPro ? (
                  <Badge variant="default" className="bg-primary/20 text-primary hover:bg-primary/30">PRO</Badge>
                ) : (
                  <Badge variant="outline" className="cursor-pointer" onClick={handleManageBilling}>FREE</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold mb-2">
                {stats?.todayReports || 0} <span className="text-lg text-muted-foreground font-normal">/ {stats?.dailyLimit || 3}</span>
              </div>
              <Progress value={((stats?.todayReports || 0) / (stats?.dailyLimit || 3)) * 100} className="h-2" />
            </CardContent>
          </Card>
        </div>

        {/* Reports List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Your Reports</h2>
            {user?.isPro && (
              <Button variant="outline" size="sm" onClick={handleManageBilling}>
                <Settings className="w-4 h-4 mr-2" />
                Manage Billing
              </Button>
            )}
          </div>

          {isLoadingReports ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
              <p>Loading your reports...</p>
            </div>
          ) : reports && reports.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((report) => (
                <Card key={report.id} className="bg-card hover-elevate transition-all border-border overflow-hidden flex flex-col">
                  {report.screenshotUrl ? (
                    <div className="h-40 w-full overflow-hidden border-b border-border relative bg-secondary">
                      <img src={report.screenshotUrl} alt={report.url} className="w-full h-full object-cover object-top opacity-80" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
                    </div>
                  ) : (
                    <div className="h-40 w-full bg-secondary flex items-center justify-center border-b border-border">
                      <Search className="w-8 h-8 text-muted-foreground opacity-50" />
                    </div>
                  )}
                  
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle className="text-base truncate" title={report.url}>
                        {report.url.replace(/^https?:\/\//, '')}
                      </CardTitle>
                      <div className="shrink-0 flex items-center">
                        {report.status === 'completed' && report.overallScore != null ? (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border
                            ${report.overallScore >= 70 ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                              report.overallScore >= 40 ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 
                              'bg-red-500/10 text-red-500 border-red-500/20'}`}
                          >
                            {report.overallScore}
                          </div>
                        ) : report.status === 'failed' ? (
                          <ShieldAlert className="w-6 h-6 text-destructive" />
                        ) : (
                          <Loader2 className="w-6 h-6 text-primary animate-spin" />
                        )}
                      </div>
                    </div>
                    <CardDescription>
                      {format(new Date(report.createdAt), 'MMM d, yyyy')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => { e.preventDefault(); handleToggleFav(report.id); }}
                        className={report.isFavorite ? "text-primary hover:text-primary/80" : "text-muted-foreground"}
                      >
                        <Heart className="w-4 h-4" fill={report.isFavorite ? "currentColor" : "none"} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => { e.preventDefault(); handleShare(report.id); }}
                        className="text-muted-foreground"
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <Link href={`/report/${report.id}`}>
                      <Button variant="secondary" size="sm" className="gap-2">
                        View <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border border-dashed rounded-3xl bg-card/30">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-2">No reports yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-8">
                Paste a URL in the bar above to get your first brutally honest conversion roast.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
