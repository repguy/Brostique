import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Flame, Trophy, TrendingDown, TrendingUp, ExternalLink, ArrowLeft, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface LeaderboardEntry {
  id: number;
  url: string;
  overallScore: number;
  pageTitle: string | null;
  screenshotUrl: string | null;
  shareSlug: string | null;
  createdAt: string;
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30"
    : score >= 40 ? "text-orange-400 bg-orange-500/15 border-orange-500/30"
    : "text-red-400 bg-red-500/15 border-red-500/30";
  return (
    <div className={`text-2xl font-black w-14 h-14 rounded-2xl border flex items-center justify-center ${color}`}>
      {score}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
  if (rank === 2) return <span className="text-sm font-black text-slate-300">#2</span>;
  if (rank === 3) return <span className="text-sm font-black text-amber-600">#3</span>;
  return <span className="text-sm font-semibold text-muted-foreground">#{rank}</span>;
}

export default function LeaderboardPage() {
  const [mode, setMode] = useState<"worst" | "best">("worst");
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/leaderboard?mode=${mode}&limit=20`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [mode]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
              <Flame className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-black text-base">Brostique</span>
          </div>
          <Link href="/sign-up">
            <Button size="sm" className="rounded-full text-xs px-4">Get Roasted Free</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-sm font-semibold text-primary mb-5">
            <Trophy className="w-4 h-4" /> Public Leaderboard
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
            The Hall of {mode === "worst" ? "Shame" : "Fame"}
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            {mode === "worst"
              ? "The most brutally roasted sites — shared publicly by their brave (or masochistic) owners."
              : "The highest-performing landing pages that passed the AI roast test."}
          </p>
        </div>

        <div className="flex gap-2 justify-center mb-8">
          <Button
            variant={mode === "worst" ? "default" : "outline"}
            size="sm"
            className="gap-2 rounded-full"
            onClick={() => setMode("worst")}
          >
            <TrendingDown className="w-4 h-4" /> Worst Scores
          </Button>
          <Button
            variant={mode === "best" ? "default" : "outline"}
            size="sm"
            className="gap-2 rounded-full"
            onClick={() => setMode("best")}
          >
            <TrendingUp className="w-4 h-4" /> Best Scores
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-20 bg-card rounded-2xl animate-pulse border border-border" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-semibold mb-2">No public roasts yet</p>
            <p className="text-sm mb-6">Be the first to share your roast on the leaderboard.</p>
            <Link href="/sign-up">
              <Button className="rounded-full">Get Roasted Free</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 hover:border-border/80 transition-colors group"
              >
                <div className="w-8 flex items-center justify-center shrink-0">
                  <RankBadge rank={i + 1} />
                </div>
                <ScoreBadge score={Math.round(entry.overallScore)} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{entry.pageTitle || entry.url.replace(/^https?:\/\//, "")}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">{entry.url.replace(/^https?:\/\//, "")}</p>
                </div>
                {entry.shareSlug && (
                  <Link href={`/share/${entry.shareSlug}`}>
                    <Button variant="ghost" size="sm" className="gap-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                      View <ExternalLink className="w-3 h-3" />
                    </Button>
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-muted-foreground text-sm mb-4">Want to appear here? Get your site roasted and share the report publicly.</p>
          <Link href="/sign-up">
            <Button className="rounded-full shadow-[0_0_20px_rgba(255,87,34,0.3)]">
              Roast My Site Free <Flame className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
