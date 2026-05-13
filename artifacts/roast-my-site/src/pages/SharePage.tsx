import { useParams, Link } from "wouter";
import { AlertCircle, Zap } from "lucide-react";
import { useGetPublicReport, getGetPublicReportQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import ReportView from "@/components/ReportView";

export default function SharePage() {
  const { shareSlug } = useParams<{ shareSlug: string }>();

  const { data: report, isLoading, error } = useGetPublicReport(shareSlug || "", {
    query: {
      enabled: !!shareSlug,
      queryKey: getGetPublicReportQueryKey(shareSlug || "")
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
        <h1 className="text-2xl font-bold">Loading report...</h1>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-4">
        <AlertCircle className="w-12 h-12 text-destructive mb-6" />
        <h1 className="text-3xl font-bold mb-2">Report not found</h1>
        <p className="text-muted-foreground max-w-md mb-8">This public link is invalid or has expired.</p>
        <Link href="/">
          <Button>Go to RoastMySite</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold tracking-tight">RoastMySite</span>
          </Link>
          <Link href="/">
            <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              Roast Your Own Site
            </Button>
          </Link>
        </div>
      </header>

      <main>
        {/* Pass isShared flag so we can hide sensitive actions like toggle favorite if needed, though they shouldn't work unauthenticated anyway */}
        <ReportView report={report} isShared={true} />
      </main>
    </div>
  );
}
