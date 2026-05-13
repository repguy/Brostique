import { useEffect } from "react";
import { useParams, Link } from "wouter";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { useGetReport, getGetReportQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import ReportView from "@/components/ReportView";

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const reportId = parseInt(id || "0", 10);
  const queryClient = useQueryClient();

  const { data: report, isLoading, error } = useGetReport(reportId, {
    query: {
      enabled: !!reportId,
      queryKey: getGetReportQueryKey(reportId)
    }
  });

  // Polling logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (report && (report.status === 'pending' || report.status === 'processing')) {
      interval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: getGetReportQueryKey(reportId) });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [report?.status, reportId, queryClient]);

  if (isLoading && !report) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-6" />
        <h1 className="text-3xl font-bold mb-2">Analyzing your site...</h1>
        <p className="text-muted-foreground max-w-md">Our AI is tearing apart your layout, copy, and conversion signals. This usually takes about 15-30 seconds.</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-4">
        <AlertCircle className="w-12 h-12 text-destructive mb-6" />
        <h1 className="text-3xl font-bold mb-2">Report not found</h1>
        <p className="text-muted-foreground max-w-md mb-8">We couldn't load this report. It might have been deleted or the ID is incorrect.</p>
        <Link href="/dashboard">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main>
        <ReportView report={report} />
      </main>
    </div>
  );
}
