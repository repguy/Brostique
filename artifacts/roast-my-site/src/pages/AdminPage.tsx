import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@clerk/react";
import { Flame, Users, FileText, TrendingUp, Settings, Save, AlertCircle, CheckCircle2, ChevronRight, BarChart3, Shield, Key, Package, Zap, CreditCard, Plus, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

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
  polar_product_id_credits_10: string;
  polar_product_id_credits_25: string;
  polar_product_id_credits_100: string;
  ai_provider: string;
  has_openrouter_key: boolean;
  has_polar_key: boolean;
  has_polar_webhook_secret: boolean;
  admin_clerk_id_configured: boolean;
}

interface AdminUser {
  id: number;
  clerkId: string;
  email: string | null;
  isPro: boolean;
  credits: number;
  createdAt: string;
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

function StatCard({ label, value, sub, icon: Icon, glow }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; glow?: boolean;
}) {
  return (
    <Card className={`bg-card border-border relative overflow-hidden ${glow ? 'border-primary/25 shadow-[0_0_20px_rgba(255,87,34,0.1)]' : ''}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${glow ? 'bg-primary/15' : 'bg-secondary'}`}>
            <Icon className={`w-4 h-4 ${glow ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
        </div>
        <div className="text-3xl font-black tracking-tight">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{label}</code>
      {ok ? (
        <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" /> Set
        </span>
      ) : (
        <span className="flex items-center gap-1 text-orange-400 text-xs font-semibold">
          <AlertCircle className="w-3.5 h-3.5" /> Missing
        </span>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [form, setForm] = useState({ openrouter_model: "", polar_product_id: "", polar_product_id_credits_10: "", polar_product_id_credits_25: "", polar_product_id_credits_100: "", ai_provider: "openai" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "settings">("overview");

  // Credit grant form
  const [grantClerkId, setGrantClerkId] = useState("");
  const [grantAmount, setGrantAmount] = useState("5");
  const [grantLoading, setGrantLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    load();
  }, [getToken]);

  async function load() {
    setLoading(true);
    try {
      const [s, cfg, u] = await Promise.all([
        apiFetch<AdminStats>("/admin/stats"),
        apiFetch<AdminSettings>("/admin/settings"),
        apiFetch<AdminUser[]>("/admin/users"),
      ]);
      setStats(s);
      setSettings(cfg);
      setUsers(u);
      setForm({
        openrouter_model: cfg.openrouter_model,
        polar_product_id: cfg.polar_product_id,
        polar_product_id_credits_10: cfg.polar_product_id_credits_10,
        polar_product_id_credits_25: cfg.polar_product_id_credits_25,
        polar_product_id_credits_100: cfg.polar_product_id_credits_100,
        ai_provider: cfg.ai_provider,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await apiFetch<AdminSettings>("/admin/settings", { method: "PUT", body: JSON.stringify(form) });
      setSettings(updated);
      toast({ title: "Settings saved", description: "Configuration updated." });
    } catch (e) {
      toast({ title: "Save failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleGrantCredits(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseInt(grantAmount, 10);
    if (!grantClerkId.trim() || isNaN(amount) || amount < 1) {
      toast({ title: "Invalid input", description: "Enter a valid Clerk ID and a positive number.", variant: "destructive" });
      return;
    }
    setGrantLoading(true);
    try {
      const result = await apiFetch<{ clerkId: string; credits: number; added: number }>(
        `/admin/users/${encodeURIComponent(grantClerkId.trim())}/credits`,
        { method: "POST", body: JSON.stringify({ amount }) }
      );
      toast({ title: "Credits granted!", description: `${result.added} credits added. ${result.clerkId} now has ${result.credits} credits.` });
      setGrantClerkId("");
      setGrantAmount("5");
      // Refresh users list
      const u = await apiFetch<AdminUser[]>("/admin/users");
      setUsers(u);
    } catch (e) {
      toast({ title: "Failed to grant credits", description: (e as Error).message, variant: "destructive" });
    } finally {
      setGrantLoading(false);
    }
  }

  const maxBar = stats ? Math.max(...stats.dailyActivity.map(d => d.reports), 1) : 1;
  const filteredUsers = users.filter(u =>
    !userSearch || u.clerkId.toLowerCase().includes(userSearch.toLowerCase()) || (u.email ?? "").toLowerCase().includes(userSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-black mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4 text-sm">{error}</p>
            <p className="text-xs text-muted-foreground mb-6 bg-muted/50 p-3 rounded-xl text-left">
              Set <code className="bg-background px-1 rounded">ADMIN_CLERK_ID</code> in your Replit Secrets to your Clerk user ID.
            </p>
            <Link href="/dashboard"><Button variant="outline" className="w-full">Back to Dashboard</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: BarChart3 },
    { id: "users" as const, label: "Users & Credits", icon: Users },
    { id: "settings" as const, label: "Configuration", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                <Flame className="w-4 h-4 text-primary" />
              </div>
              <span className="font-black hidden sm:inline">Brostique</span>
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="font-bold flex items-center gap-1.5 text-sm">
              <Shield className="w-3.5 h-3.5 text-primary" /> Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={load} className="text-muted-foreground">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Badge variant="outline" className="border-primary/40 text-primary bg-primary/5 text-xs">Admin Panel</Badge>
          </div>
        </div>
      </header>

      {/* Tab nav */}
      <div className="border-b border-border bg-card/30">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex gap-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-7xl space-y-8">

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Users" value={stats?.users.total ?? 0} sub={`${stats?.users.pro ?? 0} pro · ${stats?.users.free ?? 0} free`} icon={Users} />
              <StatCard label="Pro Subscribers" value={stats?.users.pro ?? 0} sub="paying" icon={TrendingUp} glow />
              <StatCard label="Total Roasts" value={stats?.reports.total ?? 0} sub={`${stats?.reports.today ?? 0} today`} icon={FileText} />
              <StatCard label="Avg Score" value={stats?.reports.avgScore != null ? `${stats.reports.avgScore}` : "—"} sub={`${stats?.reports.completed ?? 0} completed`} icon={BarChart3} />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Activity chart */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold">Daily Roasts — Last 7 Days</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats && stats.dailyActivity.length > 0 ? (
                    <div className="flex items-end gap-2 h-36">
                      {stats.dailyActivity.map((d) => (
                        <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
                          <div className="w-full flex items-end justify-center" style={{ height: "110px" }}>
                            <motion.div
                              className="w-full bg-primary/60 hover:bg-primary rounded-t-lg transition-colors cursor-default"
                              style={{ height: `${Math.max((d.reports / maxBar) * 100, d.reports > 0 ? 6 : 0)}%` }}
                              title={`${d.reports} roasts`}
                              initial={{ scaleY: 0, originY: 1 }}
                              animate={{ scaleY: 1 }}
                              transition={{ duration: 0.5, delay: 0.1 }}
                            />
                          </div>
                          <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                            {new Date(d.day + "T12:00:00Z").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-36 flex items-center justify-center text-muted-foreground text-sm">No activity</div>
                  )}
                </CardContent>
              </Card>

              {/* Top URLs */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold">Most Roasted Sites</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats && stats.topUrls.length > 0 ? (
                    <div className="space-y-2.5">
                      {stats.topUrls.slice(0, 7).map((item, i) => (
                        <div key={item.url} className="flex items-center gap-3">
                          <span className="text-xs font-mono text-muted-foreground w-4 shrink-0 text-right">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs truncate font-medium">{item.url.replace(/^https?:\/\//, "")}</div>
                          </div>
                          <Badge variant="secondary" className="shrink-0 text-xs">{item.count}×</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground text-sm">No reports yet</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* USERS & CREDITS TAB */}
        {activeTab === "users" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-8">

            {/* Grant Credits Form */}
            <Card className="bg-card border-primary/25 shadow-[0_0_25px_rgba(255,87,34,0.08)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="w-4 h-4 text-primary" /> Grant Credits to User
                </CardTitle>
                <CardDescription>Manually add roast credits to any account by their Clerk user ID.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGrantCredits} className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="grant-clerk-id" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Clerk User ID</Label>
                    <Input
                      id="grant-clerk-id"
                      placeholder="user_xxxxxxxxxxxxxxxx"
                      value={grantClerkId}
                      onChange={e => setGrantClerkId(e.target.value)}
                      className="font-mono text-sm"
                      required
                    />
                    <p className="text-xs text-muted-foreground">Click a user below to copy their ID</p>
                  </div>
                  <div className="sm:w-36 space-y-1.5">
                    <Label htmlFor="grant-amount" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Credits to Add</Label>
                    <Input
                      id="grant-amount"
                      type="number"
                      min="1"
                      max="9999"
                      value={grantAmount}
                      onChange={e => setGrantAmount(e.target.value)}
                      className="text-sm"
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" disabled={grantLoading} className="gap-2 shadow-[0_0_15px_rgba(255,87,34,0.25)] w-full sm:w-auto">
                      {grantLoading ? (
                        <div className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                      ) : <Plus className="w-4 h-4" />}
                      Grant Credits
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Users List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-black flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" /> All Users ({users.length})
                </h3>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search by email or ID..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className="pl-9 h-8 text-xs"
                  />
                </div>
              </div>
              <div className="rounded-2xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">User</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="text-center py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Credits</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Joined</th>
                        <th className="text-right py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-muted-foreground text-sm">No users found</td>
                        </tr>
                      ) : filteredUsers.map(user => (
                        <tr key={user.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-4">
                            <div>
                              {user.email ? (
                                <div className="font-medium text-xs">{user.email}</div>
                              ) : (
                                <div className="font-medium text-xs text-muted-foreground italic">No email</div>
                              )}
                              <div
                                className="font-mono text-[10px] text-muted-foreground/60 cursor-pointer hover:text-primary transition-colors"
                                onClick={() => { setGrantClerkId(user.clerkId); setActiveTab("users"); }}
                                title="Click to use in grant form"
                              >
                                {user.clerkId}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {user.isPro ? (
                              <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px]">PRO</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">FREE</Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`font-black text-sm ${user.credits <= 0 ? 'text-red-400' : user.credits <= 2 ? 'text-orange-400' : 'text-foreground'}`}>
                              {user.credits}
                            </span>
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell">
                            <span className="text-xs text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1 text-primary hover:bg-primary/10"
                              onClick={() => { setGrantClerkId(user.clerkId); setActiveTab("users"); }}
                            >
                              <CreditCard className="w-3 h-3" /> Grant
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* AI Settings */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Key className="w-4 h-4 text-primary" /> AI Provider
                  </CardTitle>
                  <CardDescription className="text-xs">Controls which AI generates your roasts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-xs">Provider</Label>
                    <div className="flex gap-3">
                      {(["openai", "openrouter"] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => setForm(f => ({ ...f, ai_provider: p }))}
                          className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold transition-colors ${
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
                      <Label htmlFor="model" className="text-xs">OpenRouter Model Slug</Label>
                      <Input
                        id="model"
                        placeholder="e.g. meta-llama/llama-3.3-70b-instruct:free"
                        value={form.openrouter_model}
                        onChange={e => setForm(f => ({ ...f, openrouter_model: e.target.value }))}
                        className="font-mono text-xs"
                      />
                      <p className="text-xs text-muted-foreground">
                        Find models at{" "}
                        <a href="https://openrouter.ai/models" target="_blank" rel="noreferrer" className="text-primary hover:underline">openrouter.ai/models</a>
                      </p>
                    </div>
                  )}

                  <div className="pt-3 border-t border-border space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Secret Status</p>
                    <StatusRow label="OPENROUTER_API_KEY" ok={settings?.has_openrouter_key ?? false} />
                  </div>
                </CardContent>
              </Card>

              {/* Polar Settings */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" /> Polar Payments
                  </CardTitle>
                  <CardDescription className="text-xs">Configure Polar product IDs for Pro plan and credit packs.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="polar_product_id" className="text-xs font-semibold">Pro Subscription Product ID</Label>
                    <Input
                      id="polar_product_id"
                      placeholder="e.g. prod_xxxxxxxx"
                      value={form.polar_product_id}
                      onChange={e => setForm(f => ({ ...f, polar_product_id: e.target.value }))}
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="pt-2 border-t border-border/60">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Credit Pack Product IDs</p>
                    <div className="space-y-2.5">
                      {[
                        { key: "polar_product_id_credits_10" as const, label: "Starter Pack (10 credits)", placeholder: "prod_credits10" },
                        { key: "polar_product_id_credits_25" as const, label: "Growth Pack (25 credits)", placeholder: "prod_credits25" },
                        { key: "polar_product_id_credits_100" as const, label: "Scale Pack (100 credits)", placeholder: "prod_credits100" },
                      ].map(({ key, label, placeholder }) => (
                        <div key={key} className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">{label}</Label>
                          <Input
                            placeholder={placeholder}
                            value={form[key]}
                            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                            className="font-mono text-xs h-8"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="pt-3 border-t border-border space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Secret Status</p>
                    <StatusRow label="POLAR_ACCESS_TOKEN" ok={settings?.has_polar_key ?? false} />
                    <StatusRow label="POLAR_WEBHOOK_SECRET" ok={settings?.has_polar_webhook_secret ?? false} />
                    <StatusRow label="ADMIN_CLERK_ID" ok={settings?.admin_clerk_id_configured ?? false} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="gap-2 min-w-[140px] shadow-[0_0_15px_rgba(255,87,34,0.2)]">
                {saving ? <div className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                Save Settings
              </Button>
            </div>

            {/* Checklist */}
            <Card className="bg-card border-border border-primary/20">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-primary" /> Setup Checklist
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {[
                    { label: "Clerk auth configured", ok: true },
                    { label: "Database connected", ok: true },
                    { label: "OpenRouter API key set", ok: settings?.has_openrouter_key ?? false },
                    { label: "Polar access token set", ok: settings?.has_polar_key ?? false },
                    { label: "Polar webhook secret set", ok: settings?.has_polar_webhook_secret ?? false },
                    { label: "Polar Pro product ID set", ok: !!(settings?.polar_product_id) },
                    { label: "Admin Clerk ID set", ok: settings?.admin_clerk_id_configured ?? false },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2 text-xs">
                      {item.ok
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        : <AlertCircle className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
                      <span className={item.ok ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 p-4 bg-muted/40 rounded-xl text-xs text-muted-foreground space-y-1.5">
                  <p className="font-bold text-foreground mb-1">To add secrets:</p>
                  <p>1. Open Replit → <strong>Secrets</strong> tab (lock icon in sidebar)</p>
                  <p>2. Add <code className="bg-background px-1 rounded">POLAR_ACCESS_TOKEN</code> — from polar.sh → Settings → API keys</p>
                  <p>3. Add <code className="bg-background px-1 rounded">OPENROUTER_API_KEY</code> — from openrouter.ai → Keys</p>
                  <p>4. Add <code className="bg-background px-1 rounded">ADMIN_CLERK_ID</code> — your Clerk user ID</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}
