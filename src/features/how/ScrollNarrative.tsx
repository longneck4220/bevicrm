import { useEffect, useRef, useState } from "react";
import { StageCanvas } from "./StageCanvas";
import { PrimaryButton } from "@/features/shared/MarketingButtons";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Stage 00 headline: "Between" and "Visits" nudge into each other a few times,
 * then hand over to the BEVI wordmark.
 */
function GapTitle({ animate }: { animate: boolean }) {
  const [run, setRun] = useState(false);

  // Armed by a downward scroll; re-arms once the user returns to the top.
  useEffect(() => {
    if (!animate) return;
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y <= 8) setRun(false);
      else if (y > lastY) setRun(true);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [animate]);

  return (
    <span className="flex w-full flex-wrap items-baseline gap-x-3">
      <span>The gap:</span>
      <span className="relative inline-flex min-h-[1.2em] flex-1 items-baseline justify-center gap-x-[0.28em] whitespace-nowrap">
        <span className={run ? "bevi-collide-l" : "inline-block"}>Between</span>
        <span className={run ? "bevi-collide-r" : "inline-block"}>Visits</span>
        <span
          aria-hidden={animate && !run}
          className="pointer-events-none absolute inset-0 flex items-baseline justify-center"
        >
          <span
            className={
              "tracking-[-0.03em] text-foreground " +
              (!animate ? "opacity-100" : run ? "bevi-emerge" : "opacity-0")
            }
          >
            BE<span className="text-primary">VI</span>
          </span>
        </span>
      </span>
    </span>
  );
}

export const STAGES = [
  {
    kicker: "Stage 00",
    title: "The gap",
    body: "Momentum dies between visits. Not because the rep forgot the meeting — because the 90 seconds after it was never captured.",
  },
  {
    kicker: "Stage 01",
    title: "Capture",
    body: "“Met with Aaron, he is happy to run with the Summer promotional material. He mentioned pricing support lapsed needs reviewing. Wants help with staff performance. Training booked next month.” One rough dictation from the car park is enough.",
  },
  {
    kicker: "Stage 02",
    title: "Signal",
    body: "BEVI reads the commercial reality: buying style, margin pressure, the missed opportunity.",
  },
  {
    kicker: "Stage 03",
    title: "Move",
    body: "Five outputs land in order: Next Best Move, CRM Note, Follow-Up Email, Missed Opportunity, Account Signals.",
  },
  {
    kicker: "Stage 04",
    title: "Carry forward",
    body: "Account memory updates itself. The next visit starts with cues, risks and open actions already in view.",
  },
  {
    kicker: "Stage 05",
    title: "That took 90 seconds.",
    body: "Try it on your own venue.",
    cta: true,
  },
];

export function ScrollNarrative() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const [revealed, setRevealed] = useState(5);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const moveRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (reduced) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(Number((entry.target as HTMLElement).dataset.stage));
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    refs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [reduced]);

  // Stagger the five output cards in as the "Move" stage scrolls through.
  useEffect(() => {
    if (reduced) return;
    const onScroll = () => {
      const el = moveRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const progress = (window.innerHeight * 0.75 - rect.top) / rect.height;
      setRevealed(Math.max(0, Math.min(5, Math.ceil(progress * 6))));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [reduced]);

  if (reduced) {
    return (
      <div className="shell space-y-16">
        {STAGES.map((s, i) => (
          <section key={s.title} className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <StageCanvas stage={i} revealed={5} />
            </div>
            <div>
              <p className="eyebrow">{s.kicker}</p>
              <h2 className="mt-4 text-3xl tracking-[-0.02em] text-foreground md:text-h3">
                {i === 0 ? <GapTitle animate={false} /> : s.title}
              </h2>
              <p className="mt-4 text-[17px] leading-relaxed text-muted-foreground">{s.body}</p>
              {s.cta && (
                <div className="mt-7">
                  <PrimaryButton to="/try">Try a visit note →</PrimaryButton>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className="shell grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-16">
      <div>
        {STAGES.map((s, i) => (
          <div
            key={s.title}
            data-stage={i}
            ref={(el) => {
              refs.current[i] = el;
              if (i === 3) moveRef.current = el;
            }}
            className="flex min-h-[70vh] flex-col justify-center py-10 lg:min-h-[85vh]"
          >
            <p className="eyebrow">{s.kicker}</p>
            <h2 className="mt-4 max-w-xl text-3xl tracking-[-0.02em] text-foreground md:text-h3">
              {i === 0 ? <GapTitle animate /> : s.title}
            </h2>
            <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-muted-foreground md:text-lg">
              {s.body}
            </p>
            {s.cta && (
              <div className="mt-8">
                <PrimaryButton to="/try">Try a visit note →</PrimaryButton>
              </div>
            )}
            <div className="mt-8 lg:hidden">
              <StageCanvas stage={i} revealed={5} />
            </div>
          </div>
        ))}
      </div>

      <div className="hidden lg:block">
        <div className="sticky top-28">
          <StageCanvas stage={active} revealed={revealed} />
          <div className="mt-6 flex items-center justify-center gap-3">
            {STAGES.map((s, i) =>
              i === active ? (
                <span key={s.title} className="signal-dot" />
              ) : (
                <span key={s.title} className="h-2 w-2 rounded-full bg-surface-2" />
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
