import { Link } from "wouter";
import { Shield, Zap, Target, ArrowRight, Share2, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import URLInput from "@/components/URLInput";
import { useGetBillingPlans, useCreateCheckoutSession } from "@workspace/api-client-react";

export default function LandingPage() {
  const { data: plans } = useGetBillingPlans();
  const createCheckoutSession = useCreateCheckoutSession();

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 glass">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-lg tracking-tight">RoastMySite</span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </Link>
            <Link href="/sign-up" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(255,87,34,0.3)]">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="relative px-4 pt-20 pb-32 overflow-hidden flex flex-col items-center text-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-8 border border-border">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            The sharpest AI conversion coach on the internet
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter max-w-4xl leading-[1.1] mb-6">
            Stop losing customers to <br className="hidden md:block" />
            <span className="text-gradient">shitty landing pages.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            Paste your URL. Get a brutally honest, no-filter roast of your UX, copy, and conversion signals. Because your mom won't tell you why your site isn't converting, but we will.
          </p>

          <div className="w-full max-w-2xl mx-auto mb-8">
            <URLInput className="h-14 text-lg" />
          </div>

          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Shield className="w-4 h-4" /> Trusted by 10,000+ founders, agencies, and indie hackers.
          </p>
        </section>

        {/* Demo Section */}
        <section id="how-it-works" className="py-24 bg-card/30 border-y border-border">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">What you get in 30 seconds</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">We analyze over 50 data points across your site to give you actionable feedback you can actually use.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Target className="w-6 h-6 text-primary" />,
                  title: "Brutal Honesty",
                  description: "No corporate fluff. If your headline is confusing, we'll tell you it's confusing and why."
                },
                {
                  icon: <Zap className="w-6 h-6 text-orange-400" />,
                  title: "Actionable Wins",
                  description: "We don't just point out problems. We give you rewritten copy and UX fixes."
                },
                {
                  icon: <Share2 className="w-6 h-6 text-blue-400" />,
                  title: "Shareable Reports",
                  description: "Get a beautiful, cinematic report you can share with your team or flex on Twitter."
                }
              ].map((feature, i) => (
                <div key={i} className="bg-card border border-border p-6 rounded-2xl hover:border-primary/50 transition-colors group">
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Simple, transparent pricing</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Start roasting for free. Upgrade when you need more firepower.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {(plans || []).map((plan) => (
                <div key={plan.id} className={`bg-card border rounded-3xl p-8 relative flex flex-col ${plan.name === 'Pro' ? 'border-primary shadow-[0_0_30px_rgba(255,87,34,0.15)]' : 'border-border'}`}>
                  {plan.name === 'Pro' && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-4xl font-extrabold">${(plan.price / 100).toFixed(0)}</span>
                    <span className="text-muted-foreground">/{plan.interval}</span>
                  </div>
                  
                  <ul className="space-y-4 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="mt-1 bg-primary/20 p-0.5 rounded-full">
                          <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-foreground/80">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className="w-full h-12 text-base" 
                    variant={plan.name === 'Pro' ? 'default' : 'outline'}
                    onClick={() => {
                      if (plan.price > 0 && plan.stripePriceId) {
                        createCheckoutSession.mutate(
                          { data: { priceId: plan.stripePriceId } },
                          { onSuccess: (data) => window.location.href = data.url }
                        );
                      } else {
                        window.location.href = "/sign-up";
                      }
                    }}
                    disabled={createCheckoutSession.isPending}
                  >
                    {createCheckoutSession.isPending && plan.name === 'Pro' ? 'Loading...' : `Get ${plan.name}`}
                  </Button>
                </div>
              ))}

              {(!plans || plans.length === 0) && (
                <>
                  <div className="bg-card border border-border rounded-3xl p-8 flex flex-col">
                    <h3 className="text-2xl font-bold mb-2">Free</h3>
                    <div className="flex items-baseline gap-2 mb-6">
                      <span className="text-4xl font-extrabold">$0</span>
                    </div>
                    <ul className="space-y-4 mb-8 flex-1">
                      <li className="flex items-start gap-3">
                        <div className="mt-1 bg-primary/20 p-0.5 rounded-full"><svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                        <span>3 Roasts per day</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="mt-1 bg-primary/20 p-0.5 rounded-full"><svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                        <span>Standard analysis depth</span>
                      </li>
                    </ul>
                    <Link href="/sign-up" className="w-full">
                      <Button className="w-full h-12" variant="outline">Start Free</Button>
                    </Link>
                  </div>
                  <div className="bg-card border border-primary shadow-[0_0_30px_rgba(255,87,34,0.15)] rounded-3xl p-8 relative flex flex-col">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Pro</div>
                    <h3 className="text-2xl font-bold mb-2">Pro</h3>
                    <div className="flex items-baseline gap-2 mb-6">
                      <span className="text-4xl font-extrabold">$19</span>
                      <span className="text-muted-foreground">/mo</span>
                    </div>
                    <ul className="space-y-4 mb-8 flex-1">
                      <li className="flex items-start gap-3">
                        <div className="mt-1 bg-primary/20 p-0.5 rounded-full"><svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                        <span>Unlimited daily roasts</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="mt-1 bg-primary/20 p-0.5 rounded-full"><svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                        <span>Deep-dive conversion analysis</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="mt-1 bg-primary/20 p-0.5 rounded-full"><svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                        <span>Priority processing</span>
                      </li>
                    </ul>
                    <Link href="/sign-up" className="w-full">
                      <Button className="w-full h-12" variant="default">Upgrade to Pro</Button>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-12 bg-card">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="font-bold">RoastMySite</span>
          </div>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} RoastMySite. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
