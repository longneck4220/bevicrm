/** Minimal RFC-4180-ish CSV parser: handles quoted fields, escaped quotes ("") and commas inside quotes. */
export function parseCsv(text: string, delimiter = ","): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

/** Picks the delimiter that appears most often on the first non-empty line. */
function detectDelimiter(text: string): string {
  const line = text.split(/\r?\n/).find((l) => l.trim() !== "") ?? "";
  const counts: [string, number][] = [",", "\t", ";", "|"].map((d) => [
    d,
    line.split(d).length - 1,
  ]);
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : ",";
}

export type CallNoteCsvRow = {
  rowNumber: number;
  repName: string;
  accountName: string;
  suburb: string;
  /** Normalised to DD/MM/YYYY, or "" when the source cell was unreadable. */
  callDate: string;
  rawNote: string;
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

type ColumnKind = "date" | "outlet" | "suburb" | "note" | "rep" | null;

function classify(header: string): ColumnKind {
  const h = norm(header);
  if (!h) return null;
  if (h.includes("date")) return "date";
  if (h.includes("note") || h.includes("comment") || h.includes("summary")) return "note";
  if (h.includes("rep") || h.includes("salesperson") || h.includes("bdm")) return "rep";
  const outlettish =
    h.includes("outlet") ||
    h.includes("account") ||
    h.includes("venue") ||
    h.includes("customer") ||
    h.includes("store");
  // "Outlet Name & Suburb" is one combined column — treat it as the outlet and
  // split the suburb back out of the cell value.
  if (outlettish) return "outlet";
  if (h.includes("suburb") || h.includes("location") || h.includes("area") || h.includes("town"))
    return "suburb";
  return null;
}

/** Drops a trailing phone number, e.g. "GPO Hotel / FORTITUDE VALLEY - 07  5526 9222". */
function stripTrailingPhone(value: string): string {
  return value.replace(/[\s,–—-]*(?:\+?\d[\d\s()-]{6,})$/, "").trim();
}

/**
 * Splits a combined outlet cell into name + suburb. Handles
 * "Otto, Fortitude Valley", "Otto - Fortitude Valley" and
 * "GPO Hotel / FORTITUDE VALLEY - 07  5526 9222".
 */
export function splitOutlet(value: string): { accountName: string; suburb: string } {
  const v = stripTrailingPhone(value.trim());
  // A slash is the strongest signal — take the last one as the suburb boundary.
  const slash = v.lastIndexOf("/");
  if (slash > 0) {
    const name = v.slice(0, slash).trim();
    const suburb = v.slice(slash + 1).trim();
    if (name && suburb) return { accountName: name, suburb };
  }
  const m = /^(.*?)[\s]*[,–—-][\s]*([^,–—-]+)$/.exec(v);
  if (m && m[1].trim() && m[2].trim()) {
    return { accountName: m[1].trim(), suburb: m[2].trim() };
  }
  return { accountName: v, suburb: "" };
}

const MONTHS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

/** Accepts DD/MM/YYYY, D-M-YY, YYYY-MM-DD, "12 Sep 2025", "Sep 12 2025" and Excel serial numbers. */
export function normaliseDate(raw: string): string {
  const v = raw.trim();
  if (!v) return "";

  // Excel serial (days since 1899-12-30)
  if (/^\d{5}(\.\d+)?$/.test(v)) {
    const ms = Date.UTC(1899, 11, 30) + Number(v) * 86_400_000;
    const d = new Date(ms);
    return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
  }

  // ISO first: YYYY-MM-DD
  let m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(v);
  if (m) return `${pad(Number(m[3]))}/${pad(Number(m[2]))}/${m[1]}`;

  // D/M/Y (day first — Australian format)
  m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/.exec(v);
  if (m) {
    let year = Number(m[3]);
    if (year < 100) year += year > 70 ? 1900 : 2000;
    return `${pad(Number(m[1]))}/${pad(Number(m[2]))}/${year}`;
  }

  // 12 Sep 2025 / 12-Sep-25
  m = /^(\d{1,2})[\s-]*([A-Za-z]{3,})[\s-]*(\d{2,4})/.exec(v);
  if (m) {
    const mo = MONTHS.indexOf(m[2].slice(0, 3).toLowerCase());
    if (mo >= 0) {
      let year = Number(m[3]);
      if (year < 100) year += year > 70 ? 1900 : 2000;
      return `${pad(Number(m[1]))}/${pad(mo + 1)}/${year}`;
    }
  }

  // Sep 12, 2025
  m = /^([A-Za-z]{3,})[\s-]*(\d{1,2})[\s,-]+(\d{2,4})/.exec(v);
  if (m) {
    const mo = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase());
    if (mo >= 0) {
      let year = Number(m[3]);
      if (year < 100) year += year > 70 ? 1900 : 2000;
      return `${pad(Number(m[2]))}/${pad(mo + 1)}/${year}`;
    }
  }

  const fallback = new Date(v);
  if (!Number.isNaN(fallback.getTime())) {
    return `${pad(fallback.getUTCDate())}/${pad(fallback.getUTCMonth() + 1)}/${fallback.getUTCFullYear()}`;
  }
  return "";
}

