import { Link } from "@tanstack/react-router";
import { GlassCard, SignalLabel } from "@/features/shared/primitives";
import { BeviMark } from "@/features/shared/BeviMark";
import { ParticleField } from "@/features/shared/ParticleField";

const workflow = [
  {
    label: "Capture",
    title: "Capture the visit",
    body: "Dictate or paste the rough field note: buyer comments, objections, product interest, order signals and follow-up promises.",
    tone: "var(--brand-cyan)",
  },
  {
    label: "Reconstruct",
    title: "Reconstruct the sales record",
    body: "BEVI turns the mess into a CRM-ready note, commercial signals, missed opportunity and a practical next best move.",
    tone: "var(--brand-blue)",
  },
  {
    label: "Carry forward",
    title: "Carry the account forward",
    body: "Account memory is updated as a running profile, so the next visit starts with buyer cues, risks and open actions already in view.",
    tone: "var(--brand-violet)",
  },
];

const beviOutputs = [
  "CRM-ready note with labelled sales detail",
  "Next best move with specific ask",
  "Short follow-up email draft",
  "Updated account memory for the next visit",
];

const pricingPlans = [
  {
    name: "Free",
    price: "A$0",
    detail: "No saved memory",
    body: "Enter a visit, generate the output, then the call is forgotten. Useful for testing the workflow without building account history.",
    cta: "Try a Visit Note",
  },
  {
    name: "Founding 50",
    price: "A$31.33",
    detail: "/ user / month",
    body: "Discounted early-user plan for the first 50 reps. Includes saved account memory, CRM-ready notes, follow-up drafts and next-move intelligence.",
    badge: "Early access",
    cta: "Start pilot",
  },
  {
    name: "Enterprise base",
    price: "A$750",
    detail: "/ month",
    body: "Base team layer for up to 20 seats, with workflow setup, feedback-led improvements and use-case tailoring for the sales team.",
    badge: "20 seats",
    cta: "Discuss team pilot",
  },
];

