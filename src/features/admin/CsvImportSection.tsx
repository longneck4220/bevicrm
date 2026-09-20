import { useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { UploadCloud } from "lucide-react";
import { GlassCard, SignalLabel } from "@/features/shared/primitives";
import {
  importCallNotes,
  generateMemoryDrafts,
  type ImportCallNotesResult,
} from "@/lib/admin.functions";
import { parseCallNotesCsv, type CallNoteCsvRow } from "@/lib/csv";

const BATCH_SIZE = 25;

type Step = "upload" | "preview" | "importing" | "summarizing" | "done";

export function CsvImportSection() {
  const importFn = useServerFn(importCallNotes);
  const draftsFn = useServerFn(generateMemoryDrafts);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [dragOver, setDragOver] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<CallNoteCsvRow[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<ImportCallNotesResult | null>(null);
  const [touchedAccountCount, setTouchedAccountCount] = useState(0);
  const [draftsGenerated, setDraftsGenerated] = useState<number | null>(null);

  const repNames = useMemo(() => [...new Set(rows.map((r) => r.repName).filter(Boolean))], [rows]);

  function loadFile(file: File) {
    setParseError(null);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setParseError("Please choose a .csv file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseCallNotesCsv(String(reader.result ?? ""));
      if (parsed.length === 0) {
        setParseError("No rows found in that file.");
        return;
      }
      setFileName(file.name);
      setRows(parsed);
      setStep("preview");
    };
    reader.onerror = () => setParseError("Could not read that file.");
    reader.readAsText(file);
  }

  function reset() {
    setStep("upload");
    setFileName(null);
    setRows([]);
    setParseError(null);
    setResult(null);
    setProgress({ done: 0, total: 0 });
    setTouchedAccountCount(0);
    setDraftsGenerated(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function runImport() {
    setStep("importing");
    setProgress({ done: 0, total: rows.length });
    const merged: ImportCallNotesResult = {
      imported: 0,
      accountsCreated: [],
      accountsMatched: 0,
      failed: [],
      accountIds: [],
    };
    const accountIds = new Set<string>();
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      try {
        const res = await importFn({ data: { rows: batch } });
        merged.imported += res.imported;
        merged.accountsCreated.push(...res.accountsCreated);
        merged.accountsMatched += res.accountsMatched;
        merged.failed.push(...res.failed);
        res.accountIds.forEach((id) => accountIds.add(id));
      } catch (e) {
        merged.failed.push(
          ...batch.map((b) => ({
            row: b.rowNumber,
            reason: e instanceof Error ? e.message : "Import request failed",
          })),
        );
      }
      setProgress({ done: Math.min(i + BATCH_SIZE, rows.length), total: rows.length });
    }
    merged.accountIds = [...accountIds];
    setResult(merged);

    if (merged.accountIds.length > 0) {
      setTouchedAccountCount(merged.accountIds.length);
      setStep("summarizing");
      try {
        const draftRes = await draftsFn({ data: { accountIds: merged.accountIds } });
        setDraftsGenerated(draftRes.draftsGenerated);
      } catch {
        setDraftsGenerated(0);
      }
    }
    setStep("done");
  }

  return (
    <GlassCard className="p-5 mb-6">
      <SignalLabel>Import call notes</SignalLabel>
      <p className="mt-1 text-sm text-white/60">
        Load historical call notes from a CSV export. Notes are stored as-is — no AI processing runs
        at import time.
      </p>

      <div className="mt-4">
        {step === "upload" && (
          <UploadStep
            dragOver={dragOver}
            setDragOver={setDragOver}
            onFile={loadFile}
            error={parseError}
            fileInputRef={fileInputRef}
          />
        )}
        {step === "preview" && fileName && (
          <PreviewStep
            fileName={fileName}
            rows={rows}
            repNames={repNames}
            onCancel={reset}
            onImport={runImport}
          />
        )}
        {step === "importing" && <ImportingStep progress={progress} />}
        {step === "summarizing" && <SummarizingStep accountCount={touchedAccountCount} />}
        {step === "done" && result && (
          <DoneStep result={result} draftsGenerated={draftsGenerated} onDone={reset} />
        )}
      </div>
    </GlassCard>
  );
}

function UploadStep({
  dragOver,
  setDragOver,
  onFile,
  error,
  fileInputRef,
}: {
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  onFile: (file: File) => void;
  error: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) onFile(file);
        }}
        className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          dragOver ? "border-[var(--brand-cyan)] bg-[var(--brand-cyan)]/5" : "border-white/15"
        }`}
      >
        <UploadCloud className="h-8 w-8 text-white/40" />
        <div className="text-sm text-white/70">Drag and drop a CSV file here, or</div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-white/85 hover:bg-white/5"
        >
          Choose file
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
          }}
        />
      </div>

      {error && <p className="mt-3 text-sm text-[var(--signal-risk)]">{error}</p>}

      <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-white/60">
        <div className="mb-1 font-mono uppercase tracking-[0.14em] text-white/40">
          Expected columns (in this order)
        </div>
        Rep Name · Account Name · Suburb · Call Date (DD/MM/YYYY) · Call Notes
      </div>
      <p className="mt-2 text-xs text-[var(--signal-risk)]">
        Importing the same file twice will create duplicate entries. Check before uploading.
      </p>
    </div>
  );
}

function PreviewStep({
  fileName,
  rows,
  repNames,
  onCancel,
  onImport,
}: {
  fileName: string;
  rows: CallNoteCsvRow[];
  repNames: string[];
  onCancel: () => void;
  onImport: () => void;
}) {
  const preview = rows.slice(0, 5);
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm text-white/70">
        <span className="truncate">{fileName}</span>
        <span className="shrink-0 text-white/50">
          {rows.length} row{rows.length === 1 ? "" : "s"} detected
        </span>
      </div>

      <div className="mt-3 overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-left text-xs">
          <thead className="bg-white/[0.04] font-mono uppercase tracking-[0.1em] text-white/50">
            <tr>
              <th className="px-3 py-2">Rep Name</th>
              <th className="px-3 py-2">Account Name</th>
              <th className="px-3 py-2">Suburb</th>
              <th className="px-3 py-2">Call Date</th>
              <th className="px-3 py-2">Call Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {preview.map((r) => (
              <tr key={r.rowNumber}>
                <td className="px-3 py-2 text-white/85">{r.repName}</td>
                <td className="px-3 py-2 text-white/85">{r.accountName}</td>
                <td className="px-3 py-2 text-white/70">{r.suburb || "—"}</td>
                <td className="px-3 py-2 text-white/70">{r.callDate}</td>
                <td className="max-w-xs truncate px-3 py-2 text-white/70">{r.rawNote}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-white/50">
        <span className="text-white/70">Reps found in file:</span> {repNames.join(", ")}
      </p>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={onCancel}
          className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/85 hover:bg-white/5"
        >
          Cancel
        </button>
        <button
          onClick={onImport}
          className="rounded-lg px-4 py-2 text-sm font-medium text-primary-foreground"
          style={{ background: "var(--gradient-signal)" }}
        >
          Import {rows.length} notes
        </button>
      </div>
    </div>
  );
}

function ImportingStep({ progress }: { progress: { done: number; total: number } }) {
  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
  const current = Math.min(progress.done + 1, progress.total);
  return (
    <div>
      <div className="text-sm text-white/70">
        Importing row {current} of {progress.total}…
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${pct}%`, background: "var(--gradient-signal)" }}
        />
      </div>
    </div>
  );
}

