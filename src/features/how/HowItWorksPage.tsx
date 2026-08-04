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
    title: "Reconstruct the record",
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

const phoneSteps = [
  {
    label: "Capture",
    title: "Enter the messy visit",
    status: "Live note",
    tone: "var(--brand-cyan)",
    main: "Aaron happy with using Byron. Pricing support has lapsed. Wants assistance with staff performance. Follow up training booked for next month.",
    rows: [
      "Buyer cue: Needs Staff direction",
      "Risk: lapsed pricing support",
      "Follow-up: training may help",
    ],
    button: "Generate intelligence",
  },
  {
    label: "Extract",
    title: "BEVI finds the signals",
    status: "Processing",
    tone: "var(--brand-blue)",
    main: "Commercial signals extracted from the note and account context.",
    rows: [
      "Buying style: practical menu-led",
      "Margin pressure: support must be clear",
      "Missed opportunity: Italian activation",
    ],
    button: "Build output",
  },
  {
    label: "Act",
    title: "Copy the next move",
    status: "Ready",
    tone: "var(--brand-violet)",
    main: "CRM note rebuilt. Follow-up email drafted. Account memory updated for the next visit.",
    rows: [
      "Next move: reconfirm price support",
      "Email: short, friendly, specific",
      "Memory: Aaron prefers practical fit",
    ],
    button: "Copy CRM note",
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
              <SignalLabel>FOR FIELD AGENTS</SignalLabel>
            </div>
            <h1 className="text-5xl md:text-7xl leading-[0.98] font-semibold text-white">
              How BEVI <span className="text-gradient">works.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              BEVI turns daily account visit notes into CRM-ready records, generates draft follow up
              and prescribes the next best commercial move.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/try"
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
                <SignalLabel>THE GAP AFTER THE VISIT</SignalLabel>
                <div className="text-white text-xl font-semibold mt-1">
                  Momentum dies between visits.
                </div>
              </div>
            </div>
            <p className="text-white/80 leading-relaxed">
              Reps do not lose deals because they forget the meeting. They lose momentum in the GAP
              between follow ups.
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              BEVI turns what just happened into what should happen next. Before pricing tension and
              follow-up promises go cold.&nbsp;
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
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: item.tone, boxShadow: `0 0 14px ${item.tone}` }}
                  />
                </div>
                <SignalLabel as="h3">{item.label}</SignalLabel>
                <h3 className="mt-4 text-2xl font-semibold text-white">{item.title}</h3>
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{item.body}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        <section id="example" className="mt-16">
          <GlassCard tone="strong" className="mt-8 overflow-hidden p-5 md:p-7">
            <div className="relative rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-500/10 via-white/[0.025] to-violet-500/10 px-3 py-8 md:px-7">
              <div
                className="absolute inset-x-10 top-1/2 hidden h-px bg-gradient-to-r from-transparent via-[var(--brand-cyan)]/40 to-transparent lg:block"
                aria-hidden
              />
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
                        <span
                          className="rounded-full px-2 py-1 text-[10px]"
                          style={{
                            background: `color-mix(in oklab, ${step.tone} 18%, transparent)`,
                            color: step.tone,
                          }}
                        >
                          {step.status}
                        </span>
                      </div>
                      <h3 className="mt-4 text-xl font-semibold text-white">{step.title}</h3>
                      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${38 + index * 28}%`,
                            background: step.tone,
                            boxShadow: `0 0 18px ${step.tone}`,
                          }}
                        />
                      </div>
                      <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4">
                        <p className="text-sm leading-relaxed text-white/80">{step.main}</p>
                      </div>
                      <div className="mt-5 max-h-[152px] space-y-2 overflow-hidden">
                        <div className={index === 1 ? "animate-pulse space-y-2" : "space-y-2"}>
                          {step.rows.map((row) => (
                            <div
                              key={row}
                              className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-muted-foreground"
                            >
                              {row}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div
                        className="mt-6 h-11 rounded-xl text-sm font-medium text-primary-foreground grid place-items-center"
                        style={{
                          background:
                            index === 1 ? "rgba(255,255,255,0.08)" : "var(--gradient-signal)",
                          border: index === 1 ? `1px solid ${step.tone}` : undefined,
                        }}
                      >
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
          <GlassCard tone="strong" className="p-8">
            <SignalLabel as="h2">DELIVERS THE NEXT MOVE</SignalLabel>
            <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight text-white">
              BEVI sits after the field visit, where sales value is either captured or lost.
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              Transcription tools capture what was said. CRMs store what happened. BEVI helps the
              rep decide what matters next: the formal note, the follow-up, the account memory and
              the best next move.
            </p>
            <Link
              to="/try"
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
