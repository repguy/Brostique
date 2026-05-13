import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@clerk/react";
import { Zap, Users, FileText, TrendingUp, Settings, Save, AlertCircle, CheckCircle2, ChevronRight, BarChart3, Shield, Key, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface AdminStats {
  users: { total: number; pro: number; free: number };
  reports: { total: number; today: number; completed: number; avgScore: number | null };
  dailyActivity: Array<{ day: string; reports: number }>;
  topUrls: Array<{ url: string; count: number }>;
}

interface AdminSettings {
  openrouter_model: string;
  polar_product_id: string;
  ai_provider: string;
  has_openrouter_key: boolean;
  has_polar_key: boolean;
  admin_clerk_id_configured: boolean;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error: string }).error || res.statusText);
  }
  return res.json() as Promise<T>;
}

function StatCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; accent?: string;
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent ?? "bg-primary/10"}`}>
            <Icon className={`w-5 h-5 ${accent ? "text-white" : "text-primary"}`} />
          </div>
        </div>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function AdminPage() {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [form, setForm] = useState({ openrouter_model: "", polar_product_id: "", ai_provider: "openai" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [s, cfg] = await Promise.all([
          apiFetch<AdminStats>("/admin/stats"),
          apiFetch<AdminSettings>("/admin/settings"),
        ]);
        setStats(s);
        setSettings(cfg);
        setForm({
          openrouter_model: cfg.openrouter_model,
          polar_product_id: cfg.polar_product_id,
          ai_provider: cfg.ai_provider,
        });
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [getToken]);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await apiFetch<AdminSettings>("/admin/settings", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      setSettings(updated);
      toast({ title: "Settings saved", description: "Configuration updated successfully." });
    } catch (e) {
      toast({ title: "Save failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const maxBar = stats ? Math.max(...stats.dailyActivity.map(d => d.reports), 1) : 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p>Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <p className="text-sm text-muted-foreground mb-6">
              To become admin, set <code className="bg-muted px-1 rounded text-xs">ADMIN_CLERK_ID</code> in your Replit Secrets to your Clerk user ID.
            </p>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Zap className="w-5 h-5 text-primary" />
              <span className="font-semibold">RoastMySite</span>
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> Admin
            </span>
          </div>
          <Badge variant="outline" className="border-primary/40 text-primary bg-primary/5">Admin Panel</Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-7xl space-y-10">

        {/* Stats Grid */}
        <section>
          <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" /> Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Users" value={stats?.users.total ?? 0} sub={`${stats?.users.pro ?? 0} pro · ${stats?.users.free ?? 0} free`} icon={Users} />
            <StatCard label="Pro Subscribers" value={stats?.users.pro ?? 0} sub="paying customers" icon={TrendingUp} accent="bg-primary" />
            <StatCard label="Total Roasts" value={stats?.reports.total ?? 0} sub={`${stats?.reports.today ?? 0} today`} icon={FileText} />
            <StatCard
              label="Avg Score"
              value={stats?.reports.avgScore != null ? `${stats.reports.avgScore}/100` : "—"}
              sub={`${stats?.reports.completed ?? 0} completed`}
              icon={BarChart3}
            />
          </div>
        </section>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Daily Activity Chart */}
          <section>
            <Card className="bg-card border-border h-full">
              <CardHeader>
                <CardTitle className="text-base">Daily Roasts — Last 7 Days</CardTitle>
              </CardHeader>
              <CardContent>
                {stats && stats.dailyActivity.length > 0 ? (
                  <div className="flex items-end gap-2 h-40">
                    {stats.dailyActivity.map((d) => (
                      <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex items-end justify-center" style={{ height: "120px" }}>
                          <div
                            className="w-full bg-primary/80 rounded-t-md transition-all hover:bg-primary"
                            style={{ height: `${Math.max((d.reports / maxBar) * 100, d.reports > 0 ? 8 : 0)}%` }}
                            title={`${d.reports} roasts`}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground rotate-45 origin-left translate-x-2">
                          {new Date(d.day + "T12:00:00Z").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
                    No activity in the last 7 days
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Top URLs */}
          <section>
            <Card className="bg-card border-border h-full">
              <CardHeader>
                <CardTitle className="text-base">Most Roasted Sites</CardTitle>
              </CardHeader>
              <CardContent>
                {stats && stats.topUrls.length > 0 ? (
                  <div className="space-y-3">
                    {stats.topUrls.slice(0, 8).map((item, i) => (
                      <div key={item.url} className="flex items-center gap-3">
                        <span className="text-xs font-mono text-muted-foreground w-4 shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm truncate font-medium">{item.url.replace(/^https?:\/\//, "")}</div>
                        </div>
                        <Badge variant="secondary" className="shrink-0">{item.count}×</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm py-10">
                    No reports yet
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Settings */}
        <section>
          <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" /> Configuration
          </h2>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* AI Settings */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="w-4 h-4 text-primary" /> AI Provider
                </CardTitle>
                <CardDescription>
                  Controls which AI is used to generate roasts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Provider selector */}
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <div className="flex gap-3">
                    {(["openai", "openrouter"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setForm(f => ({ ...f, ai_provider: p }))}
                        className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                          form.ai_provider === p
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {p === "openai" ? "Replit OpenAI" : "OpenRouter"}
                      </button>
                    ))}
                  </div>
                </div>

                {form.ai_provider === "openrouter" && (
                  <div className="space-y-2">
                    <Label htmlFor="model">OpenRouter Model Slug</Label>
                    <Input
                      id="model"
                      placeholder="e.g. meta-llama/llama-3.3-70b-instruct:free"
                      value={form.openrouter_model}
                      onChange={e => setForm(f => ({ ...f, openrouter_model: e.target.value }))}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Find free models at{" "}
                      <a href="https://openrouter.ai/models?order=pricing&supported_parameters=tools" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        openrouter.ai/models
                      </a>
                    </p>
                  </div>
                )}

                {/* Key status indicators */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Secret Status</p>
                  <StatusRow label="OPENROUTER_API_KEY" ok={settings?.has_openrouter_key ?? false} />
                </div>
              </CardContent>
            </Card>

            {/* Polar Settings */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" /> Polar Payments
                </CardTitle>
                <CardDescription>
                  Configure your Polar product for the Pro plan checkout.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="polar_product_id">Pro Product ID</Label>
                  <Input
                    id="polar_product_id"
                    placeholder="e.g. prod_xxxxxxxxxxxxxxxx"
                    value={form.polar_product_id}
                    onChange={e => setForm(f => ({ ...f, polar_product_id: e.target.value }))}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Find in{" "}
                    <a href="https://polar.sh" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      polar.sh
                    </a>{" "}
                    → Products → copy the product ID.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Secret Status</p>
                  <StatusRow label="POLAR_ACCESS_TOKEN" ok={settings?.has_polar_key ?? false} />
                  <StatusRow label="ADMIN_CLERK_ID" ok={settings?.admin_clerk_id_configured ?? false} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-5 flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="gap-2 min-w-[140px]">
              {saving ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Settings
                </>
              )}
            </Button>
          </div>
        </section>

        {/* Setup Guide */}
        <section>
          <Card className="bg-card border-border border-primary/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-primary" /> Setup Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { label: "Clerk auth configured", ok: true },
                  { label: "Database connected", ok: true },
                  { label: "OpenRouter API key set", ok: settings?.has_openrouter_key ?? false },
                  { label: "Polar access token set", ok: settings?.has_polar_key ?? false },
                  { label: "Polar product ID set", ok: !!(settings?.polar_product_id) },
                  { label: "Admin Clerk ID set", ok: settings?.admin_clerk_id_configured ?? false },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2 text-sm">
                    {item.ok
                      ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      : <AlertCircle className="w-4 h-4 text-orange-500 shrink-0" />
                    }
                    <span className={item.ok ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 p-4 bg-muted/50 rounded-xl text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground mb-2">To add secrets:</p>
                <p>1. Open Replit → <strong>Secrets</strong> tab (lock icon in the sidebar)</p>
                <p>2. Add <code className="bg-background px-1 rounded">POLAR_ACCESS_TOKEN</code> — from polar.sh → Settings → API keys</p>
                <p>3. Add <code className="bg-background px-1 rounded">OPENROUTER_API_KEY</code> — from openrouter.ai → Keys</p>
                <p>4. Add <code className="bg-background px-1 rounded">ADMIN_CLERK_ID</code> — your Clerk user ID (from Clerk dashboard → Users)</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{label}</code>
      {ok ? (
        <span className="flex items-center gap-1 text-green-500 text-xs font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" /> Set
        </span>
      ) : (
        <span className="flex items-center gap-1 text-orange-500 text-xs font-medium">
          <AlertCircle className="w-3.5 h-3.5" /> Missing
        </span>
      )}
    </div>
  );
}
