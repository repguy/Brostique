import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { ArrowLeft, Loader2, AlertCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useGetReport, getGetReportQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import ReportView from "@/components/ReportView";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface HistoryEntry { id: number; overallScore: number | null; createdAt: string; isCurrent: boolean; }

function BeforeAfterBanner({ reportId }: { reportId: number }) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  useEffect(() => {
    fetch(`${API_BASE}/api/reports/${reportId}/history`, { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(setHistory)
      .catch(() => {});
  }, [reportId]);

  if (history.length < 2) return null;

  const current = history.find(h => h.isCurrent);
  const previous = history.find(h => !h.isCurrent);
  if (!current || !previous || current.overallScore == null || previous.overallScore == null) return null;

  const delta = Math.round(current.overallScore) - Math.round(previous.overallScore);
  const color = delta > 0 ? "text-emerald-400" : delta < 0 ? "text-red-400" : "text-muted-foreground";
  const bg = delta > 0 ? "border-emerald-500/25 bg-emerald-500/8" : delta < 0 ? "border-red-500/25 bg-red-500/8" : "border-border bg-card";
  const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;

  return (
    <div className={`mx-4 mt-4 rounded-2xl border px-5 py-3 flex items-center gap-4 ${bg}`}>
      <Icon className={`w-5 h-5 ${color} shrink-0`} />
      <div className="flex-1 text-sm">
        <span className="font-semibold text-foreground">Score Change: </span>
        <span className={`font-black ${color}`}>{delta > 0 ? "+" : ""}{delta} points</span>
        <span className="text-muted-foreground ml-2">vs previous roast ({Math.round(previous.overallScore)} → {Math.round(current.overallScore)})</span>
      </div>
      <div className="flex gap-2">
        {history.filter(h => !h.isCurrent).slice(0, 3).map(h => (
          <Link key={h.id} href={`/report/${h.id}`}>
            <Button variant="outline" size="sm" className="text-xs rounded-xl h-7">
              #{h.id} · {Math.round(h.overallScore ?? 0)}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}

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
        <div className="container mx-auto px-4 h-14 flex items-center">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </Link>
        </div>
      </header>

      {report.status === "completed" && <BeforeAfterBanner reportId={reportId} />}

      <main>
        <ReportView report={report} />
      </main>
    </div>
  );
}
