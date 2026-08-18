import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard, SignalLabel } from "@/features/shared/primitives";
import { BeviMark } from "@/features/shared/BeviMark";
import type { Attachment } from "./extractFileText";
import { LibraryPanel } from "./LibraryPanel";
import {
  generateVisitIntelligence,
  createAccount,
  rateVisit,
  transcribeAudio,
} from "@/lib/trial.functions";
import { MemoryReviewCard } from "./MemoryReviewCard";
import { copyToClipboard } from "@/lib/clipboard";


type Account = { id: string; name: string; contact: string | null; memory: string };
type AiOutput = {
  needs_more_info: boolean;
  clarifying_questions: string[];
  next_best_move: {
    recommendation: string;
    reason: string;
    specific_ask: string;
    commercial_posture: string;
    confidence: string;
  };
  commercial_signals: {
    buying_style: string;
    risk_flags: string[];
    margin_pressure: string;
    opportunity_signals: string[];
  };
  combined_crm_note: string;
  follow_up_email: { subject: string; body: string };
  missed_opportunity: string;
  updated_account_memory: string;
  targeted_deals?: Array<{
    product: string;
    deal: string;
    window: string;
    eligibility: string;
    why_relevant: string;
    pitch_line: string;
    source_file: string;
  }>;
};

