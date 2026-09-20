/** Minimal RFC-4180-ish CSV parser: handles quoted fields, escaped quotes ("") and commas inside quotes. */
export function parseCsv(text: string): string[][] {
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
    } else if (c === ",") {
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

export type CallNoteCsvRow = {
  rowNumber: number;
  repName: string;
  accountName: string;
  suburb: string;
  callDate: string;
  rawNote: string;
};

/** Parses the fixed 5-column call-notes CSV format, skipping a header row if present. */
export function parseCallNotesCsv(text: string): CallNoteCsvRow[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];

  const looksLikeHeader = /rep\s*name/i.test(rows[0][0] ?? "");
  const dataRows = looksLikeHeader ? rows.slice(1) : rows;

  return dataRows
    .filter((r) => r.some((cell) => cell.trim() !== ""))
    .map((r, i) => ({
      rowNumber: (looksLikeHeader ? 2 : 1) + i,
      repName: (r[0] ?? "").trim(),
      accountName: (r[1] ?? "").trim(),
      suburb: (r[2] ?? "").trim(),
      callDate: (r[3] ?? "").trim(),
      rawNote: (r[4] ?? "").trim(),
    }));
}
