import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Loader2 } from "lucide-react";
import { useCreateReport } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@clerk/react";

export default function URLInput({ className = "" }: { className?: string }) {
  const [url, setUrl] = useState("");
  const [, setLocation] = useLocation();
  const { isSignedIn } = useAuth();
  const { toast } = useToast();
  const createReport = useCreateReport();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    // Basic URL validation/formatting
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    try {
      new URL(formattedUrl);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid website URL.",
        variant: "destructive"
      });
      return;
    }

    if (!isSignedIn) {
      // Redirect to sign in, passing the URL maybe via state/query if we wanted, 
      // but simple redirect is fine per requirements
      setLocation('/sign-in');
      return;
    }

    createReport.mutate({ data: { url: formattedUrl } }, {
      onSuccess: (data) => {
        setLocation(`/report/${data.id}`);
      },
      onError: (err: any) => {
        toast({
          title: "Error creating roast",
          description: err.error || "Please try again later.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className={`relative flex w-full items-center ${className}`}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
      <Input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter website URL (e.g. stripe.com)"
        className="pl-12 pr-32 w-full h-full bg-card border-border focus-visible:ring-primary shadow-lg text-base rounded-full"
        disabled={createReport.isPending}
      />
      <Button 
        type="submit" 
        className="absolute right-1.5 top-1.5 bottom-1.5 rounded-full px-6 bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-semibold"
        disabled={createReport.isPending || !url}
      >
        {createReport.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Roast It"}
      </Button>
    </form>
  );
}
