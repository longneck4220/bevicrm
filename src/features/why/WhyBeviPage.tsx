import { PrimaryButton } from "@/features/shared/MarketingButtons";
import { FigureSignal, FigureMove, FigureMemory } from "@/features/shared/Figures";

const tools = [
  { name: "Salesforce", role: "stores the account" },
  { name: "Otter", role: "captures the words" },
  { name: "Rhino CRM", role: "tracks the pipeline" },
  { name: "Teams", role: "passes the message" },
  { name: "Power BI", role: "reports the past" },
];

const traits = [
  {
    title: "Trade-native",
    body: "Understands pricing support, ROS, range gaps and venue logic out of the box.",
  },
  {
    title: "90-second workflow",
    body: "Fits between the car door closing and the engine starting.",
  },
  {
    title: "Memory that compounds",
    body: "Every note makes the next visit sharper.",
  },
];

const traitFigures = [<FigureSignal key="a" />, <FigureMove key="b" />, <FigureMemory key="c" />];

export function WhyBeviPage() {
  return (
    <main id="main">
      <section className="section-y">
        <div className="shell">
          <p className="eyebrow">Why BEVI</p>
          <h1 className="mt-5 max-w-3xl text-4xl tracking-[-0.02em] text-foreground md:text-h2">
            Interpretation, not transcription.
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-muted-foreground">
            The tools you run are good at what they do. None of them decide what happens next.
          </p>
        </div>
      </section>

      <section className="section-y border-t border-hairline">
        <div className="shell max-w-5xl">
          <p className="font-display text-3xl leading-[1.15] tracking-[-0.02em] text-muted-foreground sm:text-4xl md:text-[56px]">
            A CRM stores the account.
          </p>
          <p className="mt-4 font-display text-3xl leading-[1.15] tracking-[-0.02em] text-muted-foreground sm:text-4xl md:text-[56px]">
            A transcriber captures the words.
          </p>
          <p className="mt-4 flex items-start gap-4 font-display text-3xl leading-[1.15] tracking-[-0.02em] text-foreground sm:text-4xl md:text-[56px]">
            <span className="mt-4 h-2.5 w-2.5 shrink-0 rounded-full bg-primary md:mt-7 md:h-3 md:w-3" />
            <span>BEVI interprets the next move.</span>
          </p>
        </div>
      </section>

      <section className="section-y border-t border-hairline">
        <div className="shell">
          <p className="eyebrow">The stack</p>
          <h2 className="mt-4 max-w-2xl text-3xl tracking-[-0.02em] text-foreground md:text-h2">
            One layer above everything you already run.
          </h2>

          <div className="mt-12">
            <div className="rounded-xl border border-primary/60 bg-surface p-6 md:p-8">
              <p className="font-mono text-[13px] uppercase tracking-[0.06em] text-primary">
                BEVI — Post-Visit Intelligence
              </p>
              <p className="mt-3 font-display text-xl leading-snug tracking-[-0.01em] text-foreground md:text-h3">
                Decides the next move.
              </p>
            </div>

            <div aria-hidden className="mx-auto h-10 w-px bg-hairline" />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {tools.map((tool) => (
                <div key={tool.name} className="rounded-xl border border-hairline bg-surface p-5">
                  <p className="text-[15px] text-muted-foreground">{tool.name}</p>
                  <p className="mt-2 font-mono text-[12px] uppercase tracking-[0.06em] text-muted-foreground/70">
                    {tool.role}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-10 max-w-2xl text-[17px] leading-relaxed text-muted-foreground">
            BEVI is not another system to log into. It's the layer that decides what your existing
            stack should do next.
          </p>
        </div>
      </section>

      <section className="section-y border-t border-hairline">
        <div className="shell">
          <p className="eyebrow">For the field</p>
          <h2 className="mt-4 max-w-2xl text-3xl tracking-[-0.02em] text-foreground md:text-h2">
            Built for the venue call, not the sales-theory seminar.
          </h2>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {traits.map((trait, i) => (
              <article
                key={trait.title}
                className="fig-host edge-lit rounded-xl border border-hairline bg-surface p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 md:p-8"
              >
                <div className="py-2">{traitFigures[i]}</div>
                <h3 className="mt-6 text-h3 text-foreground">{trait.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                  {trait.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-y border-t border-hairline">
        <div className="shell max-w-3xl">
          <h2 className="text-3xl leading-tight tracking-[-0.02em] text-foreground md:text-h2">
            See it interpret your own note.
          </h2>
          <div className="mt-9">
            <PrimaryButton to="/try">Try a visit note →</PrimaryButton>
          </div>
        </div>
      </section>
    </main>
  );
}
