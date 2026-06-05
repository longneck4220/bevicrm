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
  updateAccountMemory,
  createAccount,
  rateVisit,
} from "@/lib/trial.functions";

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
  const [memoryDraft, setMemoryDraft] = useState("");
  const [memoryDirty, setMemoryDirty] = useState(false);
  const [supportingContext, setSupportingContext] = useState("");
  const [rawNote, setRawNote] = useState("");
  const [output, setOutput] = useState<AiOutput | null>(null);
  const [visitId, setVisitId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newContact, setNewContact] = useState("");
  const [recognizing, setRecognizing] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const generate = useServerFn(generateVisitIntelligence);
  const saveMemory = useServerFn(updateAccountMemory);
  const addAccount = useServerFn(createAccount);
  const rate = useServerFn(rateVisit);

  const active = useMemo(() => accounts.find((a) => a.id === activeId) ?? null, [accounts, activeId]);

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
    const next = selectId ?? data?.[0]?.id ?? null;
    setActiveId(next);
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (active) {
      setMemoryDraft(active.memory);
      setMemoryDirty(false);
      setOutput(null);
      setVisitId(null);
      setRawNote("");
      setSupportingContext("");
      setAttachments([]);
      setError(null);
    }
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

  async function handleGenerate() {
    if (!active || !rawNote.trim()) return;
    setLoading(true);
    setError(null);
    setOutput(null);
    try {
      if (memoryDirty) {
        await saveMemory({ data: { accountId: active.id, memory: memoryDraft } });
        setMemoryDirty(false);
      }
      const res = await generate({
        data: { accountId: active.id, rawNote, supportingContext: buildSupportingContext() },
      });
      setOutput(res.output);
      setVisitId(res.visitId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdoptMemory() {
    if (!active || !output) return;
    await saveMemory({ data: { accountId: active.id, memory: output.updated_account_memory } });
    setMemoryDraft(output.updated_account_memory);
    setAccounts((prev) =>
      prev.map((a) => (a.id === active.id ? { ...a, memory: output.updated_account_memory } : a)),
    );
  }

  async function handleSaveMemory() {
    if (!active) return;
    await saveMemory({ data: { accountId: active.id, memory: memoryDraft } });
    setMemoryDirty(false);
    setAccounts((prev) => prev.map((a) => (a.id === active.id ? { ...a, memory: memoryDraft } : a)));
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

  function toggleDictation() {
    // Lightweight Web Speech API integration; graceful fallback if unsupported
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) {
      setError("Dictation is not supported in this browser. Type the note instead.");
      return;
    }
    if (recognizing) {
      setRecognizing(false);
      return;
    }
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-AU";
    rec.onresult = (e: SpeechRecognitionEvent) => {
      let txt = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        txt += e.results[i][0].transcript + " ";
      }
      setRawNote((prev) => (prev ? prev + " " : "") + txt.trim());
    };
    rec.onend = () => setRecognizing(false);
    rec.onerror = () => setRecognizing(false);
    rec.start();
    setRecognizing(true);
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

        <div className="grid lg:grid-cols-[280px_minmax(0,1fr)] gap-6">
          {/* Sidebar: accounts */}
          <aside className="space-y-4">
            <GlassCard className="p-3 relative">
              <div className="flex items-center gap-2 px-1 pb-2">
                <BeviMark size={16} animated={false} />
                <SignalLabel>Accounts</SignalLabel>
                <span className="ml-auto text-[10px] font-mono text-white/40">{accounts.length}</span>
              </div>
              <AccountSearch
                accounts={accounts}
                activeId={activeId}
                onSelect={setActiveId}
              />
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
          </aside>

          {/* Main column */}
          <div className="space-y-6 min-w-0">
            {/* Account memory */}
            <GlassCard className="p-5">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <div>
                  <SignalLabel>Account memory</SignalLabel>
                  <div className="text-white font-medium mt-1">
                    {active?.name ?? "Select an account"}
                    {active?.contact && <span className="text-white/50"> · {active.contact}</span>}
                  </div>
                </div>
                {memoryDirty && (
                  <button
                    onClick={handleSaveMemory}
                    className="text-xs px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/15 text-white"
                  >
                    Save memory
                  </button>
                )}
              </div>
              <textarea
                value={memoryDraft}
                onChange={(e) => {
                  setMemoryDraft(e.target.value);
                  setMemoryDirty(true);
                }}
                disabled={!active}
                placeholder="What BEVI already knows about this venue and contact. You can paste prior conversations or email context here too."
                className="w-full min-h-[110px] px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/90 placeholder-white/40 focus:outline-none focus:border-[var(--brand-cyan)] resize-y"
              />
            </GlassCard>

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
                Paste prior emails, masterfile rows, promo notes. Attached library files appear as chips.
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
                      <span className="text-white/40">· {(a.text.length / 1000).toFixed(1)}k chars</span>
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
                  className={`text-xs px-3 py-1.5 rounded-md ${
                    recognizing
                      ? "bg-[var(--signal-risk)]/20 text-[var(--signal-risk)]"
                      : "bg-white/10 text-white hover:bg-white/15"
                  }`}
                >
                  {recognizing ? "● Listening — tap to stop" : "🎙 Dictate"}
                </button>
              </div>
              <textarea
                value={rawNote}
                onChange={(e) => setRawNote(e.target.value)}
                disabled={!active}
                placeholder="Dictate or type. Messy is fine — BEVI will structure it."
                className="w-full min-h-[140px] px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[var(--brand-cyan)] resize-y"
              />
              <div className="mt-4 flex items-center gap-3 justify-end">
                {error && <span className="text-sm text-[var(--signal-risk)]">{error}</span>}
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!active || !rawNote.trim() || loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-primary-foreground disabled:opacity-40 ambient-glow"
                  style={{ background: "var(--gradient-signal)" }}
                >
                  {loading ? "Generating…" : "Generate intelligence →"}
                </button>
              </div>
            </GlassCard>

            {/* Output */}
            {output && <OutputPanel output={output} onAdoptMemory={handleAdoptMemory} onRate={handleRate} />}
          </div>
        </div>
      </div>
    </main>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-xs px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/15 text-white"
    >
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}

function OutputPanel({
  output,
  onAdoptMemory,
  onRate,
}: {
  output: AiOutput;
  onAdoptMemory: () => void;
  onRate: (r: "good" | "needs_edit") => void;
}) {
  const [rated, setRated] = useState<"good" | "needs_edit" | null>(null);

  if (output.needs_more_info) {
    return (
      <GlassCard tone="strong" className="p-6">
        <SignalLabel as="h2">Need a bit more to be useful</SignalLabel>
        <p className="text-white/80 mt-2 text-sm">
          The note is light. Answer one or two of these and BEVI will draft the full pack.
        </p>
        <ul className="mt-4 space-y-2">
          {output.clarifying_questions.map((q, i) => (
            <li key={i} className="text-sm text-white flex gap-2">
              <span style={{ color: "var(--brand-cyan)" }}>{i + 1}.</span>
              {q}
            </li>
          ))}
        </ul>
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
          <SignalLabel as="h2">Post-visit Note</SignalLabel>
          <button
            onClick={onAdoptMemory}
            className="text-xs px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/15 text-white"
          >
            Adopt as new memory
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
            <SignalLabel as="h2">Targeted deals to pitch at end of call</SignalLabel>
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
        <span className="signal-label font-sans font-bold text-lg !text-white/50 mr-2">Rate this output</span>
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

// Minimal Web Speech API types (browser-only, optional API)
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: { [index: number]: { [index: number]: { transcript: string } }; length: number };
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
  const [anchor, setAnchor] = useState<{ top: number; left: number; width: number } | null>(null);

  const active = accounts.find((a) => a.id === activeId);
  const q = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!q) return accounts.slice(0, 8);
    return accounts
      .filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.contact ?? "").toLowerCase().includes(q),
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
      if (r) setAnchor({ top: r.bottom + 6, left: r.left, width: r.width });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
      if (popRef.current?.contains(t)) return;
      setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);


  const pick = (id: string) => {
    onSelect(id);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus-within:border-[var(--brand-cyan)] transition-colors">
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
          className="w-full bg-transparent text-sm text-white placeholder-white/40 outline-none"
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

      {open && accounts.length > 0 && anchor && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popRef}
            style={{ position: "fixed", top: anchor.top, left: anchor.left, width: anchor.width, zIndex: 1000 }}
            className="max-h-72 overflow-y-auto rounded-xl border border-white/10 ring-1 ring-white/5 bg-background/95 backdrop-blur-xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)]"
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
                        i === highlight
                          ? "bg-white/8 text-white"
                          : "text-white/80 hover:bg-white/5"
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


      {active && !open && (
        <div className="mt-2 px-1 text-[11px] text-white/40">
          Active · <span className="text-white/70">{active.name}</span>
        </div>
      )}
    </div>
  );
}
