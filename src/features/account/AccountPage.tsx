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

function PasswordSection() {
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
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      password: next,
      // Signed-in password changes may require the current password.
      current_password: current,
    } as Parameters<typeof supabase.auth.updateUser>[0]);
    setSaving(false);
    if (error) {
      const msg = /current password/i.test(error.message)
        ? "Your current password isn’t right."
        : /should be different|same/i.test(error.message)
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
