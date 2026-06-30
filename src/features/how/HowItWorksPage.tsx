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

        <section id="example" className="mt-16 grid lg:grid-cols-2 gap-5 items-stretch">
          <GlassCard className="p-6">
            <SignalLabel as="h2">Raw field note</SignalLabel>
            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-white/75 leading-relaxed">
                Met Aaron. Happy with Byron. Cinzano deal lapsed. Wants Italian stuff. Did not want Mount Gay. Need follow-up maybe training.
              </p>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              The note is useful, but it is not yet manager-readable, CRM-ready or ready for the next call.
            </p>
          </GlassCard>

          <GlassCard tone="strong" className="p-6">
            <SignalLabel as="h2">BEVI output</SignalLabel>
            <div className="mt-5 space-y-3">
              {beviOutputs.map((output) => (
                <div key={output} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3">
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-[var(--brand-cyan)] shadow-[0_0_12px_var(--brand-cyan)] shrink-0" />
                  <span className="text-sm text-white/85 leading-relaxed">{output}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              BEVI reconstructs the visit into a usable sales record and a next action the rep can actually take.
            </p>
          </GlassCard>
        </section>

        <section className="mt-16 grid lg:grid-cols-[0.9fr_1.1fr] gap-5 items-start">
          <GlassCard className="p-6">
            <SignalLabel as="h2">Pilot pricing</SignalLabel>
            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <div className="text-white font-semibold">Field Pilot</div>
                <div className="mt-2 text-3xl font-semibold text-white">A$39<span className="text-sm text-muted-foreground font-normal"> / user / month</span></div>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  For reps who need faster CRM notes, cleaner follow-up and better account memory.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <div className="text-white font-semibold">Team Pilot</div>
                <div className="mt-2 text-3xl font-semibold text-white">A$750<span className="text-sm text-muted-foreground font-normal"> / month</span></div>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Up to 20 users, core workflow and feedback-led improvements during pilot testing.
                </p>
              </div>
            </div>
          </GlassCard>

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
