import { HeroReconstruction } from "./HeroReconstruction";
import { OutputsBento } from "./OutputsBento";
import { Reveal } from "@/features/shared/Reveal";
import { PrimaryButton, SecondaryButton } from "@/features/shared/MarketingButtons";
import { FigureCapture, FigureSignal, FigureMove } from "@/features/shared/Figures";

const figures = [<FigureCapture key="c" />, <FigureSignal key="s" />, <FigureMove key="m" />];

const loop = [
  {
    step: "Capture",
    body: "Dictate the rough note from the car park. Buyer cues, pricing tension, promises — before they go cold.",
  },
  {
    step: "Signal",
    body: "BEVI reads intent, objections, margin pressure, missed opportunity and account risk.",
  },
  {
    step: "Move",
    body: "Get 5 outputs in under 90 seconds: Next Best Move, CRM Note, Follow-Up Email, Missed Opportunity, Account Signals.",
  },
];

const stats = ["Pilot venues", "Notes processed", "Same-day follow-ups"];

export function LandingPage() {
  return (
    <main id="main">
      <section className="hero-veil section-y">
        <div className="shell grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-16">
          <div className="min-w-0">
            <p className="eyebrow">Post-visit intelligence</p>
            <h1 className="mt-5 text-[clamp(2.75rem,6vw,4.5rem)] leading-[1.04] tracking-[-0.02em] text-foreground">
              Win the next call.
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-muted-foreground md:text-lg">
              You don't lose the deal in the venue. You lose it in the 90 seconds after. BEVI turns
              one rough post-visit note into your next best move — CRM note, follow-up, missed
              opportunity and account signals — before the car leaves the car park.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <PrimaryButton to="/try">Try a visit note — no signup →</PrimaryButton>
              <SecondaryButton href="#how-it-works">See how it works</SecondaryButton>
            </div>
            <p className="mt-10 border-t border-hairline pt-5 font-mono text-[13px] uppercase tracking-[0.06em] text-muted-foreground">
              Sits above Salesforce · Otter · Rhino CRM · Teams · Power BI
            </p>
          </div>

          <div className="min-w-0">
            <HeroReconstruction />
          </div>
        </div>
      </section>

      <section id="why" className="section-y border-t border-hairline">
        <Reveal className="shell max-w-4xl">
          <p className="font-display text-2xl leading-snug tracking-[-0.01em] text-muted-foreground md:text-h3">
            A CRM stores the account.
          </p>
          <p className="mt-3 font-display text-2xl leading-snug tracking-[-0.01em] text-muted-foreground md:text-h3">
            A transcriber captures the words.
          </p>
          <p className="mt-3 flex items-start gap-3 font-display text-2xl leading-snug tracking-[-0.01em] text-foreground md:text-h3">
            <span className="signal-dot mt-3 shrink-0 md:mt-4" />
            BEVI interprets the next move.
          </p>
        </Reveal>
      </section>

      <OutputsBento />

      <section id="how-it-works" className="section-y border-t border-hairline">
        <div className="shell">
          <p className="eyebrow">The loop</p>
          <h2 className="mt-4 max-w-2xl text-3xl tracking-[-0.02em] text-foreground md:text-h2">
            Capture → Signal → Move.
          </h2>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {loop.map((item, i) => (
              <Reveal
                as="article"
                key={item.step}
                delay={i * 60}
                className="panel fig-host edge-lit"
              >
                <p className="flex items-center gap-2 font-mono text-[13px] uppercase tracking-[0.06em] text-muted-foreground">
                  <span className="signal-dot" />0{i + 1}
                </p>
                <div className="mt-6 py-2">{figures[i]}</div>
                <h3 className="mt-6 text-h3 text-foreground">{item.step}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-y border-t border-hairline">
        <div className="shell">
          <p className="eyebrow">For the field</p>
          <h2 className="mt-4 max-w-3xl text-3xl tracking-[-0.02em] text-foreground md:text-h2">
            Built for the venue call, not the sales-theory seminar.
          </h2>
          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-muted-foreground">
            BEVI speaks bottleshop and on-premise: pricing support, ROS, range activation, tap
            contracts, staff training. No generic sales fluff.
          </p>

          <div className="mt-12 grid gap-4 border-t border-hairline pt-8 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat}>
                <p className="font-display text-4xl tabular-nums tracking-[-0.02em] text-muted-foreground/60">
                  —
                </p>
                <p className="mt-3 font-mono text-[13px] uppercase tracking-[0.06em] text-muted-foreground">
                  {stat}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[13px] text-muted-foreground/70">
            Figures land as pilot programmes complete.
          </p>
        </div>
      </section>

      <section className="section-y border-t border-hairline">
        <div className="shell max-w-3xl">
          <h2 className="text-3xl leading-tight tracking-[-0.02em] text-foreground md:text-h2">
            Sales isn't lost in the meeting. It's lost in what happens next.
          </h2>
          <div className="mt-9">
            <PrimaryButton to="/try">Try a visit note →</PrimaryButton>
          </div>
        </div>
      </section>
    </main>
  );
}
