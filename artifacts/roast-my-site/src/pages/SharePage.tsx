import { useParams, Link } from "wouter";
import { AlertCircle, Flame, ArrowRight, Lock } from "lucide-react";
import { useGetPublicReport, getGetPublicReportQueryKey } from "@workspace/api-client-react";
import { useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import ReportView from "@/components/ReportView";

export default function SharePage() {
  const { shareSlug } = useParams<{ shareSlug: string }>();
  const { isSignedIn } = useUser();

  const { data: report, isLoading, error } = useGetPublicReport(shareSlug || "", {
    query: {
      enabled: !!shareSlug,
      queryKey: getGetPublicReportQueryKey(shareSlug || ""),
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <div className="relative w-16 h-16 mb-6">
          <div className="absolute inset-0 rounded-full border-[3px] border-primary/20" />
          <div className="absolute inset-0 rounded-full border-[3px] border-primary border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Flame className="w-6 h-6 text-primary animate-pulse" />
          </div>
        </div>
        <h1 className="text-2xl font-black">Loading roast...</h1>
        <p className="text-muted-foreground text-sm mt-2">Fetching the heat</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-4">
        <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-3xl font-black mb-2">Report not found</h1>
        <p className="text-muted-foreground max-w-md mb-8">This public link is invalid, expired, or was removed.</p>
        <Link href="/">
          <Button className="gap-2 rounded-2xl">
            Roast your own site <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Brostique branded header */}
      <header className="border-b border-border glass sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center shadow-[0_0_12px_rgba(255,87,34,0.3)] group-hover:shadow-[0_0_20px_rgba(255,87,34,0.5)] transition-shadow">
              <Flame className="w-4 h-4 text-primary" />
            </div>
            <span className="font-black text-lg tracking-tight">Brostique</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">Someone shared their roast with you</span>
            <Link href="/sign-up">
              <Button size="sm" className="rounded-full px-5 gap-1.5 shadow-[0_0_16px_rgba(255,87,34,0.3)] hover:shadow-[0_0_24px_rgba(255,87,34,0.5)] transition-shadow">
                Roast My Site <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Shared badge */}
      <div className="border-b border-border bg-card/30">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-xs font-semibold text-primary">
            <Flame className="w-3 h-3" />
            Public Roast Report
          </div>
          <p className="text-xs text-muted-foreground">
            This report is publicly shared. <Link href="/sign-up" className="text-primary hover:underline font-semibold">Get your own free roast →</Link>
          </p>
        </div>
      </div>

      <main>
        <ReportView report={report} isShared={true} />
        {/* Paywall overlay for non-signed-in users — blurred lower content */}
        {!isSignedIn && (
          <div className="relative">
            <div className="h-48 bg-gradient-to-b from-transparent to-background/95 -mt-48 relative z-10 pointer-events-none" />
            <div className="bg-background/98 border-t border-border py-16 text-center px-4 relative z-20">
              <div className="max-w-md mx-auto">
                <div className="w-14 h-14 bg-primary/10 border border-primary/25 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Lock className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-2xl font-black mb-2">Want the full breakdown?</h2>
                <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                  Sign up free to see the complete AI analysis, score categories, quick wins, and rewritten copy — plus get 3 free roasts of your own site.
                </p>
                <Link href="/sign-up">
                  <Button size="lg" className="rounded-2xl px-8 shadow-[0_0_24px_rgba(255,87,34,0.35)] hover:shadow-[0_0_40px_rgba(255,87,34,0.5)] transition-shadow">
                    Get Full Access Free <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground mt-4">No credit card required · 3 free roasts instantly</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* CTA footer for shared page */}
      <div className="border-t border-border bg-card/60 py-12">
        <div className="container mx-auto px-4 text-center max-w-xl">
          <Flame className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-black mb-2">Is your site bleeding money too?</h2>
          <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
            Get your own brutally honest AI roast. 3 free credits, no card required.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="rounded-2xl px-8 shadow-[0_0_24px_rgba(255,87,34,0.35)] hover:shadow-[0_0_40px_rgba(255,87,34,0.55)] transition-shadow">
              Roast My Site Free <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
