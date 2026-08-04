import { useState, type ReactNode } from "react";
import { PrimaryButton } from "@/features/shared/MarketingButtons";
import { copyToClipboard } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

function Label({ children }: { children: string }) {
  return (
    <p className="font-mono text-[13px] uppercase tracking-[0.06em] text-muted-foreground">
      {children}
    </p>
  );
}

function Artifact({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-hairline bg-surface p-6 md:p-8">{children}</div>;
}

const SAMPLE_EMAIL = `Subject: Summer promo + pricing support

Hi Aaron — good to see you're happy to run with the Summer promotional material. I'm reinstating the pricing support and will send the staff training agenda ahead of next month.

Happy to bring a premium range option to that session if it's useful.`;

function CopyButton({ text, label }: { text: string; label: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  return (
    <button
      type="button"
      onClick={async () => {
        const ok = await copyToClipboard(text);
        setStatus(ok ? "copied" : "failed");
        setTimeout(() => setStatus("idle"), 2000);
      }}
      className="mt-6 inline-flex min-h-[44px] items-center rounded-lg border border-hairline px-4 text-sm text-foreground transition-colors hover:bg-surface-2"
    >
      {status === "copied"
        ? "Copied ✓"
        : status === "failed"
          ? "Couldn't copy — select manually"
          : label}
    </button>
  );
}

function Zig({
  index,
  label,
  headline,
  body,
  artifact,
}: {
  index: number;
  label: string;
  headline: string;
  body: string;
  artifact: ReactNode;
}) {
  const flip = index % 2 === 1;
  return (
    <section className="section-y border-t border-hairline">
      <div className="shell grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className={`min-w-0 ${flip ? "lg:order-2" : ""}`}>
          <Label>{label}</Label>
          <h2 className="mt-4 text-3xl leading-tight tracking-[-0.02em] text-foreground md:text-[40px]">
            {headline}
          </h2>
          <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-muted-foreground">{body}</p>
        </div>
        <div className={`min-w-0 ${flip ? "lg:order-1" : ""}`}>{artifact}</div>
      </div>
    </section>
  );
}

const crmRows: [string, string][] = [
  ["Account", "Aaron — Northside Cellars"],
  ["Outcome", "Happy to run Summer promotional material"],
  ["Risk", "Pricing support lapsed — needs reviewing"],
  ["Next step", "Training confirmed for next month"],
];

const memoryRows: [string, string][] = [
  ["Buying style", "Practical, menu-led"],
  ["Open promise", "Staff training — next month"],
  ["Watch", "Support must be explicit at renewal"],
];

const signals = [
  { label: "Margin pressure ↑", sentiment: "bad" as const },
  { label: "Relationship strong", sentiment: "good" as const },
  { label: "Renewal risk", sentiment: "bad" as const },
];

export function ProductPage() {
  return (
    <main id="main">
      <section className="section-y">
        <div className="shell">
          <p className="eyebrow">Product</p>
          <h1 className="mt-5 max-w-3xl text-4xl tracking-[-0.02em] text-foreground md:text-h2">
            Five outputs from one rough note.
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-muted-foreground">
            Everything BEVI returns is a decision, not a document.
          </p>
          <div className="mt-10 rounded-xl border border-hairline bg-surface p-6">
            <Label>The note</Label>
            <p className="mt-4 text-[17px] leading-relaxed text-muted-foreground">
              “Met with Aaron, he is happy to run with the Summer promotional material. He mentioned
              pricing support lapsed needs reviewing. Wants help with staff performance. Training
              booked next month.”
            </p>
          </div>
        </div>
      </section>

      <Zig
        index={0}
        label="Next Best Move"
        headline="The one action that moves the account."
        body="No task list. One prioritised move, timed, with the reason it works on this account right now."
        artifact={
          <Artifact>
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
            <ul className="mt-6 space-y-2 text-[15px] leading-relaxed text-muted-foreground">
              <li className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                Lead with the Summer promotional material — it's his proof point.
              </li>
              <li className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                Bring the premium range into the training conversation.
              </li>
            </ul>
          </Artifact>
        }
      />

      <Zig
        index={1}
        label="CRM Note"
        headline="CRM-ready, not CRM-homework."
        body="Structured the way your CRM expects it — account, outcome, risk, next step — ready to paste before you pull out of the car park."
        artifact={
          <Artifact>
            <Label>CRM Note</Label>
            <dl className="mt-5 space-y-3 text-sm">
              {crmRows.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[92px_minmax(0,1fr)] gap-3">
                  <dt className="font-mono text-[12px] uppercase tracking-[0.06em] text-muted-foreground">
                    {k}
                  </dt>
                  <dd className="text-muted-foreground">{v}</dd>
                </div>
              ))}
            </dl>
            <CopyButton
              label="Copy to CRM"
              text={crmRows.map(([k, v]) => `${k}: ${v}`).join("\n")}
            />
          </Artifact>
        }
      />

      <Zig
        index={2}
        label="Follow-Up Email"
        headline="Sent from the car park, not next Tuesday."
        body="A short, specific email in your voice that references what was actually said — not a template with the venue name swapped in."
        artifact={
          <Artifact>
            <Label>Follow-Up Email</Label>
            <div className="mt-5 rounded-lg border border-hairline bg-surface-2 p-4">
              <p className="text-sm text-foreground">Subject: Summer promo + pricing support</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Hi Aaron — good to see you're happy to run with the Summer promotional material. I'm
                reinstating the pricing support and will send the staff training agenda ahead of
                next month.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Happy to bring a premium range option to that session if it's useful.
              </p>
            </div>
            <CopyButton label="Copy email" text={SAMPLE_EMAIL} />
          </Artifact>
        }
      />

      <Zig
        index={3}
        label="Missed Opportunity"
        headline="The range gap you'd have forgotten."
        body="BEVI flags what wasn't discussed but should have been — the commercial gap sitting inside the conversation you just had."
        artifact={
          <Artifact>
            <Label>Missed Opportunity</Label>
            <p className="mt-5 font-display text-xl leading-snug text-foreground md:text-h3">
              Premium spirits gap
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              Cocktail list upgraded, no premium range discussed.
            </p>
            <p className="mt-6 border-t border-hairline pt-5 text-[15px] leading-relaxed text-muted-foreground">
              Raise at the training session — the new list is the natural opening.
            </p>
          </Artifact>
        }
      />

      <Zig
        index={4}
        label="Account Signals"
        headline="Account memory that compounds."
        body="Each visit updates a running profile — buying style, pressure points, open promises — so the next call starts where the last one ended."
        artifact={
          <Artifact>
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
            <dl className="mt-6 space-y-3 border-t border-hairline pt-5 text-sm">
              {memoryRows.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[110px_minmax(0,1fr)] gap-3">
                  <dt className="font-mono text-[12px] uppercase tracking-[0.06em] text-muted-foreground">
                    {k}
                  </dt>
                  <dd className="text-muted-foreground">{v}</dd>
                </div>
              ))}
            </dl>
          </Artifact>
        }
      />

      <section className="section-y border-t border-hairline">
        <div className="shell max-w-3xl">
          <h2 className="text-3xl leading-tight tracking-[-0.02em] text-foreground md:text-h2">
            One note in. Five decisions out.
          </h2>
          <div className="mt-9">
            <PrimaryButton to="/try">Try a visit note →</PrimaryButton>
          </div>
        </div>
      </section>
    </main>
  );
}
