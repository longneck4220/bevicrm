import { useEffect, useState } from "react";

const outputs = [
  {
    label: "Next Best Move",
    body: "Call Aaron Thursday with a staff-performance training slot and a refreshed pricing support proposal.",
  },
  {
    label: "CRM Note",
    body: "Summer promotional material agreed. Pricing support lapsed and needs reviewing. Training booked for next month.",
  },
  {
    label: "Follow-Up Email",
    body: "Aaron — great to see you're happy to run with the Summer promotional material. Sending the reinstated pricing support and training agenda today.",
  },
  {
    label: "Missed Opportunity",
    body: "No premium spirits discussed despite venue upgrading its cocktail list.",
  },
  {
    label: "Account Signals",
    body: "Margin pressure rising · Relationship strong · Renewal risk if pricing support isn't reinstated.",
  },
];

const STEP_MS = 420;
const HOLD_MS = 4000;
const FADE_MS = 400;

export function HeroReconstruction() {
  const [visible, setVisible] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(outputs.length);
      return;
    }

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));

    const run = () => {
      if (cancelled) return;
      setFading(false);
      setVisible(0);
      outputs.forEach((_, i) => at(STEP_MS * (i + 1), () => setVisible(i + 1)));
      const done = STEP_MS * outputs.length;
      at(done + HOLD_MS, () => setFading(true));
      at(done + HOLD_MS + FADE_MS, run);
    };
    run();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  const progress = (visible / outputs.length) * 100;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
      <div className="panel">
        <p className="eyebrow">Dictated in the car park</p>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          “Met with Aaron, he is happy to run with the Summer promotional material. He mentioned
          pricing support lapsed needs reviewing. Wants help with staff performance. Training booked
          next month.”
        </p>
        <div className="mt-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="signal-dot h-1.5 w-1.5" />
            <span className="font-mono uppercase tracking-[0.06em]">Interpreting</span>
          </div>
          <div className="mt-3 h-px w-full bg-hairline">
            <div
              className="h-px bg-primary transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <ul
        className="grid gap-3 transition-opacity"
        style={{ opacity: fading ? 0 : 1, transitionDuration: `${FADE_MS}ms` }}
      >
        {outputs.map((o, i) => (
          <li
            key={o.label}
            className={`edge-lit rounded-xl border border-hairline bg-surface-2 p-4 transition-opacity duration-500 ${
              i < visible ? "rise opacity-100" : "opacity-0"
            }`}
          >
            <p className="font-mono text-[13px] uppercase tracking-[0.06em] text-primary">
              {o.label}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{o.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
