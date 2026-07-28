import { useEffect, useRef, useState } from "react";
import { HERO_NOTE, OUTPUT_CARDS } from "./outputs";

const TYPE_MS = 3000;
const STAGGER = 80;
const HOLD_MS = 4000;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

export function HeroReconstruction() {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [typed, setTyped] = useState(reduced ? HERO_NOTE.length : 0);
  const [revealed, setRevealed] = useState(reduced ? OUTPUT_CARDS.length : 0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => setInView(entries[0]?.isIntersecting ?? false), {
      threshold: 0.2,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduced) {
      setTyped(HERO_NOTE.length);
      setRevealed(OUTPUT_CARDS.length);
      return;
    }
    if (!inView) return;

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let raf = 0;

    const run = () => {
      setTyped(0);
      setRevealed(0);
      const start = performance.now();
      const step = (now: number) => {
        if (cancelled) return;
        const p = Math.min((now - start) / TYPE_MS, 1);
        setTyped(Math.round(p * HERO_NOTE.length));
        if (p < 1) {
          raf = requestAnimationFrame(step);
        } else {
          OUTPUT_CARDS.forEach((_, i) => {
            timers.push(setTimeout(() => !cancelled && setRevealed(i + 1), i * STAGGER));
          });
          timers.push(
            setTimeout(
              () => {
                if (!cancelled) run();
              },
              OUTPUT_CARDS.length * STAGGER + 320 + HOLD_MS,
            ),
          );
        }
      };
      raf = requestAnimationFrame(step);
    };

    run();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, [inView, reduced]);

  return (
    <div ref={ref}>
      <p className="sr-only">
        BEVI turns one post-visit note into five outputs: next best move, CRM note, follow-up email,
        missed opportunity and account signals.
      </p>

      <div aria-hidden className="flex flex-col gap-3">
        <div
          className="rounded-xl border p-5"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border-hairline)" }}
        >
          <span className="bevi-eyebrow">POST-VISIT NOTE</span>
          <p className="mt-3 min-h-[72px] text-[15px] leading-[1.55] text-[var(--text-primary)]">
            {HERO_NOTE.slice(0, typed)}
            <span className="bevi-caret" />
          </p>
        </div>

        <div className="grid gap-3">
          {OUTPUT_CARDS.map((card, i) => {
            const on = i < revealed;
            const anchor = i === 0;
            return (
              <div
                key={card.key}
                className="rounded-xl border p-4 transition-[opacity,transform] duration-[320ms] ease-out"
                style={{
                  background: "var(--bg-surface)",
                  borderColor: anchor ? "var(--accent-teal)" : "var(--border-hairline)",
                  opacity: on ? 1 : 0,
                  transform: on ? "translateY(0)" : "translateY(12px)",
                  minHeight: anchor ? 108 : 88,
                }}
              >
                <span
                  className="bevi-eyebrow"
                  style={anchor ? { color: "var(--accent-teal-text)" } : undefined}
                >
                  {card.header}
                </span>
                <p
                  className={`mt-2 leading-[1.5] text-[var(--text-muted)] ${anchor ? "text-[15px] text-[var(--text-primary)]" : "text-[13px]"}`}
                >
                  {card.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