function SummarizingStep({ accountCount }: { accountCount: number }) {
  return (
    <div className="flex items-center gap-3 text-sm text-white/70">
      <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/20 border-t-[var(--brand-cyan)]" />
      Generating memory drafts for {accountCount} account{accountCount === 1 ? "" : "s"}…
    </div>
  );
}

function DoneStep({
  result,
  draftsGenerated,
  onDone,
}: {
  result: ImportCallNotesResult;
  draftsGenerated: number | null;
  onDone: () => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Notes imported" value={result.imported} />
        <Stat label="Accounts created" value={result.accountsCreated.length} />
        <Stat label="Accounts matched" value={result.accountsMatched} />
        <Stat label="Rows skipped" value={result.failed.length} risky={result.failed.length > 0} />
      </div>

      {draftsGenerated !== null && (
        <p className="mt-4 text-sm text-[var(--brand-cyan)]">
          {draftsGenerated} memory draft{draftsGenerated === 1 ? "" : "s"} ready for rep review.
        </p>
      )}

      <div className="mt-4 text-sm">
        <div className="text-white/70">New accounts:</div>
        <div className="mt-1 text-white/50">
          {result.accountsCreated.length === 0
            ? "None — all matched existing records."
            : result.accountsCreated.join(", ")}
        </div>
      </div>

      {result.failed.length > 0 && (
        <div className="mt-4">
          <div className="text-sm text-white/70">Rows skipped or failed:</div>
          <ul className="mt-1 space-y-1 text-xs text-[var(--signal-risk)]">
            {result.failed.map((f) => (
              <li key={f.row}>
                Row {f.row}: {f.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={onDone}
        className="mt-5 rounded-lg px-4 py-2 text-sm font-medium text-primary-foreground"
        style={{ background: "var(--gradient-signal)" }}
      >
        Done
      </button>
    </div>
  );
}

function Stat({ label, value, risky }: { label: string; value: number; risky?: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div
        className="text-2xl font-semibold text-white"
        style={risky && value > 0 ? { color: "var(--signal-risk)" } : undefined}
      >
        {value}
      </div>
      <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.12em] text-white/40">
        {label}
      </div>
    </div>
  );
}
