import { useState } from "react";
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

const pricingPlans = [
  {
    name: "Free Test Run",
    price: "A$0",
    annualPrice: "A$0",
    detail: "No card required",
    annualDetail: "No saved memory",
    body: "Try BEVI on a real visit note. Generate the output, copy what you need, then the call is forgotten.",
    cta: "Try a Visit Note",
  },
  {
    name: "Founding 50",
    price: "A$32",
    annualPrice: "A$320",
    detail: "/ user / month",
    annualDetail: "/ user / year",
    body: "Early-user pricing for the first 50 reps. Includes saved account memory, CRM-ready notes, follow-up drafts and next-move intelligence.",
    badge: "Early access",
    cta: "Start pilot",
  },
  {
    name: "Field Pro",
    price: "A$44",
    annualPrice: "A$440",
    detail: "/ user / month",
    annualDetail: "/ user / year",
    body: "For reps using BEVI regularly to keep account memory live, tighten follow-up and prepare the next call faster.",
    badge: "MONTH FREE",
    cta: "Start memory trial",
  },
  {
    name: "Team Pilot",
    price: "A$750",
    annualPrice: "A$7,500",
    detail: "/ month",
    annualDetail: "/ year",
    body: "For up to 20 seats, with workflow setup, feedback-led improvements and use-case tailoring for the sales team.",
    badge: "20 seats",
    cta: "Discuss team pilot",
  },
];

const phoneSteps = [
  {
    label: "Capture",
    title: "Enter the messy visit",
    status: "Live note",
    tone: "var(--brand-cyan)",
    main: "Aaron happy with using Byron. Pricing support has lapsed. Wants assistance with staff performance. Follow up training booked for next month.",
    rows: ["Buyer cue: Needs Staff direction", "Risk: lapsed pricing support", "Follow-up: training may help"],
    button: "Generate intelligence",
  },
  {
    label: "Extract",
    title: "BEVI finds the signals",
    status: "Processing",
    tone: "var(--brand-blue)",
    main: "Commercial signals extracted from the note and account context.",
    rows: ["Buying style: practical menu-led", "Margin pressure: support must be clear", "Missed opportunity: Italian activation"],
    button: "Build output",
  },
  {
    label: "Act",
    title: "Copy the next move",
    status: "Ready",
    tone: "var(--brand-violet)",
    main: "CRM note rebuilt. Follow-up email drafted. Account memory updated for the next visit.",
    rows: ["Next move: reconfirm price support", "Email: short, friendly, specific", "Memory: Aaron prefers practical fit"],
    button: "Copy CRM note",
  },
];

export function HowItWorksPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

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
              The rep captures the rough note on mobile, BEVI extracts the commercial signals, then the phone view rolls into CRM copy, follow-up and memory.
            </p>
          </div>

          <GlassCard tone="strong" className="mt-8 overflow-hidden p-5 md:p-7">
            <div className="relative rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-500/10 via-white/[0.025] to-violet-500/10 px-3 py-8 md:px-7">
              <div className="absolute inset-x-10 top-1/2 hidden h-px bg-gradient-to-r from-transparent via-[var(--brand-cyan)]/40 to-transparent lg:block" aria-hidden />
              <div className="relative grid gap-5 md:grid-cols-3 md:items-center">
                {phoneSteps.map((step, index) => (
                  <div
                    key={step.title}
                    className={`mx-auto w-full max-w-[285px] rounded-[2.1rem] border border-white/15 bg-[#050917] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.45)] ${
                      index === 1 ? "md:-mt-8" : "md:mt-8"
                    }`}
                  >
                    <div className="min-h-[500px] overflow-hidden rounded-[1.55rem] border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-4">
                      <div className="flex items-center justify-between text-[10px] text-white/45">
                        <span>9:41</span>
                        <span className="h-4 w-16 rounded-full bg-black/70" />
                        <span>5G</span>
                      </div>
                      <div className="mt-6 flex items-center justify-between">
                        <SignalLabel>{step.label}</SignalLabel>
                        <span className="rounded-full px-2 py-1 text-[10px]" style={{ background: `color-mix(in oklab, ${step.tone} 18%, transparent)`, color: step.tone }}>
                          {step.status}
                        </span>
                      </div>
                      <h3 className="mt-4 text-xl font-semibold text-white">{step.title}</h3>
                      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full" style={{ width: `${38 + index * 28}%`, background: step.tone, boxShadow: `0 0 18px ${step.tone}` }} />
                      </div>
                      <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4">
                        <p className="text-sm leading-relaxed text-white/80">{step.main}</p>
                      </div>
                      <div className="mt-5 max-h-[152px] space-y-2 overflow-hidden">
                        <div className={index === 1 ? "animate-pulse space-y-2" : "space-y-2"}>
                          {step.rows.map((row) => (
                            <div key={row} className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-muted-foreground">
                              {row}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-6 h-11 rounded-xl text-sm font-medium text-primary-foreground grid place-items-center" style={{ background: index === 1 ? "rgba(255,255,255,0.08)" : "var(--gradient-signal)", border: index === 1 ? `1px solid ${step.tone}` : undefined }}>
                        {step.button}
                      </div>
                    </div>
                  </div>
                ))}
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
                Try the output first. Start a memory trial when you want BEVI to remember accounts, shape follow-up and carry the next call forward.
              </p>
            </div>
            <div className="flex w-fit rounded-2xl border border-white/10 bg-white/[0.035] p-1">
              {(["monthly", "annual"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setBilling(option)}
                  className={`rounded-xl px-4 py-2 text-sm transition-colors ${billing === option ? "text-white" : "text-muted-foreground hover:text-white"}`}
                  style={billing === option ? { background: "var(--gradient-signal)" } : undefined}
                >
                  {option === "monthly" ? "Monthly" : "Annual"}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            Annual billing shows the discounted rate, roughly two months free on paid plans.
          </div>

          <div className="mt-8 grid lg:grid-cols-4 gap-5">
            {pricingPlans.map((plan) => (
              <GlassCard
                key={plan.name}
                tone={plan.name === "Founding 50" ? "strong" : "default"}
                className="p-6 flex flex-col relative bg-black/55"
                style={{
                  boxShadow:
                    "0 30px 80px -20px rgba(0,0,0,0.85), 0 12px 40px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,0,0,0.4)",
                }}
              >

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-white font-semibold">{plan.name}</div>
                    <div className="mt-3 text-4xl font-semibold text-white">
                      {billing === "annual" ? plan.annualPrice : plan.price}
                      <span className="text-sm text-muted-foreground font-normal"> {billing === "annual" ? plan.annualDetail : plan.detail}</span>
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
            <SignalLabel as="h2">BETWEEN VISIT INTELLIGENCE</SignalLabel>
            <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight text-white">
              BEVI sits after the field visit, where sales value is either captured or lost.
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              Transcription tools capture what was said. CRMs store what happened. BEVI helps the rep decide what matters next: the formal note, the follow-up, the account memory and the best next move.
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