export function TrialPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [supportingContext, setSupportingContext] = useState("");
  const [rawNote, setRawNote] = useState("");
  const [output, setOutput] = useState<AiOutput | null>(null);
  const [visitId, setVisitId] = useState<string | null>(null);
  const [adoptedMemory, setAdoptedMemory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newContact, setNewContact] = useState("");
  const [recognizing, setRecognizing] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [memoryOpen, setMemoryOpen] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const generate = useServerFn(generateVisitIntelligence);
  const addAccount = useServerFn(createAccount);
  const addAccount = useServerFn(createAccount);
  const rate = useServerFn(rateVisit);
  const transcribe = useServerFn(transcribeAudio);

  const active = useMemo(
    () => accounts.find((a) => a.id === activeId) ?? null,
    [accounts, activeId],
  );

  async function loadAccounts(selectId?: string) {
    const { data, error } = await supabase
      .from("accounts")
      .select("id, name, contact, memory")
      .order("updated_at", { ascending: false });
    if (error) {
      console.error("[load accounts]", error);
      setError("Failed to load accounts. Please try again.");
      return;
    }
    setAccounts(data ?? []);
    // Never auto-select an account. Defaulting to the most recently updated
    // venue means a rep can dictate and generate a whole note against a venue
    // they never chose - the note and that account's memory both end up wrong.
    // Selection stays null until the rep picks one (or just created one).
    const next = selectId ?? null;
    setActiveId(next);
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    return () => {
      try {
        mediaRecorderRef.current?.stop();
      } catch {
        /* noop */
      }
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current = null;
      mediaStreamRef.current = null;
    };
  }, []);

  // Intentionally keyed on activeId only, not `active`: this should reset the
  // composer when the user switches accounts, but must NOT re-fire when `active`
  // changes reference for other reasons (e.g. the memory-autosave update below
  // mutates the active account's `memory` field in place) - that would wipe out
  // whatever the user is mid-typing.
  useEffect(() => {
    if (active) {
      setOutput(null);
      setVisitId(null);
      setRawNote("");
      setSupportingContext("");
      setAttachments([]);
      setError(null);
      setAdoptedMemory(false);
      // Re-open the memory panel for each venue: collapsing it for one account
      // must not hide the pre-visit context for the next one.
      setMemoryOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  function buildSupportingContext(): string {
    const parts: string[] = [];
    if (supportingContext.trim()) {
      parts.push(`--- Pasted context ---\n${supportingContext.trim()}`);
    }
    for (const a of attachments) {
      parts.push(`--- File: ${a.name} ---\n${a.text}`);
    }
    return parts.join("\n\n");
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleGenerate(noteOverride?: string) {
    const noteToSubmit = noteOverride ?? rawNote;
    if (!active || !noteToSubmit.trim()) return;
    setLoading(true);
    setError(null);
    setOutput(null);
    try {
      const res = await generate({
        data: {
          accountId: active.id,
          rawNote: noteToSubmit,
          supportingContext: buildSupportingContext(),
        },
      });
      setOutput(res.output);
      setVisitId(res.visitId);
      setAdoptedMemory(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdoptMemory() {
    if (!active || !output) return;
    await saveMemory({ data: { accountId: active.id, memory: output.updated_account_memory } });
    setAccounts((prev) =>
      prev.map((a) => (a.id === active.id ? { ...a, memory: output.updated_account_memory } : a)),
    );
    setAdoptedMemory(true);
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    const res = await addAccount({ data: { name: newName.trim(), contact: newContact.trim() } });
    setNewName("");
    setNewContact("");
    await loadAccounts(res.id);
  }

  async function handleRate(rating: "good" | "needs_edit") {
    if (!visitId) return;
    await rate({ data: { visitId, rating } });
  }

  async function toggleDictation() {
    // If currently recording, stop — onstop handler uploads + transcribes.
    if (recognizing) {
      try {
        mediaRecorderRef.current?.stop();
      } catch {
        /* noop */
      }
      return;
    }

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setError(
        "Dictation isn't supported here. Open the app in a normal browser tab and try again.",
      );
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      const name = (e as { name?: string })?.name;
      if (name === "NotAllowedError" || name === "SecurityError") {
        setError(
          "Microphone permission was blocked. In the preview, open in a new tab to allow the mic.",
        );
      } else if (name === "NotFoundError") {
        setError("No microphone detected on this device.");
      } else {
        setError("Could not access the microphone. Try again or type the note.");
      }
      return;
    }

    // Pick a mimeType the browser actually supports so the container is valid.
    // Order matters: Safari only supports mp4; Chrome/Firefox produce webm.
    const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/mpeg"];
    let mimeType = "";
    for (const c of candidates) {
      if (typeof MediaRecorder.isTypeSupported === "function" && MediaRecorder.isTypeSupported(c)) {
        mimeType = c;
        break;
      }
    }
    let rec: MediaRecorder;
    try {
      rec = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    } catch {
      stream.getTracks().forEach((t) => t.stop());
      setError("Could not start recording. Try again or type the note.");
      return;
    }

    audioChunksRef.current = [];
    mediaRecorderRef.current = rec;
    mediaStreamRef.current = stream;

    rec.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) audioChunksRef.current.push(ev.data);
    };
    rec.onerror = () => {
      setError("Recording failed. Try again.");
    };
    rec.onstop = async () => {
      const chunks = audioChunksRef.current;
      audioChunksRef.current = [];
      stream.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current = null;
      mediaStreamRef.current = null;
      setRecognizing(false);

      const type = chunks[0]?.type || rec.mimeType || "audio/webm";
      const blob = new Blob(chunks, { type });
      if (blob.size < 2048) {
        setError("That recording was empty — please try again.");
        return;
      }
      setTranscribing(true);
      try {
        const buf = await blob.arrayBuffer();
        const bytes = new Uint8Array(buf);
        // base64 encode in chunks to avoid stack overflow on large inputs
        let bin = "";
        const CHUNK = 0x8000;
        for (let i = 0; i < bytes.length; i += CHUNK) {
          bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
        }
        const base64 = btoa(bin);
        const res = await transcribe({ data: { base64, mime: type } });
        const text = (res.text ?? "").trim();
        if (!text) {
          setError("Didn't catch any speech. Try again.");
          return;
        }
        setRawNote((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text));
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Transcription failed.");
      } finally {
        setTranscribing(false);
      }
    };

    try {
      rec.start(); // no timeslice: emit one complete container on stop
      setError(null);
      setRecognizing(true);
    } catch {
      stream.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current = null;
      mediaStreamRef.current = null;
      setError("Could not start dictation. Try again or type the note.");
    }
  }

  async function handleClarifyingAnswers(answers: string[]) {
    if (!output) return;
    const lines = output.clarifying_questions
      .map((question, index) => ({ question, answer: answers[index]?.trim() ?? "" }))
      .filter(({ answer }) => answer)
      .map(({ question, answer }) => `Q: ${question}\nA: ${answer}`);

    if (!lines.length) {
      setError("Add at least one answer so BEVI has more signal.");
      return;
    }

    const noteWithAnswers = `${rawNote.trim()}\n\nClarifying answers:\n${lines.join("\n\n")}`;
    setRawNote(noteWithAnswers);
    await handleGenerate(noteWithAnswers);
  }

  return (
    <main className="relative pt-28 pb-24 min-h-screen">
      <div className="absolute inset-0 grid-overlay pointer-events-none" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
          <div className="flex items-center gap-3">
            <BeviMark size={40} animated={false} />
            <div>
              <SignalLabel>Post-visit intelligence</SignalLabel>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mt-1">
                Making conversations <span className="text-gradient">commercial conversions.</span>
              </h1>
            </div>
          </div>
        </div>

        <div className="space-y-6 min-w-0">
          {/* Accounts + New account */}
          <div className="grid md:grid-cols-2 gap-4">
            <GlassCard className="p-3 relative">
              <div className="flex items-center gap-2 px-1 pb-2">
                <BeviMark size={16} animated={false} />
                <SignalLabel>Accounts</SignalLabel>
                <span className="ml-auto text-[10px] font-mono text-white/40">
                  {accounts.length}
                </span>
              </div>
              <AccountSearch accounts={accounts} activeId={activeId} onSelect={setActiveId} />
            </GlassCard>

            <GlassCard className="p-4">
              <SignalLabel>New account</SignalLabel>
              <div className="mt-3 space-y-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Venue name"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[var(--brand-cyan)]"
                />
                <input
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                  placeholder="Contact (optional)"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[var(--brand-cyan)]"
                />
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                  className="w-full px-3 py-2 rounded-lg text-sm font-medium text-primary-foreground disabled:opacity-40"
                  style={{ background: "var(--gradient-signal)" }}
                >
                  Add account
                </button>
              </div>
            </GlassCard>
          </div>

          {/* What BEVI already knows about this account. The memory is the whole
              product promise, and it was previously only visible baked into the
              AI output *after* the visit - too late to help the rep walk in. */}
          {active ? (
            <GlassCard className="p-4">
              <div className="flex items-center gap-2">
                <SignalLabel>Before you walk in · {active.name}</SignalLabel>
                {(active.memory ?? "").trim() && (
                  <button
                    type="button"
                    onClick={() => setMemoryOpen((v) => !v)}
                    className="ml-auto text-[11px] text-white/60 hover:text-white"
                  >
                    {memoryOpen ? "Hide" : "Show"}
                  </button>
                )}
              </div>
              {(active.memory ?? "").trim() ? (
                memoryOpen && (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-white/80">
                    {active.memory}
                  </p>
                )
              ) : (
                <p className="mt-2 text-sm text-white/50">
                  Nothing on file yet — this will be the first visit recorded for {active.name}.
                </p>
              )}
            </GlassCard>
          ) : (
            <GlassCard className="p-4">
              <SignalLabel>No account selected</SignalLabel>
              <p className="mt-2 text-sm text-white/60">
                Pick a venue above (or add a new one) to see what BEVI knows and start logging.
              </p>
            </GlassCard>
          )}

          {/* File library */}
          <LibraryPanel
            activeAccountId={active?.id ?? null}
            activeAccountName={active?.name ?? null}
            onAttach={({ id, name, text }) => {
              if (attachments.some((a) => a.id === id)) return;
              setAttachments((prev) => [...prev, { id, name, size: text.length, text }]);
            }}
          />

          {/* Supporting context — paste only */}
          <GlassCard className="p-5">
            <SignalLabel>Supporting context (optional)</SignalLabel>
            <p className="text-xs text-white/50 mt-1">
              Paste prior emails, masterfile rows, promo notes. Attached library files appear as
              chips.
            </p>

            {attachments.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {attachments.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-white/5 border border-white/10 text-xs text-white/85"
                  >
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{ background: "var(--brand-cyan)" }}
                    />
                    <span className="font-medium">{a.name}</span>
                    <span className="text-white/40">
                      · {(a.text.length / 1000).toFixed(1)}k chars
                    </span>
                    <button
                      onClick={() => removeAttachment(a.id)}
                      className="ml-1 text-white/40 hover:text-white"
                      aria-label={`Remove ${a.name}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <textarea
              value={supportingContext}
              onChange={(e) => setSupportingContext(e.target.value)}
              disabled={!active}
              placeholder="Paste anything here — prior emails, masterfile rows, promo plan notes…"
              className="mt-3 w-full min-h-[80px] px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/90 placeholder-white/40 focus:outline-none focus:border-[var(--brand-cyan)] resize-y"
            />
          </GlassCard>

          {/* Note */}
          <GlassCard tone="strong" className="p-5">
            <div className="flex items-center justify-between mb-3">
              <SignalLabel>Post-visit note</SignalLabel>
              <button
                type="button"
                onClick={toggleDictation}
                // Must match the note textarea's gate. Without this a rep could
                // dictate before choosing a venue, and selecting one would fire
                // the composer reset below and wipe the transcript.
                disabled={!active || transcribing}
                className={`text-xs px-3 py-1.5 rounded-md disabled:opacity-60 ${
                  recognizing
                    ? "bg-[var(--signal-risk)]/20 text-[var(--signal-risk)]"
                    : "bg-white/10 text-white hover:bg-white/15"
                }`}
              >
                {transcribing
                  ? "Transcribing…"
                  : recognizing
                    ? "● Listening — tap to stop"
                    : "🎙 Dictate"}
              </button>
            </div>
            <textarea
              value={rawNote}
              onChange={(e) => setRawNote(e.target.value)}
              disabled={!active}
              placeholder={
                active
                  ? "Dictate or type. Messy is fine — BEVI will structure it."
                  : "Select an account above to start logging this visit."
              }
              className="w-full min-h-[140px] px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[var(--brand-cyan)] resize-y"
            />
            <div className="mt-4 flex flex-wrap items-center gap-3 justify-end">
              {/* A rep needs to know this is the real record, not a sandbox. */}
              {active && !loading && (
                <span className="mr-auto text-xs text-white/55">
                  Saves to{" "}
                  <span className="font-medium text-white/80">{active.name}</span> in your account
                  history.
                </span>
              )}
              {error && <span className="text-sm text-[var(--signal-risk)]">{error}</span>}
              <button
                type="button"
                onClick={() => handleGenerate()}
                disabled={!active || !rawNote.trim() || loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-primary-foreground disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed ambient-glow"
                style={{ background: "var(--gradient-signal)" }}
              >
                {loading && (
                  <span
                    aria-hidden="true"
                    className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white"
                  />
                )}
                {loading ? "Generating…" : "Generate intelligence →"}
              </button>
            </div>
            {loading && (
              <p className="mt-3 text-right text-xs text-white/55" aria-live="polite">
                Reading your note against {active?.name ?? "this account"}'s history and your deal
                sheets — usually 10–15 seconds.
              </p>
            )}
          </GlassCard>

          {/* Output */}
          {output && (
            <OutputPanel
              output={output}
              onAdoptMemory={handleAdoptMemory}
              onRate={handleRate}
              onClarifyingAnswers={handleClarifyingAnswers}
              loading={loading}
              adoptedMemory={adoptedMemory}
            />
          )}
        </div>
      </div>
    </main>
  );
}

function CopyButton({ text }: { text: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  return (
    <button
      onClick={async () => {
        const ok = await copyToClipboard(text);
        setStatus(ok ? "copied" : "failed");
        setTimeout(() => setStatus("idle"), 1800);
      }}
      className="text-xs px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/15 text-white"
    >
      {status === "copied"
        ? "Copied ✓"
        : status === "failed"
          ? "Couldn't copy — select manually"
          : "Copy"}
    </button>
  );
}

function OutputPanel({
  output,
  onAdoptMemory,
  onRate,
  onClarifyingAnswers,
  loading,
  adoptedMemory,
}: {
  output: AiOutput;
  onAdoptMemory: () => void;
  onRate: (r: "good" | "needs_edit") => void;
  onClarifyingAnswers: (answers: string[]) => void;
  loading: boolean;
  adoptedMemory: boolean;
}) {
  const [rated, setRated] = useState<"good" | "needs_edit" | null>(null);
  const [clarifyingAnswers, setClarifyingAnswers] = useState<string[]>(() =>
    output.clarifying_questions.map(() => ""),
  );

  useEffect(() => {
    setClarifyingAnswers(output.clarifying_questions.map(() => ""));
  }, [output.clarifying_questions]);

  if (output.needs_more_info) {
    const hasAnswer = clarifyingAnswers.some((answer) => answer.trim());

    return (
      <GlassCard tone="strong" className="p-6">
        <SignalLabel as="h2">Need a bit more to be useful</SignalLabel>
        <p className="text-white/80 mt-2 text-sm">
          The note is light. Answer one or two of these and BEVI will draft the full pack.
        </p>
        <div className="mt-4 space-y-3">
          {output.clarifying_questions.map((q, i) => (
            <label key={i} className="block text-sm text-white">
              <span className="flex gap-2">
                <span style={{ color: "var(--brand-cyan)" }}>{i + 1}.</span>
                {q}
              </span>
              <textarea
                value={clarifyingAnswers[i] ?? ""}
                onChange={(event) => {
                  const next = [...clarifyingAnswers];
                  next[i] = event.target.value;
                  setClarifyingAnswers(next);
                }}
                placeholder="Answer if known"
                className="mt-2 w-full min-h-[64px] px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/90 placeholder-white/40 focus:outline-none focus:border-[var(--brand-cyan)] resize-y"
              />
            </label>
          ))}
        </div>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => onClarifyingAnswers(clarifyingAnswers)}
            disabled={!hasAnswer || loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-primary-foreground disabled:opacity-40 ambient-glow"
            style={{ background: "var(--gradient-signal)" }}
          >
            {loading ? "Generating..." : "Generate with answers"}
          </button>
        </div>
      </GlassCard>
    );
  }

  const nbm = output.next_best_move;
  const sig = output.commercial_signals;

  return (
    <div className="space-y-6">
      {/* 1. NEXT BEST MOVE — largest */}
      <GlassCard tone="strong" className="p-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <SignalLabel as="h2">Next best move</SignalLabel>
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em]">
            <span
              className="px-2 py-1 rounded-md"
              style={{
                color: "var(--brand-cyan)",
                background: "color-mix(in oklab, var(--brand-cyan) 12%, transparent)",
              }}
            >
              {nbm.commercial_posture}
            </span>
            <span
              className="px-2 py-1 rounded-md"
              style={{
                color: "var(--brand-violet)",
                background: "color-mix(in oklab, var(--brand-violet) 12%, transparent)",
              }}
            >
              {nbm.confidence} confidence
            </span>
          </div>
        </div>
        <p className="mt-3 text-xl md:text-2xl text-white font-semibold leading-snug">
          {nbm.recommendation}
        </p>
        <p className="mt-3 text-white/70 text-sm leading-relaxed">{nbm.reason}</p>
        <div className="mt-4 p-3 rounded-lg border border-white/10 bg-white/5">
          <SignalLabel>Specific ask</SignalLabel>
          <p className="text-white/90 text-sm mt-1">{nbm.specific_ask}</p>
        </div>
      </GlassCard>

      {/* 2. COMMERCIAL SIGNALS */}
      {sig && (
        <GlassCard tone="strong" className="p-6">
          <SignalLabel as="h2">Commercial signals</SignalLabel>
          <div className="mt-4 grid sm:grid-cols-2 gap-4">
            <SignalBlock label="Buying style" tone="var(--brand-cyan)">
              <p className="text-white/85 text-sm">{sig.buying_style || "—"}</p>
            </SignalBlock>
            <SignalBlock label="Margin pressure" tone="var(--signal-warning)">
              <p className="text-white/85 text-sm">{sig.margin_pressure || "—"}</p>
            </SignalBlock>
            <SignalBlock label="Risk flags" tone="var(--signal-risk)">
              {sig.risk_flags?.length ? (
                <ul className="text-white/85 text-sm space-y-1">
                  {sig.risk_flags.map((r, i) => (
                    <li key={i}>· {r}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-white/50 text-sm">None flagged.</p>
              )}
            </SignalBlock>
            <SignalBlock label="Opportunity signals" tone="var(--signal-positive)">
              {sig.opportunity_signals?.length ? (
                <ul className="text-white/85 text-sm space-y-1">
                  {sig.opportunity_signals.map((r, i) => (
                    <li key={i}>· {r}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-white/50 text-sm">None surfaced.</p>
              )}
            </SignalBlock>
          </div>
        </GlassCard>
      )}

      {/* 3. CRM NOTE */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-2">
          <SignalLabel as="h2">CRM NOTE</SignalLabel>
          <CopyButton text={output.combined_crm_note} />
        </div>
        <pre className="text-[13px] text-white/85 whitespace-pre-wrap font-sans leading-relaxed">
          {output.combined_crm_note}
        </pre>
      </GlassCard>

      {/* 4. FOLLOW-UP EMAIL */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-2">
          <SignalLabel as="h2">Follow-up Email</SignalLabel>
          <CopyButton
            text={`Subject: ${output.follow_up_email.subject}\n\n${output.follow_up_email.body}`}
          />
        </div>
        <div className="text-xs text-white/50 mb-1">Subject</div>
        <div className="text-white text-sm font-medium">{output.follow_up_email.subject}</div>
        <div className="text-xs text-white/50 mt-3 mb-1">Body</div>
        <pre className="text-[13px] text-white/85 whitespace-pre-wrap font-sans leading-relaxed">
          {output.follow_up_email.body}
        </pre>
      </GlassCard>

      {/* 5. ACCOUNT MEMORY */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <SignalLabel as="h2">Updated Account Memory</SignalLabel>
          <button
            onClick={onAdoptMemory}
            disabled={adoptedMemory}
            className={`text-xs px-3 py-1.5 rounded-md text-white transition-colors ${
              adoptedMemory
                ? "bg-[var(--brand-cyan)]/20 border border-[var(--brand-cyan)]/40 text-[var(--brand-cyan)] cursor-default"
                : "bg-white/10 hover:bg-white/15"
            }`}
          >
            {adoptedMemory ? "Memory updated" : "Adopt as new memory"}
          </button>
        </div>
        <pre className="text-[13px] text-white/80 whitespace-pre-wrap font-sans leading-relaxed">
          {output.updated_account_memory}
        </pre>
      </GlassCard>

      {/* 6. MISSED OPPORTUNITY */}
      {output.missed_opportunity && (
        <GlassCard className="p-5">
          <SignalLabel as="h2">Missed opportunity challenge</SignalLabel>
          <p className="mt-2 text-white/85 text-sm">{output.missed_opportunity}</p>
        </GlassCard>
      )}

      {/* 7. TARGETED DEALS — end-of-call pitch suggestions sourced from library deals */}
      {output.targeted_deals && output.targeted_deals.length > 0 && (
        <GlassCard tone="strong" className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <SignalLabel as="h2">TARGETED DEALS TO PITCH NEXT CALL</SignalLabel>
            <span
              className="text-[10px] font-mono uppercase tracking-[0.18em] px-2 py-1 rounded-md"
              style={{
                color: "var(--signal-positive)",
                background: "color-mix(in oklab, var(--signal-positive) 12%, transparent)",
              }}
            >
              {output.targeted_deals.length} match{output.targeted_deals.length === 1 ? "" : "es"}
            </span>
          </div>
          <ul className="mt-4 space-y-4">
            {output.targeted_deals.map((d, i) => (
              <li key={i} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex items-baseline justify-between flex-wrap gap-2">
                  <div className="text-white font-semibold">{d.product}</div>
                  <div className="text-xs text-white/60">{d.window}</div>
                </div>
                <div className="mt-1 text-sm text-[var(--brand-cyan)]">{d.deal}</div>
                {d.eligibility && (
                  <div className="mt-1 text-xs text-white/60">Eligibility: {d.eligibility}</div>
                )}
                {d.why_relevant && (
                  <div className="mt-2 text-xs text-white/70">Why relevant: {d.why_relevant}</div>
                )}
                {d.pitch_line && (
                  <div className="mt-3 rounded-md border-l-2 border-[var(--brand-cyan)] bg-white/5 p-3 text-sm text-white/90 italic">
                    "{d.pitch_line}"
                  </div>
                )}
                {d.source_file && (
                  <div className="mt-2 text-[10px] font-mono uppercase tracking-[0.18em] text-white/40">
                    Source: {d.source_file}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </GlassCard>
      )}

      <div className="flex items-center justify-end gap-2">
        <span className="signal-label font-sans font-bold text-lg !text-white/50 mr-2">
          Rate this output
        </span>
        <button
          onClick={() => {
            setRated("good");
            onRate("good");
          }}
          className={`text-xs px-3 py-1.5 rounded-md ${
            rated === "good"
              ? "bg-[var(--signal-positive)]/25 text-[var(--signal-positive)]"
              : "bg-white/10 text-white hover:bg-white/15"
          }`}
        >
          Good
        </button>
        <button
          onClick={() => {
            setRated("needs_edit");
            onRate("needs_edit");
          }}
          className={`text-xs px-3 py-1.5 rounded-md ${
            rated === "needs_edit"
              ? "bg-[var(--signal-warning)]/25 text-[var(--signal-warning)]"
              : "bg-white/10 text-white hover:bg-white/15"
          }`}
        >
          Needs edit
        </button>
      </div>
    </div>
  );
}

function SignalBlock({
  label,
  tone,
  children,
}: {
  label: string;
  tone: string;
  children: ReactNode;
}) {
  return (
    <div className="p-3 rounded-lg border border-white/10 bg-white/5">
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: tone, boxShadow: `0 0 10px ${tone}` }}
        />
        <SignalLabel>{label}</SignalLabel>
      </div>
      {children}
    </div>
  );
}

function AccountSearch({
  accounts,
  activeId,
  onSelect,
}: {
  accounts: Account[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);

  const active = accounts.find((a) => a.id === activeId);
  const q = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!q) return accounts.slice(0, 8);
    return accounts
      .filter(
        (a) => a.name.toLowerCase().includes(q) || (a.contact ?? "").toLowerCase().includes(q),
      )
      .slice(0, 12);
  }, [q, accounts]);

  useEffect(() => {
    setHighlight(0);
  }, [q]);

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const r = wrapRef.current?.getBoundingClientRect();
      if (!r) return;
      const vv = window.visualViewport;
      const vw = vv?.width ?? window.innerWidth;
      const vh = vv?.height ?? window.innerHeight;
      const margin = 8;
      const width = Math.min(r.width, vw - margin * 2);
      const left = Math.min(Math.max(r.left, margin), Math.max(margin, vw - width - margin));
      const top = r.bottom + 6;
      const maxHeight = Math.max(140, vh - (top - (vv?.offsetTop ?? 0)) - margin);
      setAnchor({ top, left, width, maxHeight });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
    };
  }, [open]);

  useEffect(() => {
    const onDown = (e: Event) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
      if (popRef.current?.contains(t)) return;
      setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, []);

  const pick = (id: string) => {
    onSelect(id);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative min-w-0">
      <div className="flex min-w-0 items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus-within:border-[var(--brand-cyan)] transition-colors">
        <svg
          className="h-3.5 w-3.5 text-white/40 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlight((h) => Math.min(h + 1, matches.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            } else if (e.key === "Enter" && matches[highlight]) {
              e.preventDefault();
              pick(matches[highlight].id);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={active ? active.name : "Search venue…"}
          className="w-full min-w-0 bg-transparent text-sm text-white placeholder-white/40 outline-none"
          aria-label="Search accounts"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="text-[10px] font-mono text-white/40 hover:text-white/70 shrink-0"
          >
            clear
          </button>
        )}
      </div>

      {open &&
        accounts.length > 0 &&
        anchor &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popRef}
            style={{
              position: "fixed",
              top: anchor.top,
              left: anchor.left,
              width: anchor.width,
              maxWidth: "calc(100vw - 16px)",
              maxHeight: Math.min(anchor.maxHeight, 288),
              zIndex: 1000,
            }}
            className="overflow-y-auto overflow-x-hidden overscroll-contain rounded-xl border border-white/10 ring-1 ring-white/5 bg-background/95 backdrop-blur-xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)]"
          >
            {matches.length === 0 ? (
              <div className="px-3 py-3 text-xs text-white/50">No venues match "{query}"</div>
            ) : (
              <ul className="py-1 divide-y divide-white/5">
                {matches.map((a, i) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setHighlight(i)}
                      onClick={() => pick(a.id)}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                        i === highlight ? "bg-white/8 text-white" : "text-white/80 hover:bg-white/5"
                      } ${a.id === activeId ? "border-l-2 border-[var(--brand-cyan)]" : ""}`}
                    >
                      <div className="font-medium truncate">{a.name}</div>
                      {a.contact && (
                        <div className="text-[11px] text-white/50 truncate">{a.contact}</div>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>,
          document.body,
        )}

      {/* Deliberately high-contrast: this is the guard against dictating a note
          into the wrong venue after a long day of calls. */}
      {active && !open && (
        <div className="mt-2 px-1">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand-cyan)]/40 bg-[var(--brand-cyan)]/10 px-2.5 py-1 text-[11px] font-medium text-white">
            <span className="text-[var(--brand-cyan)]" aria-hidden="true">
              ✓
            </span>
            Logging to {active.name}
          </span>
        </div>
      )}
    </div>
  );
}
