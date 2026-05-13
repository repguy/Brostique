import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2, Zap, ArrowRight } from "lucide-react";
import { useCreateReport } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@clerk/react";
import { motion, AnimatePresence } from "framer-motion";

const ANALYSIS_STATES = [
  "Capturing screenshot...",
  "Reading your copy...",
  "Analyzing CTAs...",
  "Detecting trust signals...",
  "Auditing visual hierarchy...",
  "Roasting your funnel...",
  "Calculating roast score...",
];

export default function URLInput({ className = "" }: { className?: string }) {
  const [url, setUrl] = useState("");
  const [, setLocation] = useLocation();
  const { isSignedIn } = useAuth();
  const { toast } = useToast();
  const createReport = useCreateReport();
  const [stateIndex, setStateIndex] = useState(0);

  useEffect(() => {
    if (!createReport.isPending) return;
    const interval = setInterval(() => {
      setStateIndex(i => (i + 1) % ANALYSIS_STATES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [createReport.isPending]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    try {
      new URL(formattedUrl);
    } catch {
      toast({ title: "Invalid URL", description: "Please enter a valid website URL.", variant: "destructive" });
      return;
    }

    if (!isSignedIn) {
      setLocation("/sign-in");
      return;
    }

    createReport.mutate({ data: { url: formattedUrl } }, {
      onSuccess: (data) => setLocation(`/report/${data.id}`),
      onError: (err: any) => {
        toast({
          title: "Error creating roast",
          description: err?.data?.error || err?.message || "Please try again later.",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <div className="absolute left-4 flex items-center pointer-events-none z-10">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="paste your URL — e.g. stripe.com"
          className="pl-12 pr-36 w-full h-full bg-card/80 border-border/60 focus-visible:ring-primary/50 focus-visible:border-primary/50 shadow-xl text-base rounded-2xl backdrop-blur-sm placeholder:text-muted-foreground/50 transition-all"
          disabled={createReport.isPending}
        />
        <Button
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-xl px-5 py-2 h-[calc(100%-12px)] bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-semibold shadow-[0_0_20px_rgba(255,100,50,0.4)] disabled:shadow-none"
          disabled={createReport.isPending || !url}
        >
          {createReport.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <span className="flex items-center gap-1.5">
              Roast It <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {createReport.isPending && (
          <motion.div
            key={stateIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            className="absolute -bottom-8 left-4 flex items-center gap-2 text-sm text-primary/80"
          >
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            {ANALYSIS_STATES[stateIndex]}
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
