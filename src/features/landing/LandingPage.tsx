import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { HeroReconstruction } from "./HeroReconstruction";
import { OUTPUT_CARDS } from "./outputs";

const STACK = ["Salesforce", "Otter", "Rhino CRM", "Teams", "Power BI"];

const LOOP = [
  {
    label: "CAPTURE",
    body: "Dictate the rough note from the car park. Buyer cues, pricing tension, promises — before they go cold.",
  },
  {
    label: "SIGNAL",
    body: "BEVI reads intent, objections, margin pressure, missed opportunity and account risk.",
  },
  {
    label: "MOVE",
    body: "Five outputs in under 90 seconds. The next best move, ready before you've left the car park.",
  },
];

function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (e) => {
        if (e[0]?.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, seen };
}

function LoopSection() {
  const { ref, seen } = useInView<HTMLDivElement>();
  return (
    <section id="why" className="bevi-section" aria-labelledby="loop-heading">
      <div className="bevi-container">
        <span className="bevi-eyebrow">THE OPERATING LOOP</span>
        <h2 id="loop-heading" className="bevi-h2 mt-3">
          Capture → Signal → Move.
        </h2>

        <div ref={ref} className="relative mt-12">
          <div
            className="absolute left-0 right-0 top-[7px] hidden h-px md:block"
            style={{ background: "var(--border-hairline)" }}
            aria-hidden
          />
          <div
            className="absolute left-0 top-[3px] hidden h-[9px] w-[9px] rounded-full motion-safe:md:block"
            style={{
              background: "var(--accent-teal)",
              animation: seen ? "beviTrace 960ms cubic-bezier(0.4,0,0.2,1) forwards" : "none",
              opacity: seen ? 1 : 0,
            }}
            aria-hidden
          />
          <div className="grid gap-8 md:grid-cols-3 md:gap-6">
            {LOOP.map((s) => (
              <div key={s.label} className="pt-6">
                <span className="bevi-eyebrow" style={{ color: "var(--accent-teal-text)" }}>
                  {s.label}
                </span>
                <p className="mt-3 max-w-[46ch] text-[16px] leading-[1.55] text-[var(--text-muted)]">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function BentoCard({
  header,
  body,
  anchor = false,
  className = "",
}: {
  header: string;
  body: string;
  anchor?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`bevi-card ${className}`}
      style={anchor ? { borderColor: "var(--accent-teal)" } : undefined}
    >
      <span
        className="bevi-eyebrow"
        style={anchor ? { color: "var(--accent-teal-text)" } : undefined}
      >
        {header}
      </span>
      <p
        className={`mt-3 leading-[1.55] ${anchor ? "text-[18px] text-[var(--text-primary)]" : "text-[15px] text-[var(--text-muted)]"}`}
      >
        {body}
      </p>
    </div>
  );
}

export function LandingPage() {
  const [anchorCard, ...rest] = OUTPUT_CARDS;

  return (
    <main id="main" className="pt-[72px] pb-24 md:pb-0">
      {/* HERO */}
      <section className="bevi-section" aria-labelledby="hero-heading">
        <div className="bevi-container grid items-center gap-12 lg:grid-cols-[55fr_45fr]">
          <div>
            <span className="bevi-eyebrow">POST-VISIT INTELLIGENCE</span>
            <h1 id="hero-heading" className="bevi-h1 mt-4">
              Win the next call.
            </h1>
            <p className="mt-6 max-w-[52ch] text-[18px] leading-[1.55] text-[var(--text-muted)]">
              You don't lose the deal in the venue. You lose it in the 90 seconds after. BEVI turns
              one rough post-visit note into your next best move — CRM note, follow-up, missed
              opportunity and account signals — before the car leaves the car park.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/try" className="bevi-btn-primary">
                Try a visit note — no signup →
              </Link>
              <Link to="/how-it-works" className="bevi-btn-secondary">
                See how it works
              </Link>
            </div>
            <p className="bevi-eyebrow mt-4 block" style={{ fontSize: 12 }}>
              No signup · nothing saved · ~90 seconds
            </p>
          </div>

          <HeroReconstruction />
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="bevi-container flex flex-wrap items-center gap-3 pb-12">
        <span className="bevi-eyebrow">SITS ABOVE</span>
        <ul className="flex flex-wrap items-center gap-2">
          {STACK.map((s) => (
            <li
              key={s}
              className="rounded-full border px-3 py-1.5 text-[13px] text-[var(--text-muted)]"
              style={{ borderColor: "var(--border-hairline)", background: "var(--bg-surface)" }}
            >
              {s}
            </li>
          ))}
        </ul>
      </section>

      {/* FRAMEWORK */}
      <section className="bevi-section" aria-label="What BEVI does">
        <div className="bevi-container text-center">
          <p className="bevi-h2 text-[var(--text-muted)]">A CRM stores the account.</p>
          <p className="bevi-h2 mt-2 text-[var(--text-muted)]">A transcriber captures the words.</p>
          <p className="bevi-h2 mt-2 text-[var(--text-primary)]">
            BEVI interprets the next move.
            <span
              className="ml-2 inline-block h-2.5 w-2.5 rounded-full align-middle"
              style={{ background: "var(--accent-teal)" }}
              aria-hidden
            />
          </p>
        </div>
      </section>

      <LoopSection />

      {/* BENTO */}
      <section id="outputs" className="bevi-section" aria-labelledby="outputs-heading">
        <div className="bevi-container">
          <h2 id="outputs-heading" className="bevi-h2">
            One note in. Five moves out.
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-12">
            <BentoCard
              header={anchorCard.header}
              body={anchorCard.expanded}
              anchor
              className="md:col-span-6 md:row-span-2"
            />
            {rest.map((c) => (
              <BentoCard
                key={c.key}
                header={c.header}
                body={c.expanded}
                className="md:col-span-3"
              />
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bevi-section" aria-labelledby="cta-heading">
        <div className="bevi-container max-w-[820px] text-center">
          <h2 id="cta-heading" className="bevi-h2">
            Sales isn't lost in the meeting. It's lost in what happens next.
          </h2>
          <div className="mt-8 flex justify-center">
            <Link to="/try" className="bevi-btn-primary">
              Try a visit note →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
