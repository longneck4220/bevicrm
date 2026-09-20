import { useEffect, useState } from "react";
import { GlassCard, SignalLabel } from "@/features/shared/primitives";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-[15px] text-white placeholder:text-white/35 outline-none focus:border-transparent focus:ring-2 focus:ring-[var(--brand-cyan,#18B4A6)]";
const labelClass = "mb-1.5 block text-[13px] font-medium text-white/70";
const primaryBtn =
  "inline-flex min-h-[44px] items-center justify-center rounded-lg px-5 text-sm font-semibold text-[#0A1020] disabled:opacity-60";
const outlineBtn =
  "inline-flex min-h-[44px] items-center justify-center rounded-lg border border-white/15 px-5 text-sm font-medium text-white/85 hover:bg-white/5 disabled:opacity-60";

type Note = { kind: "ok" | "error"; text: string } | null;

function Notice({ note }: { note: Note }) {
  if (!note) return null;
  return (
    <p
      aria-live="polite"
      className={`mt-3 text-sm ${note.kind === "ok" ? "text-[#2DD4C4]" : "text-[#F87171]"}`}
    >
      {note.text}
    </p>
  );
}

function ProfileSection() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<Note>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
        setDisplayName(
          data?.display_name ??
            (typeof meta.full_name === "string" ? meta.full_name : "") ??
            "",
        );
        setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [user]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setNote(null);
    const name = displayName.trim();
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: name })
      .eq("user_id", user.id);
    if (error) {
      setNote({ kind: "error", text: "Could not save your name. Please try again." });
      setSaving(false);
      return;
    }
    await supabase.auth.updateUser({ data: { full_name: name } });
    setNote({ kind: "ok", text: "Your details were saved." });
    setSaving(false);
  }

  return (
    <GlassCard className="p-6 sm:p-7">
      <SignalLabel>Your details</SignalLabel>
      <form onSubmit={save} className="mt-4 max-w-md space-y-4">
        <div>
          <label className={labelClass} htmlFor="account-name">
            Name
          </label>
          <input
            id="account-name"
            className={inputClass}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={loaded ? "Your name" : "Loading…"}
            autoComplete="name"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="account-email">
            Email
          </label>
          <input
            id="account-email"
            className={`${inputClass} opacity-60`}
            value={user?.email ?? ""}
            readOnly
            disabled
          />
          <p className="mt-1.5 text-[13px] text-white/45">
            Your sign-in email can&apos;t be changed here — ask an admin if it needs updating.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className={primaryBtn}
          style={{ background: "var(--gradient-signal, #18B4A6)" }}
        >
          {saving ? "Saving…" : "Save details"}
        </button>
        <Notice note={note} />
      </form>
    </GlassCard>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {open ? (
        <>
          <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.6 6.1A9.6 9.6 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-2.6 3.4M6.7 8A17 17 0 0 0 2.5 12S6 18 12 18a9 9 0 0 0 3.4-.6" />
          <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
        </>
      )}
    </svg>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          className={`${inputClass} pr-12`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          required
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={show}
          className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-white/55 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-cyan,#18B4A6)]"
        >
          <EyeIcon open={show} />
        </button>
      </div>
    </div>
  );
}

function PasswordSection() {
  const { user } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<Note>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setNote(null);
    if (next.length < 8) {
      setNote({ kind: "error", text: "Use at least 8 characters for your new password." });
      return;
    }
    if (next !== confirm) {
      setNote({ kind: "error", text: "The new passwords don’t match." });
      return;
    }
    if (next === current) {
      setNote({ kind: "error", text: "Choose a password different from your current one." });
      return;
    }
    const email = user?.email;
    if (!email) {
      setNote({ kind: "error", text: "Please sign in again before changing your password." });
      return;
    }
    setSaving(true);
    // Verify the current password by re-signing in; this also refreshes the session
    // so the password update is accepted and you stay signed in afterwards.
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password: current,
    });
    if (verifyError) {
      setSaving(false);
      setNote({ kind: "error", text: "Your current password isn’t right." });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: next });
    setSaving(false);
    if (error) {
      const msg = /should be different|same/i.test(error.message)
        ? "Choose a password different from your current one."
        : "Could not change your password. Please try again.";
      setNote({ kind: "error", text: msg });
      return;
    }
    setCurrent("");
    setNext("");
    setConfirm("");
    setNote({ kind: "ok", text: "Your password was changed." });
  }

  return (
    <GlassCard className="p-6 sm:p-7">
      <SignalLabel>Change password</SignalLabel>
      <form onSubmit={submit} className="mt-4 max-w-md space-y-4">
        <div>
          <label className={labelClass} htmlFor="pw-current">
            Current password
          </label>
          <input
            id="pw-current"
            type="password"
            className={inputClass}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="pw-new">
            New password
          </label>
          <input
            id="pw-new"
            type="password"
            className={inputClass}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="pw-confirm">
            Confirm new password
          </label>
          <input
            id="pw-confirm"
            type="password"
            className={inputClass}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        <button type="submit" disabled={saving} className={outlineBtn}>
          {saving ? "Updating…" : "Update password"}
        </button>
        <Notice note={note} />
      </form>
    </GlassCard>
  );
}

export function AccountPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 pb-20 pt-24 sm:px-6">
      <h1 className="font-display text-[32px] leading-tight text-white sm:text-[40px]">Account</h1>
      <p className="mt-2 text-[15px] text-white/60">
        Update your details and change your password.
      </p>
      <div className="mt-8 space-y-6">
        <ProfileSection />
        <PasswordSection />
      </div>
    </main>
  );
}