/**
 * Turns a table of cells into call-note rows without demanding an exact column
 * order. Headers are matched by meaning (date / outlet / suburb / notes / rep);
 * "Outlet Name & Suburb" is split into two fields. When a header row is absent
 * the columns are guessed from the cell contents instead.
 */
export function rowsToCallNotes(
  table: string[][],
  options: { repName?: string; startRow?: number } = {},
): CallNoteCsvRow[] {
  if (table.length === 0) return [];

  const headerCandidate = table[0] ?? [];
  const kinds = headerCandidate.map(classify);
  const hasHeader = kinds.filter(Boolean).length >= 2;

  let dateCol = -1;
  let outletCol = -1;
  let suburbCol = -1;
  let noteCol = -1;
  let repCol = -1;

  if (hasHeader) {
    kinds.forEach((k, i) => {
      if (k === "date" && dateCol < 0) dateCol = i;
      else if (k === "outlet" && outletCol < 0) outletCol = i;
      else if (k === "suburb" && suburbCol < 0) suburbCol = i;
      else if (k === "note" && noteCol < 0) noteCol = i;
      else if (k === "rep" && repCol < 0) repCol = i;
    });
  } else {
    // No usable header: infer from the first data row — the date-looking cell is
    // the date, the longest cell is the note, the remaining one the outlet.
    const sample = table.find((r) => r.some((c) => c.trim() !== "")) ?? [];
    sample.forEach((cell, i) => {
      if (dateCol < 0 && normaliseDate(cell)) dateCol = i;
    });
    let longest = -1;
    sample.forEach((cell, i) => {
      if (i !== dateCol && cell.trim().length > longest) {
        longest = cell.trim().length;
        noteCol = i;
      }
    });
    outletCol = sample.findIndex((_, i) => i !== dateCol && i !== noteCol);
  }

  if (noteCol < 0) {
    // Still nothing: take the widest column across the whole table.
    const widths = new Map<number, number>();
    for (const r of table) {
      r.forEach((c, i) => widths.set(i, Math.max(widths.get(i) ?? 0, c.trim().length)));
    }
    noteCol = [...widths.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? -1;
  }

  const body = hasHeader ? table.slice(1) : table;
  const offset = (options.startRow ?? 1) + (hasHeader ? 1 : 0);

  const out: CallNoteCsvRow[] = [];
  body.forEach((r, i) => {
    const cell = (idx: number) => (idx >= 0 ? (r[idx] ?? "").trim() : "");
    const note = cell(noteCol);
    const outletRaw = cell(outletCol);
    if (!note && !outletRaw) return;

    const split = splitOutlet(outletRaw);
    const suburbCell = cell(suburbCol);
    out.push({
      rowNumber: offset + i,
      repName: cell(repCol) || options.repName || "",
      accountName: split.accountName,
      suburb: suburbCell || split.suburb,
      callDate: normaliseDate(cell(dateCol)),
      rawNote: note,
    });
  });
  return out;
}

/** Parses a call-notes CSV/TSV file, tolerating column order and header wording. */
export function parseCallNotesCsv(text: string, repName?: string): CallNoteCsvRow[] {
  const clean = text.replace(/^\uFEFF/, "");
  const table = parseCsv(clean, detectDelimiter(clean));
  return rowsToCallNotes(table, { repName });
}
