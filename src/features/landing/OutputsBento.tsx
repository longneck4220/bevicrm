import { cn } from "@/lib/utils";

const cellBase =
  "edge-lit rounded-xl border border-hairline bg-surface p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40";

function Label({ children }: { children: string }) {
  return (
    <p className="font-mono text-[13px] uppercase tracking-[0.06em] text-muted-foreground">
      {children}
    </p>
  );
}

const crmRows: [string, string][] = [
  ["Account", "Aaron — Northside Cellars"],
  ["Outcome", "Happy to run Summer promotional material"],
  ["Risk", "Pricing support lapsed — needs reviewing"],
  ["Next step", "Training confirmed for next month"],
];

const signals = [
  { label: "Margin pressure ↑", sentiment: "bad" as const },
  { label: "Relationship strong", sentiment: "good" as const },
  { label: "Renewal risk", sentiment: "bad" as const },
];

export function OutputsBento() {
  return (
    <section id="outputs" className="section-y border-t border-hairline">
      <div className="shell">
        <p className="eyebrow">The outputs</p>
        <h2 className="mt-4 max-w-2xl text-3xl tracking-[-0.02em] text-foreground md:text-h2">
          One note in. Five decisions out.
        </h2>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <article className={`${cellBase} md:col-span-2 md:p-8`}>
            <div className="flex flex-wrap items-center gap-3">
              <Label>Next Best Move</Label>
              <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-[12px] uppercase tracking-[0.06em] text-primary">
                Do this Thursday
              </span>
            </div>
            <p className="mt-5 font-display text-xl leading-snug tracking-[-0.01em] text-foreground md:text-h3">
              Call Aaron with a reinstated pricing support proposal and lock the staff-performance
              training date.
            </p>
            <ul className="mt-6 grid gap-2 text-[15px] leading-relaxed text-muted-foreground sm:grid-cols-2">
              <li className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                Lead with the Summer promotional material — it's his proof point.
              </li>
              <li className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                Bring the premium range into the training conversation.
              </li>
            </ul>
          </article>

          <article className={cellBase}>
            <Label>CRM Note</Label>
            <dl className="mt-5 space-y-3 text-sm">
              {crmRows.map(([k, v], i) => (
                <div key={k} className="grid grid-cols-[92px_minmax(0,1fr)] gap-3">
                  <dt className="font-mono text-[12px] uppercase tracking-[0.06em] text-muted-foreground">
                    {k}
                  </dt>
                  <dd className={i === 0 ? "text-foreground" : "text-muted-foreground"}>{v}</dd>
                </div>
              ))}
            </dl>
          </article>

          <article className={cellBase}>
            <Label>Follow-Up Email</Label>
            <div className="mt-5 rounded-lg border border-hairline bg-surface-2 p-4">
              <p className="text-sm text-foreground">Subject: Summer promo + pricing support</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Hi Aaron — good to see you're happy to run with the Summer promotional material. I'm
                reinstating the pricing support and will send the staff training agenda ahead of
                next month.
              </p>
            </div>
          </article>

          <article className={cellBase}>
            <Label>Missed Opportunity</Label>
            <p className="mt-5 font-display text-lg leading-snug text-foreground">
              Premium spirits gap
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              Cocktail list upgraded, no premium range discussed.
            </p>
          </article>

          <article className={cellBase}>
            <Label>Account Signals</Label>
            <ul className="mt-5 flex flex-wrap gap-2">
              {signals.map((s) => (
                <li
                  key={s.label}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[13px]",
                    s.sentiment === "good" && "border-primary/30 bg-primary/10 text-primary",
                    s.sentiment === "bad" &&
                      "border-destructive/30 bg-destructive/10 text-destructive",
                  )}
                >
                  {s.label}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
              Support terms are the deciding factor at renewal.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
