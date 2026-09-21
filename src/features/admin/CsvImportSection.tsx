import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { GlassCard, SignalLabel } from "@/features/shared/primitives";
import {
  importCallNotes,
  generateMemoryDrafts,
  type ImportCallNotesResult,
} from "@/lib/admin.functions";
import { parseCallNotesCsv, rowsToCallNotes, type CallNoteCsvRow } from "@/lib/csv";

const BATCH_SIZE = 25;

type Step = "upload" | "preview" | "importing" | "summarizing" | "done";

/** "Ryan Pearce FY25 calls.csv" -> "Ryan Pearce" is good enough as a fallback. */
function repFromFileName(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
}

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
  const missingDates = useMemo(() => rows.filter((r) => !r.callDate).length, [rows]);
  const missingReps = useMemo(() => rows.filter((r) => !r.repName).length, [rows]);

  // Typed once in the preview step and applied to every row that has no rep of
  // its own when the import runs.
  const [repOverride, setRepOverride] = useState("");

  async function loadFile(file: File) {
    setParseError(null);
    const lower = file.name.toLowerCase();
    const isExcel = lower.endsWith(".xlsx") || lower.endsWith(".xls");
    const isText =
      lower.endsWith(".csv") || lower.endsWith(".tsv") || lower.endsWith(".txt") || !isExcel;

    try {
      let parsed: CallNoteCsvRow[] = [];

      if (isExcel) {
        // One sheet per rep: the tab name becomes the rep for every row on it.
        const XLSX = await import("xlsx");
        const wb = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: "array" });
        for (const sheetName of wb.SheetNames ?? []) {
          const sheet = wb.Sheets?.[sheetName];
          if (!sheet) continue;
          const table = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
            header: 1,
            raw: false,
            defval: "",
          });
          const cells = (table ?? []).map((r) =>
            Array.isArray(r) ? r.map((c) => (c === null || c === undefined ? "" : String(c))) : [],
          );
          parsed.push(
            ...rowsToCallNotes(cells, { repName: sheetName.trim() }).map((r, i) => ({
              ...r,
              rowNumber: parsed.length + i + 1,
            })),
          );
        }
      } else if (isText) {
        const text = await file.text();
        parsed = parseCallNotesCsv(text, repFromFileName(file.name));
      }

      if (parsed.length === 0) {
        setParseError(
          isExcel
            ? "No call notes found in that workbook. Each tab needs a date column, an outlet column and a notes column."
            : "No call notes found in that file.",
        );
        return;
      }
      setFileName(file.name);
      setRows(parsed);
      setStep("preview");
    } catch (e) {
      console.error("[call notes import] failed to read file", e);
      setParseError(
        `Could not read that file (${e instanceof Error ? e.message : "unknown error"}). Try saving it as CSV or Excel and upload again.`,
      );
    }
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
      skipped: 0,
      accountsCreated: [],
      accountsMatched: 0,
      failed: [],
      accountIds: [],
    };
    const accountIds = new Set<string>();
    const fallbackRep = repOverride.trim();
    const allRows = rows.map((r) => (r.repName ? r : { ...r, repName: fallbackRep }));
    for (let i = 0; i < allRows.length; i += BATCH_SIZE) {
      const batch = allRows.slice(i, i + BATCH_SIZE);
      try {
        const res = await importFn({ data: { rows: batch } });
        merged.imported += res.imported;
        merged.skipped += res.skipped;
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

    if (merged.failed.length > 0 && merged.imported === 0) {
      toast.error("Upload finished with errors — nothing was saved.");
    } else if (merged.failed.length > 0) {
      toast.warning(
        `Upload finished — ${merged.imported} note${merged.imported === 1 ? "" : "s"} saved, ${merged.failed.length} row${merged.failed.length === 1 ? "" : "s"} failed.`,
      );
    } else {
      toast.success(
        `Upload complete — ${merged.imported} note${merged.imported === 1 ? "" : "s"} saved${
          merged.skipped > 0 ? `, ${merged.skipped} already on file` : ""
        }.`,
      );
    }
  }

  return (
    <GlassCard className="p-5 mb-6">
      <SignalLabel>Import call notes</SignalLabel>
      <p className="mt-1 text-sm text-white/60">
        Load historical call notes from a CSV or Excel export, in whatever column order they come
        in. Notes are stored as-is — no AI processing runs at import time.
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
            missingDates={missingDates}
            missingReps={missingReps}
            repName={repOverride}
            onRepName={setRepOverride}
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
          accept=".csv,.tsv,.txt,.xlsx,.xls"
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
          What the file can look like
        </div>
        Columns are matched by their heading, in any order. A heading like
        “Outlet Name &amp; Suburb” is split into the outlet and its suburb. Dates in any common
        format are read automatically. In an Excel file, each tab is treated as one rep and the tab
        name becomes the rep — otherwise the file name is used, and you can correct it in the next
        step.
      </div>
      <p className="mt-2 text-xs text-white/60">
        Safe to re-upload — a note already on file for the same outlet and date is skipped, so top-up
        files only add what's new.
      </p>
    </div>
  );
}

