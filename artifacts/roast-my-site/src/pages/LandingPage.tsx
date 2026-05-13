import { useRef } from "react";
import { Link } from "wouter";
import { Shield, Zap, Target, ArrowRight, Share2, Flame, Star, TrendingUp, MousePointerClick, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import URLInput from "@/components/URLInput";
import { useGetBillingPlans, useCreateCheckoutSession } from "@workspace/api-client-react";
import { motion, useInView } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

function CheckIcon() {
  return (
    <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center">
      <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
}

function SectionHeading({ label, title, sub }: { label?: string; title: React.ReactNode; sub?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={stagger}
      className="text-center mb-16"
    >
      {label && (
        <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-[0.2em] text-primary mb-4">{label}</motion.p>
      )}
      <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">{title}</motion.h2>
      {sub && <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">{sub}</motion.p>}
    </motion.div>
  );
}

const SOCIAL_PROOF = [
  { name: "Marco R.", role: "SaaS Founder", text: "Fixed our headline in 10 mins and signups went up 40%. Brutal and accurate.", stars: 5 },
  { name: "Priya S.", role: "Growth Hacker", text: "The best $0 I've ever spent. This thing found issues my $5k agency missed.", stars: 5 },
  { name: "Jake L.", role: "Indie Hacker", text: "I've used every conversion tool. This is the only one I actually read top to bottom.", stars: 5 },
];

const FEATURES = [
  { icon: <Target className="w-6 h-6 text-primary" />, title: "Surgical Honesty", description: "No corporate sugarcoating. If your headline is vague and your CTA is weak, we say so — with receipts." },
  { icon: <Zap className="w-6 h-6 text-orange-400" />, title: "Copy Rewrites Included", description: "Don't just get problems. Get a rewritten headline and CTA you can steal and use immediately." },
  { icon: <TrendingUp className="w-6 h-6 text-emerald-400" />, title: "Scored Across 8 Axes", description: "Copy clarity, trust signals, CTA strength, visual hierarchy, mobile UX, load speed, and more." },
  { icon: <Share2 className="w-6 h-6 text-blue-400" />, title: "Shareable Report Cards", description: "Generate a public link to share your roast with your team, investors, or haters on Twitter." },
  { icon: <Flame className="w-6 h-6 text-rose-400" />, title: "Quick Wins List", description: "Prioritized list of high-impact fixes you can implement today, no dev required." },
  { icon: <MousePointerClick className="w-6 h-6 text-violet-400" />, title: "3-Second Test", description: "We simulate what a first-time visitor thinks in their first 3 seconds on your page." },
];

export default function LandingPage() {
  const { data: plans } = useGetBillingPlans();
  const createCheckoutSession = useCreateCheckoutSession();
  const featuresRef = useRef(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: "-80px" });
  const socialRef = useRef(null);
  const socialInView = useInView(socialRef, { once: true, margin: "-80px" });

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-x-hidden">
      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 glass">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center shadow-[0_0_12px_rgba(255,87,34,0.3)]">
              <Flame className="w-4 h-4 text-primary" />
            </div>
            <span className="font-black text-lg tracking-tight">Brostique</span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#love" className="hover:text-foreground transition-colors">Reviews</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
              Sign in
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="rounded-full px-5 shadow-[0_0_20px_rgba(255,87,34,0.35)] hover:shadow-[0_0_30px_rgba(255,87,34,0.5)] transition-shadow">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-20 overflow-hidden">
          {/* Bg glows */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-primary/8 rounded-full blur-[140px]" />
            <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-orange-500/6 rounded-full blur-[100px]" />
            <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-rose-500/6 rounded-full blur-[80px]" />
          </div>
          {/* Grid overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{ backgroundImage: "linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

          <div className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-sm font-semibold text-primary mb-8 shadow-[0_0_20px_rgba(255,87,34,0.12)]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI-powered conversion roasting — 3 free credits
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.95] mb-6"
            >
              Your landing page{" "}
              <span className="block text-gradient mt-1">is bleeding money.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed mb-12"
            >
              Paste your URL. Get a brutally honest AI roast across 8 conversion dimensions — with rewritten copy, quick wins, and a score that stings. Because your mom lied to you about your landing page.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-2xl mx-auto mb-6 h-14"
            >
              <URLInput className="h-14" />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="text-sm text-muted-foreground flex items-center gap-2"
            >
              <Shield className="w-3.5 h-3.5 text-primary/60" />
              No credit card required · 3 free roasts · Results in ~30 seconds
            </motion.p>
          </div>

          {/* Floating decorative badge */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-8 top-1/3 hidden lg:flex flex-col items-center gap-1 bg-card border border-border p-4 rounded-2xl shadow-xl"
          >
            <div className="text-4xl font-black text-red-500">32</div>
            <div className="text-xs text-muted-foreground font-medium">Roast Score</div>
            <div className="text-[10px] text-muted-foreground/60 mt-1 max-w-[80px] text-center">your-site.com</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.0, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-8 bottom-1/3 hidden lg:flex items-start gap-3 bg-card border border-border px-4 py-3 rounded-2xl shadow-xl max-w-[220px]"
          >
            <div className="mt-0.5 w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="text-xs font-semibold">Quick Win</div>
              <div className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">Add social proof above the fold — it's missing entirely</div>
            </div>
          </motion.div>
        </section>

        {/* Features */}
        <section id="features" className="py-28 bg-card/20 border-y border-border relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)", backgroundSize: "24px 24px" }} />
          <div className="container mx-auto px-4 relative z-10">
            <SectionHeading
              label="What's inside"
              title={<>Everything you need to stop <span className="text-gradient">leaving conversions</span> on the table</>}
              sub="We analyze 50+ signals across your landing page in under 30 seconds."
            />
            <motion.div
              ref={featuresRef}
              initial="hidden"
              animate={featuresInView ? "visible" : "hidden"}
              variants={stagger}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {FEATURES.map((f, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="group bg-card border border-border hover:border-primary/40 rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,87,34,0.08)] relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-2 relative z-10">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed relative z-10">{f.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-28">
          <div className="container mx-auto px-4 max-w-4xl">
            <SectionHeading label="How it works" title="30 seconds from URL to actionable roast" />
            <div className="relative">
              <div className="absolute left-[22px] top-0 bottom-0 w-px bg-gradient-to-b from-primary/40 via-border to-transparent hidden sm:block" />
              {[
                { step: "01", title: "Paste your URL", desc: "Drop any landing page URL. No install, no extension, no signup required to try." },
                { step: "02", title: "Our AI goes to work", desc: "We screenshot your page, extract your copy, and run it through our conversion roast engine." },
                { step: "03", title: "Get your score + roast", desc: "A full report: 8 category scores, deep-dive analysis, rewritten copy, and a list of quick wins." },
                { step: "04", title: "Fix & share", desc: "Use the fixes, share the report with your team, or flex on X. Your call." },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="flex gap-8 mb-12 last:mb-0"
                >
                  <div className="w-11 h-11 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0 font-black text-primary text-sm shadow-[0_0_15px_rgba(255,87,34,0.2)] relative z-10">
                    {item.step}
                  </div>
                  <div className="pt-1.5">
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section id="love" className="py-28 bg-card/20 border-y border-border">
          <div className="container mx-auto px-4">
            <SectionHeading label="People are obsessed" title={<>Don't take our word for it</>} />
            <motion.div
              ref={socialRef}
              initial="hidden"
              animate={socialInView ? "visible" : "hidden"}
              variants={stagger}
              className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
            >
              {SOCIAL_PROOF.map((review, i) => (
                <motion.div key={i} variants={fadeUp} className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4">
                  <div className="flex gap-1">
                    {Array.from({ length: review.stars }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-foreground/90 leading-relaxed flex-1">"{review.text}"</p>
                  <div>
                    <div className="font-semibold text-sm">{review.name}</div>
                    <div className="text-xs text-muted-foreground">{review.role}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-28">
          <div className="container mx-auto px-4 max-w-5xl">
            <SectionHeading
              label="Pricing"
              title="Start for free. Scale when you're hooked."
              sub="3 free credits to get started. No card required."
            />
            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {(plans && plans.length > 0 ? plans : null)?.map((plan) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className={`bg-card border rounded-3xl p-8 relative flex flex-col ${plan.name === 'Pro' ? 'border-primary shadow-[0_0_40px_rgba(255,87,34,0.15)]' : 'border-border'}`}
                >
                  {plan.name === 'Pro' && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(255,87,34,0.4)]">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-2xl font-black mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1.5 mb-6">
                    <span className="text-5xl font-black">${(plan.price / 100).toFixed(0)}</span>
                    <span className="text-muted-foreground">/{plan.interval}</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm"><CheckIcon /><span className="text-foreground/80">{feature}</span></li>
                    ))}
                  </ul>
                  <Button
                    className="w-full h-12 text-base rounded-2xl"
                    variant={plan.name === 'Pro' ? 'default' : 'outline'}
                    onClick={() => {
                      if (plan.price > 0 && plan.stripePriceId) {
                        createCheckoutSession.mutate({ data: { priceId: plan.stripePriceId } }, { onSuccess: (d) => { window.location.href = d.url; } });
                      } else { window.location.href = "/sign-up"; }
                    }}
                    disabled={createCheckoutSession.isPending}
                  >
                    {createCheckoutSession.isPending && plan.name === 'Pro' ? 'Loading...' : `Get ${plan.name}`}
                  </Button>
                </motion.div>
              ))}

              {(!plans || plans.length === 0) && (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="bg-card border border-border rounded-3xl p-8 flex flex-col"
                  >
                    <h3 className="text-2xl font-black mb-2">Free</h3>
                    <div className="flex items-baseline gap-1.5 mb-6"><span className="text-5xl font-black">$0</span></div>
                    <ul className="space-y-3 mb-8 flex-1">
                      <li className="flex items-start gap-3 text-sm"><CheckIcon /><span>3 roast credits to start</span></li>
                      <li className="flex items-start gap-3 text-sm"><CheckIcon /><span>Full conversion analysis</span></li>
                      <li className="flex items-start gap-3 text-sm"><CheckIcon /><span>Shareable report link</span></li>
                    </ul>
                    <Link href="/sign-up">
                      <Button className="w-full h-12 text-base rounded-2xl" variant="outline">Start Free — No Card</Button>
                    </Link>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="bg-card border border-primary shadow-[0_0_40px_rgba(255,87,34,0.15)] rounded-3xl p-8 relative flex flex-col"
                  >
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(255,87,34,0.4)]">
                      Most Popular
                    </div>
                    <h3 className="text-2xl font-black mb-2">Pro</h3>
                    <div className="flex items-baseline gap-1.5 mb-6"><span className="text-5xl font-black">$19</span><span className="text-muted-foreground">/mo</span></div>
                    <ul className="space-y-3 mb-8 flex-1">
                      <li className="flex items-start gap-3 text-sm"><CheckIcon /><span>Unlimited roast credits</span></li>
                      <li className="flex items-start gap-3 text-sm"><CheckIcon /><span>Priority AI processing</span></li>
                      <li className="flex items-start gap-3 text-sm"><CheckIcon /><span>Deep-dive competitor roasting</span></li>
                      <li className="flex items-start gap-3 text-sm"><CheckIcon /><span>Team report sharing</span></li>
                      <li className="flex items-start gap-3 text-sm"><CheckIcon /><span>Roast history & favorites</span></li>
                    </ul>
                    <Link href="/sign-up">
                      <Button className="w-full h-12 text-base rounded-2xl shadow-[0_0_20px_rgba(255,87,34,0.3)]">Upgrade to Pro</Button>
                    </Link>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-orange-500/5 to-primary/10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />
          </div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">
                Your site has problems.<br />
                <span className="text-gradient">Find out what they are.</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-10 max-w-lg mx-auto">
                3 free roasts. No signup friction. Real, actionable feedback in seconds.
              </p>
              <Link href="/sign-up">
                <Button size="lg" className="h-14 px-10 text-lg rounded-2xl shadow-[0_0_30px_rgba(255,87,34,0.4)] hover:shadow-[0_0_50px_rgba(255,87,34,0.6)] transition-shadow">
                  Roast My Site Now <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-10 bg-card/40">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2.5">
            <Flame className="w-4 h-4 text-primary" />
            <span className="font-black">Brostique</span>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Brostique. Made with fire and zero filter.</p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link href="/sign-in" className="hover:text-foreground transition-colors">Sign in</Link>
            <Link href="/sign-up" className="hover:text-foreground transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
