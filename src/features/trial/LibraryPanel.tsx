import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { GlassCard, SignalLabel } from "@/features/shared/primitives";
import {
  uploadLibraryFile,
  listLibraryFiles,
  getLibraryFileText,
  deleteLibraryFile,
  type LibraryFile,
  type LibraryFileType,
} from "@/lib/library.functions";

const TYPE_TABS: { id: "all" | LibraryFileType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pdf", label: "PDF" },
  { id: "xlsx", label: "Excel" },
  { id: "pptx", label: "PPTX" },
  { id: "docx", label: "Word" },
];

const TYPE_TONE: Record<LibraryFileType, string> = {
  pdf: "var(--signal-risk)",
  xlsx: "var(--signal-positive)",
  pptx: "var(--brand-violet)",
  docx: "var(--brand-cyan)",
  other: "var(--brand-blue)",
};

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  // Chunk to avoid call stack overflow on large files
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

export function LibraryPanel({
  activeAccountId,
  activeAccountName,
  onAttach,
}: {
  activeAccountId: string | null;
  activeAccountName: string | null;
  onAttach: (file: { id: string; name: string; text: string }) => void;
}) {
  const upload = useServerFn(uploadLibraryFile);
  const list = useServerFn(listLibraryFiles);
  const getText = useServerFn(getLibraryFileText);
  const del = useServerFn(deleteLibraryFile);

  const [files, setFiles] = useState<LibraryFile[]>([]);
  const [type, setType] = useState<"all" | LibraryFileType>("all");
  const [search, setSearch] = useState("");
  const [pinToAccount, setPinToAccount] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachingId, setAttachingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    try {
      const rows = await list({ data: { type, accountId: activeAccountId ?? null, search } });
      setFiles(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load library.");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, activeAccountId]);

  // debounced search
  useEffect(() => {
    const t = setTimeout(refresh, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: files.length };
    for (const f of files) c[f.file_type] = (c[f.file_type] ?? 0) + 1;
    return c;
  }, [files]);

  async function handleFiles(picked: FileList | null) {
    if (!picked || picked.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(picked)) {
        if (file.size > 20 * 1024 * 1024) {
          setError(`${file.name} is over 20 MB — skipped.`);
          continue;
        }
        const base64 = await fileToBase64(file);
        await upload({
          data: {
            name: file.name,
            mime: file.type,
            base64,
            accountId: pinToAccount ? activeAccountId : null,
          },
        });
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleAttach(f: LibraryFile) {
    setAttachingId(f.id);
    try {
      const { text } = await getText({ data: { id: f.id } });
      if (!text) {
        setError(`${f.name} has no extracted text yet.`);
        return;
      }
      onAttach({ id: f.id, name: f.name, text });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not attach file.");
    } finally {
      setAttachingId(null);
    }
  }

  async function handleDelete(f: LibraryFile) {
    if (!confirm(`Delete "${f.name}" from your library?`)) return;
    try {
      await del({ data: { id: f.id } });
      setFiles((prev) => prev.filter((x) => x.id !== f.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete file.");
    }
  }

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <SignalLabel>File library</SignalLabel>
          <p className="text-xs text-white/50 mt-1">
            One-tap attach. PDFs · Excel · PPTX · Word — parsed on the server.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.xlsx,.xls,.csv,.pptx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,text/*"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={uploading}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="text-xs px-3 py-1.5 rounded-md text-primary-foreground disabled:opacity-40"
            style={{ background: "var(--gradient-signal)" }}
          >
            {uploading ? "Uploading…" : "＋ Upload"}
          </button>
        </div>
      </div>

      {/* type chips */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {TYPE_TABS.map((t) => {
          const active = t.id === type;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setType(t.id)}
              className={`text-[11px] font-mono uppercase tracking-[0.14em] px-2.5 py-1 rounded-md transition-colors ${
                active
                  ? "bg-white/15 text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90"
              }`}
            >
              {t.label}
              <span className="ml-1.5 text-white/40">{counts[t.id] ?? 0}</span>
            </button>
          );
        })}
      </div>

      {/* search + scope */}
      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 focus-within:border-[var(--brand-cyan)]">
          <svg className="h-3.5 w-3.5 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files…"
            className="w-full bg-transparent text-sm text-white placeholder-white/40 outline-none"
          />
        </div>
        {activeAccountId && (
          <label className="flex items-center gap-1.5 text-[11px] text-white/60 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={pinToAccount}
              onChange={(e) => setPinToAccount(e.target.checked)}
              className="accent-[var(--brand-cyan)]"
            />
            Pin upload to {activeAccountName ? `"${activeAccountName}"` : "account"}
          </label>
        )}
      </div>

      {/* list */}
      <ul className="mt-3 max-h-72 overflow-y-auto divide-y divide-white/5 rounded-lg border border-white/10">
        {files.length === 0 ? (
          <li className="px-3 py-6 text-center text-xs text-white/50">
            No files {type !== "all" && `of type ${type.toUpperCase()}`} yet. Upload one above.
          </li>
        ) : (
          files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 px-3 py-2 hover:bg-white/[0.03]">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  background: TYPE_TONE[f.file_type],
                  boxShadow: `0 0 10px ${TYPE_TONE[f.file_type]}`,
                }}
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-white truncate font-medium">{f.name}</div>
                <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-white/40 truncate">
                  {f.file_type} · {(f.size_bytes / 1024).toFixed(0)} KB
                  {f.account_id ? " · pinned" : " · global"}
                  {!f.has_text && " · no text"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleAttach(f)}
                disabled={attachingId === f.id || !f.has_text}
                className="text-[11px] px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/15 text-white disabled:opacity-40"
              >
                {attachingId === f.id ? "…" : "Attach"}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(f)}
                className="text-white/40 hover:text-[var(--signal-risk)] text-sm px-1"
                aria-label={`Delete ${f.name}`}
              >
                ×
              </button>
            </li>
          ))
        )}
      </ul>

      {error && <div className="mt-3 text-xs text-[var(--signal-risk)]">{error}</div>}
    </GlassCard>
  );
}