function PreviewStep({
  fileName,
  rows,
  repNames,
  missingDates,
  missingReps,
  repName,
  onRepName,
  onCancel,
  onImport,
}: {
  fileName: string;
  rows: CallNoteCsvRow[];
  repNames: string[];
  missingDates: number;
  missingReps: number;
  repName: string;
  onRepName: (name: string) => void;
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
                <td className="px-3 py-2 text-white/70">{r.callDate || "—"}</td>
                <td className="max-w-xs truncate px-3 py-2 text-white/70">{r.rawNote}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-white/50">
        <span className="text-white/70">Reps found in file:</span>{" "}
        {repNames.length > 0 ? repNames.join(", ") : "none — set one below"}
      </p>

      {missingReps > 0 && (
        <div className="mt-3">
          <label
            htmlFor="import-rep-name"
            className="block font-mono text-[10px] uppercase tracking-[0.12em] text-white/40"
          >
            Rep name for {missingReps} row{missingReps === 1 ? "" : "s"} without one
          </label>
          <input
            id="import-rep-name"
            type="text"
            placeholder="e.g. Ryan Pearce"
            value={repName}
            onChange={(e) => onRepName(e.target.value)}
            className="mt-1 w-full max-w-xs rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white/90 outline-none focus:border-[var(--brand-cyan)]"
          />
        </div>
      )}

      {missingDates > 0 && (
        <p className="mt-3 text-xs text-white/50">
          {missingDates} row{missingDates === 1 ? "" : "s"} had no readable date — the notes will
          still be imported, just without one.
        </p>
      )}


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
  const ok = result.failed.length === 0;
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  return (
    <div ref={ref}>
      <div
        role="status"
        aria-live="polite"
        className="mb-4 flex items-start gap-3 rounded-lg border p-4"
        style={{
          borderColor: ok
            ? "color-mix(in oklab, var(--signal-positive) 40%, transparent)"
            : "color-mix(in oklab, var(--signal-warning) 40%, transparent)",
          background: ok
            ? "color-mix(in oklab, var(--signal-positive) 10%, transparent)"
            : "color-mix(in oklab, var(--signal-warning) 10%, transparent)",
        }}
      >
        <CheckCircle2
          className="mt-0.5 h-5 w-5 shrink-0"
          style={{ color: ok ? "var(--signal-positive)" : "var(--signal-warning)" }}
        />
        <div>
          <div className="text-sm font-semibold text-white">
            {ok ? "Upload complete" : "Upload finished with some problems"}
          </div>
          <div className="mt-1 text-sm text-white/70">
            {result.imported} note{result.imported === 1 ? "" : "s"} saved
            {result.skipped > 0
              ? ` · ${result.skipped} already on file and skipped`
              : ""}
            {result.failed.length > 0 ? ` · ${result.failed.length} row(s) failed` : ""}.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="Notes imported" value={result.imported} />
        <Stat label="Already on file" value={result.skipped} />
        <Stat label="Accounts created" value={result.accountsCreated.length} />
        <Stat label="Accounts matched" value={result.accountsMatched} />
        <Stat label="Rows failed" value={result.failed.length} risky={result.failed.length > 0} />
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
