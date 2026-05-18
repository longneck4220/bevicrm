// Client-side text extraction for supporting documents.
// Runs entirely in the browser; the extracted text is then sent to the server
// as part of supportingContext.

import mammoth from "mammoth";
import * as XLSX from "xlsx";

const MAX_CHARS_PER_FILE = 120_000;

function clamp(text: string): string {
  if (text.length <= MAX_CHARS_PER_FILE) return text;
  return text.slice(0, MAX_CHARS_PER_FILE) + `\n\n…[truncated ${text.length - MAX_CHARS_PER_FILE} chars]`;
}

async function extractPdf(file: File): Promise<string> {
  // Dynamic import keeps the (large) pdf.js worker out of the initial bundle.
  const pdfjs = await import("pdfjs-dist");
  // Use a CDN worker; matches the installed version.
  // @ts-expect-error - GlobalWorkerOptions exists at runtime
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((it) => ("str" in it ? (it as { str: string }).str : ""))
      .join(" ");
    pages.push(`--- Page ${i} ---\n${text}`);
  }
  return pages.join("\n\n");
}

async function extractDocx(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const res = await mammoth.extractRawText({ arrayBuffer: buf });
  return res.value;
}

async function extractSpreadsheet(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheets = wb.SheetNames.map((name) => {
    const csv = XLSX.utils.sheet_to_csv(wb.Sheets[name]);
    return `--- Sheet: ${name} ---\n${csv}`;
  });
  return sheets.join("\n\n");
}

async function extractPlainText(file: File): Promise<string> {
  return await file.text();
}

export async function extractFileText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const type = file.type;
  let text = "";
  if (type === "application/pdf" || name.endsWith(".pdf")) {
    text = await extractPdf(file);
  } else if (
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    text = await extractDocx(file);
  } else if (
    type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    type === "application/vnd.ms-excel" ||
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    name.endsWith(".csv")
  ) {
    text = await extractSpreadsheet(file);
  } else if (
    type.startsWith("text/") ||
    name.endsWith(".txt") ||
    name.endsWith(".md") ||
    name.endsWith(".json")
  ) {
    text = await extractPlainText(file);
  } else {
    throw new Error(`Unsupported file type: ${file.name}`);
  }
  return clamp(text.trim());
}

export type Attachment = { id: string; name: string; size: number; text: string };
