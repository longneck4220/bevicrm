import { useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { joinWaitlist } from "@/lib/waitlist.functions";

export function GetBeviDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const join = useServerFn(joinWaitlist);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"form" | "sending" | "done">("form");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) && email.trim().length <= 255;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!valid) {
      setError("Enter a valid email address.");
      return;
    }
    setState("sending");
    try {
      await join({
        data: {
          email: email.trim(),
          source: "get-a-bevi",
          referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
          utm:
            typeof window !== "undefined" && window.location.search
              ? window.location.search.slice(1, 300)
              : undefined,
        },
      });
      setState("done");
    } catch {
      setState("form");
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-5"
      role="dialog"
      aria-modal="true"
      aria-label="Get a BEVI"
    >
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#121A2E] p-7 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 h-8 w-8 rounded-full border border-white/10 text-white/60 hover:text-white hover:bg-white/5"
        >
          ×
        </button>

        {state === "done" ? (
          <div className="text-center pt-2">
            <div
              className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: "color-mix(in oklab, var(--brand-cyan) 18%, transparent)" }}
            >
              <span className="text-2xl" style={{ color: "var(--brand-cyan)" }}>
                ✓
              </span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">You&apos;re on the list</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              We&apos;ll email {email.trim()} as soon as your BEVI access is ready. Invites roll out
              weekly.
            </p>
            <button
              onClick={onClose}
              className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-lg px-6 text-sm font-semibold text-primary-foreground"
              style={{ background: "var(--gradient-signal)" }}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="pt-2">
            <div
              className="signal-label font-sans font-bold text-lg"
              style={{ color: "var(--brand-cyan)" }}
            >
              Get a BEVI
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Win the next call.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Leave your email and we&apos;ll send your access invite as soon as it&apos;s ready.
            </p>

            <label htmlFor="get-bevi-email" className="mt-6 block text-xs text-white/70">
              Work email
            </label>
            <input
              id="get-bevi-email"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              maxLength={255}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com.au"
              className="mt-2 w-full rounded-lg border border-white/12 bg-[#0A1020] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[var(--brand-cyan)]"
            />
            {error && (
              <p className="mt-2 text-xs text-red-400" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={state === "sending"}
              className="mt-5 inline-flex w-full min-h-[44px] items-center justify-center rounded-lg px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              style={{ background: "var(--gradient-signal)" }}
            >
              {state === "sending" ? "Sending…" : "Request access"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