export function HowItWorksPage() {
  return (
    <main className="relative pt-28 pb-24 min-h-screen">
      <ParticleField count={28} />
      <div className="absolute inset-0 grid-overlay pointer-events-none" aria-hidden />

      <div className="relative mx-auto max-w-6xl px-6">
        <section className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-cyan)] animate-pulse" />
              <SignalLabel>Post-visit intelligence</SignalLabel>
            </div>
            <h1 className="text-5xl md:text-7xl leading-[0.98] font-semibold text-white">
              How BEVI <span className="text-gradient">works.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              BEVI turns messy field visit notes into CRM-ready records, follow-up, account memory and the next best commercial move.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/trial"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-medium text-primary-foreground ambient-glow"
                style={{ background: "var(--gradient-signal)" }}
              >
                Try a Visit Note <span>-&gt;</span>
              </Link>
              <a
                href="#example"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm glass hover:bg-white/5 transition-colors"
              >
                See example output
              </a>
            </div>
          </div>

          <GlassCard tone="strong" className="p-7">
            <div className="flex items-center gap-4 mb-6">
              <BeviMark size={54} />
              <div>
                <SignalLabel>Reason for being</SignalLabel>
                <div className="text-white text-xl font-semibold mt-1">The gap after the visit</div>
              </div>
            </div>
            <p className="text-white/80 leading-relaxed">
              Reps do not lose deals because they forget the meeting. They lose momentum in the gap after it.
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              BEVI turns what just happened into what should happen next, before buyer cues, pricing tension and follow-up promises go cold.
            </p>
          </GlassCard>
        </section>

        <section className="mt-16">
          <SignalLabel as="h2">Workflow</SignalLabel>
          <div className="mt-4 grid md:grid-cols-3 gap-4">
            {workflow.map((item) => (
              <GlassCard key={item.title} className="p-6">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-8"
                  style={{
                    border: `1px solid ${item.tone}`,
                    background: `color-mix(in oklab, ${item.tone} 12%, transparent)`,
                  }}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.tone, boxShadow: `0 0 14px ${item.tone}` }} />
                </div>
                <SignalLabel as="h3">{item.label}</SignalLabel>
                <h3 className="mt-4 text-2xl font-semibold text-white">{item.title}</h3>
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{item.body}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        <section id="example" className="mt-16">
          <div className="max-w-2xl">
            <SignalLabel as="h2">Before and after</SignalLabel>
            <h2 className="mt-3 text-3xl md:text-4xl font-semibold text-white">From road-note mess to usable sales action.</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              The rep can capture a rough note on mobile, then review the cleaner CRM note, next move and account memory on a tablet or desktop before follow-up.
            </p>
          </div>

          <GlassCard tone="strong" className="mt-8 overflow-hidden p-5 md:p-7">
            <div className="grid lg:grid-cols-[0.72fr_1.28fr] gap-6 items-center">
              <div className="mx-auto w-full max-w-[285px] rounded-[2.1rem] border border-white/15 bg-[#050917] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
                <div className="rounded-[1.55rem] border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-4 min-h-[520px]">
                  <div className="flex items-center justify-between text-[10px] text-white/45">
                    <span>9:41</span>
                    <span>BEVI</span>
                  </div>
                  <div className="mt-7 flex items-center justify-between">
                    <SignalLabel>Mobile capture</SignalLabel>
                    <span className="rounded-full bg-[var(--brand-cyan)]/20 px-2 py-1 text-[10px] text-[var(--brand-cyan)]">Draft</span>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-white">Raw visit note</h3>
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                    <p className="text-sm leading-relaxed text-white/78">
                      Met Aaron. Happy with Byron. Cinzano deal lapsed. Wants Italian stuff. Did not want Mount Gay. Need follow-up maybe training.
                    </p>
                  </div>
                  <div className="mt-5 space-y-2 text-xs text-muted-foreground">
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">Buyer cue: likes Italian menu direction</div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">Risk: lapsed Cinzano agreement</div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">Follow-up: training may help</div>
                  </div>
                  <div className="mt-7 h-11 rounded-xl text-sm font-medium text-primary-foreground grid place-items-center" style={{ background: "var(--gradient-signal)" }}>
                    Generate intelligence
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-white/12 bg-[#07111f] p-3 shadow-[0_24px_90px_rgba(0,0,0,0.35)]">
                <div className="rounded-[1.25rem] border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.035] to-white/[0.02] p-5 md:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <SignalLabel>Tablet review</SignalLabel>
                      <h3 className="mt-2 text-2xl font-semibold text-white">BEVI output</h3>
                    </div>
                    <div className="flex gap-2 text-[10px] uppercase tracking-[0.16em] text-white/55">
                      <span className="rounded-full border border-[var(--brand-cyan)]/35 px-3 py-1 text-[var(--brand-cyan)]">CRM</span>
                      <span className="rounded-full border border-[var(--brand-violet)]/35 px-3 py-1 text-[var(--brand-violet)]">Next move</span>
                    </div>
                  </div>

                  <div className="mt-6 grid md:grid-cols-[1.1fr_0.9fr] gap-4">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <SignalLabel as="h4">CRM-ready note</SignalLabel>
                      <p className="mt-3 text-sm leading-relaxed text-white/82">
                        Aaron is positive on Byron and interested in Italian-led menu items. Cinzano support has lapsed and should be resolved before the next order window. Mount Gay was rejected for this call. Training may help convert Italian cocktail interest into a practical menu activation.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {beviOutputs.map((output) => (
                        <div key={output} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3">
                          <span className="mt-1.5 w-2 h-2 rounded-full bg-[var(--brand-cyan)] shadow-[0_0_12px_var(--brand-cyan)] shrink-0" />
                          <span className="text-sm text-white/85 leading-relaxed">{output}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 grid md:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <SignalLabel as="h4">Next best move</SignalLabel>
                      <p className="mt-3 text-sm text-white/80 leading-relaxed">
                        Reconfirm Cinzano support, then offer a short Italian cocktail training session tied to Aaron's menu direction.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <SignalLabel as="h4">Memory carried forward</SignalLabel>
                      <p className="mt-3 text-sm text-white/80 leading-relaxed">
                        Aaron likes practical menu ideas, rejects poor-fit rum pushes, and responds to clear support on Italian category opportunities.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </section>

        <section className="mt-16">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <SignalLabel as="h2">Pilot pricing</SignalLabel>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold text-white">Start simple, then carry memory forward.</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Pricing should match the maturity of the user. A free run proves the output. Paid plans unlock remembered account intelligence and team rollout.
              </p>
            </div>
            <Link
              to="/trial"
              className="inline-flex w-fit items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-medium text-primary-foreground ambient-glow"
              style={{ background: "var(--gradient-signal)" }}
            >
              Try a Visit Note <span>-&gt;</span>
            </Link>
          </div>

          <div className="mt-8 grid lg:grid-cols-3 gap-5">
            {pricingPlans.map((plan) => (
              <GlassCard key={plan.name} tone={plan.name === "Founding 50" ? "strong" : "default"} className="p-6 flex flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-white font-semibold">{plan.name}</div>
                    <div className="mt-3 text-4xl font-semibold text-white">
                      {plan.price}<span className="text-sm text-muted-foreground font-normal"> {plan.detail}</span>
                    </div>
                  </div>
                  {plan.badge && (
                    <span className="rounded-full border border-[var(--brand-cyan)]/35 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-[var(--brand-cyan)]">
                      {plan.badge}
                    </span>
                  )}
                </div>
                <p className="mt-5 text-sm text-muted-foreground leading-relaxed flex-1">{plan.body}</p>
                <Link to="/trial" className="mt-6 inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white hover:bg-white/[0.08] transition-colors">
                  {plan.cta}
                </Link>
              </GlassCard>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <GlassCard tone="strong" className="p-8">
            <SignalLabel as="h2">Not another meeting recorder</SignalLabel>
            <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight text-white">
              BEVI sits after the field visit, where sales value is either captured or lost.
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              Transcription tools capture what was said. CRMs store what happened. BEVI helps the rep decide what matters next: the formal note, the follow-up, the account memory and the next move.
            </p>
            <Link
              to="/trial"
              className="mt-8 inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-medium text-primary-foreground ambient-glow"
              style={{ background: "var(--gradient-signal)" }}
            >
              Try a Visit Note <span>-&gt;</span>
            </Link>
          </GlassCard>
        </section>
      </div>
    </main>
  );
}
