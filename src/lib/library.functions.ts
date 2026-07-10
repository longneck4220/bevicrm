import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type LibraryDeal = {
  product: string;
  discount: string;
  starts_on: string | null;
  ends_on: string | null;
  eligibility: string;
  notes: string;
};

async function extractDeals(text: string, fileName: string): Promise<LibraryDeal[]> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey || !text.trim()) return [];
  const trimmed = text.length > 40_000 ? text.slice(0, 40_000) : text;
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Extract structured product / promotional deal data from beverage industry sales documents (price lists, promo decks, range cards). Return ONLY JSON: {\"deals\":[{\"product\":string,\"discount\":string,\"starts_on\":string|null,\"ends_on\":string|null,\"eligibility\":string,\"notes\":string}]}. If no clear product+discount pairs exist, return {\"deals\":[]}. Never invent products, prices, dates, or eligibility rules — only extract what is literally in the document. starts_on / ends_on should be ISO date YYYY-MM-DD when possible, otherwise the raw phrase, otherwise null.",
          },
          { role: "user", content: `File: ${fileName}\n\n---\n${trimmed}` },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!resp.ok) {
      console.error("[deal extract] gateway", resp.status, (await resp.text()).slice(0, 500));
      return [];
    }
    const payload = await resp.json();
    const content: string = payload?.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content);
    const arr = Array.isArray(parsed?.deals) ? parsed.deals : [];
    return arr
      .filter((d: unknown): d is Record<string, unknown> => !!d && typeof d === "object")
      .map((d: Record<string, unknown>) => ({
        product: String(d.product ?? "").slice(0, 300),
        discount: String(d.discount ?? "").slice(0, 300),
        starts_on: d.starts_on == null ? null : String(d.starts_on).slice(0, 60),
        ends_on: d.ends_on == null ? null : String(d.ends_on).slice(0, 60),
        eligibility: String(d.eligibility ?? "").slice(0, 500),
        notes: String(d.notes ?? "").slice(0, 500),
      }))
      .filter((d: LibraryDeal) => d.product && d.discount)
      .slice(0, 100);
  } catch (e) {
    console.error("[deal extract] failed", fileName, e);
    return [];
  }
}



const MAX_BYTES = 20 * 1024 * 1024;
const MAX_CHARS = 120_000;

export type LibraryFileType = "pdf" | "xlsx" | "pptx" | "docx" | "image" | "other";

export type LibraryFile = {
  id: string;
  account_id: string | null;
  name: string;
  file_type: LibraryFileType;
  size_bytes: number;
  mime_type: string;
  created_at: string;
  has_text: boolean;
};

function detectType(name: string, mime: string): LibraryFileType {
  const n = name.toLowerCase();
  if (mime === "application/pdf" || n.endsWith(".pdf")) return "pdf";
  if (
    mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mime === "application/vnd.ms-excel" ||
    n.endsWith(".xlsx") || n.endsWith(".xls") || n.endsWith(".csv")
  ) return "xlsx";
  if (
    mime === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    n.endsWith(".pptx")
  ) return "pptx";
  if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    n.endsWith(".docx")
  ) return "docx";
  if (
    mime.startsWith("image/") ||
    n.endsWith(".png") ||
    n.endsWith(".jpg") ||
    n.endsWith(".jpeg") ||
    n.endsWith(".webp") ||
    n.endsWith(".gif") ||
    n.endsWith(".heic") ||
    n.endsWith(".heif") ||
    n.endsWith(".bmp")
  ) return "image";
  return "other";
}

function clamp(s: string): string {
  s = s.trim();
  return s.length <= MAX_CHARS ? s : s.slice(0, MAX_CHARS) + `\n\n…[truncated ${s.length - MAX_CHARS} chars]`;
}

function noTextFallback(name: string, type: LibraryFileType): string {
  if (type === "image") {
    return [
      `Image uploaded: ${name}`,
      "File type: IMAGE",
      "This image is available in the file library, but BEVI has not extracted visible text from it. Ask the rep to paste any important sales data, pricing, or account detail before relying on the image.",
    ].join("\n");
  }

  return [
    `File uploaded but no text was extracted: ${name}`,
    `File type: ${type.toUpperCase()}`,
    "Use the file name as context only. Ask the rep to paste the relevant text, pricing, product list, deal mechanics, or customer detail before relying on this document.",
  ].join("\n");
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function extract(bytes: Uint8Array, type: LibraryFileType, name: string): Promise<string> {
  try {
    if (type === "image") return "";
    if (type === "pdf") {
      const { extractText, getDocumentProxy } = await import("unpdf");
      const doc = await getDocumentProxy(bytes);
      const { text } = await extractText(doc, { mergePages: true });
      return clamp(typeof text === "string" ? text : (text as string[]).join("\n\n"));
    }
    if (type === "docx") {
      const mammoth = await import("mammoth");
      const ab = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(ab).set(bytes);
      const res = await mammoth.extractRawText({ arrayBuffer: ab });
      return clamp(res.value ?? "");
    }
    if (type === "xlsx") {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(bytes, { type: "array" });
      const sheets = wb.SheetNames.map((sn) => {
        const csv = XLSX.utils.sheet_to_csv(wb.Sheets[sn]);
        return `--- Sheet: ${sn} ---\n${csv}`;
      });
      return clamp(sheets.join("\n\n"));
    }
    if (type === "pptx") {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(bytes);
      const slideFiles = Object.keys(zip.files)
        .filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))
        .sort((a, b) => {
          const na = parseInt(a.match(/slide(\d+)/)?.[1] ?? "0", 10);
          const nb = parseInt(b.match(/slide(\d+)/)?.[1] ?? "0", 10);
          return na - nb;
        });
      const parts: string[] = [];
      for (let i = 0; i < slideFiles.length; i++) {
        const xml = await zip.files[slideFiles[i]].async("string");
        const matches = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) ?? [];
        const text = matches.map((m) => m.replace(/<[^>]+>/g, "")).join(" ");
        parts.push(`--- Slide ${i + 1} ---\n${text}`);
      }
      return clamp(parts.join("\n\n"));
    }
    // plain text fallback
    return clamp(new TextDecoder().decode(bytes));
  } catch (e) {
    console.error("[library extract]", name, e);
    return ""; // store row even if extraction fails; user can re-upload
  }
}

const UploadInput = z.object({
  name: z.string().min(1).max(255),
  mime: z.string().max(200).default(""),
  base64: z.string().min(1).max(28_000_000),
  accountId: z.string().uuid().nullable().optional(),
});

export const uploadLibraryFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => UploadInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const bytes = b64ToBytes(data.base64);
    if (bytes.byteLength === 0) throw new Error("Empty file.");
    if (bytes.byteLength > MAX_BYTES) throw new Error("File is over 20 MB.");

    const type = detectType(data.name, data.mime);
    const ext = data.name.includes(".") ? data.name.split(".").pop()! : "bin";
    const fileId = crypto.randomUUID();
    const storagePath = `${userId}/${fileId}.${ext}`;

    if (data.accountId) {
      const { data: account, error: accountErr } = await supabase
        .from("accounts")
        .select("id")
        .eq("id", data.accountId)
        .maybeSingle();
      if (accountErr || !account) {
        throw new Error("Account not found.");
      }
    }

    const { error: upErr } = await supabase.storage
      .from("library")
      .upload(storagePath, bytes, {
        contentType: data.mime || "application/octet-stream",
        upsert: false,
      });
    if (upErr) {
      console.error("[library upload]", upErr);
      throw new Error("Could not store the file. Please try again.");
    }

    const extractedText = await extract(bytes, type, data.name);
    const text = extractedText.trim() ? extractedText : noTextFallback(data.name, type);
    const deals = await extractDeals(extractedText, data.name);

    const { data: row, error: insErr } = await supabase
      .from("library_files")
      .insert({
        id: fileId,
        owner_id: userId,
        account_id: data.accountId ?? null,
        name: data.name,
        file_type: type as never,
        storage_path: storagePath,
        size_bytes: bytes.byteLength,
        mime_type: data.mime || "",
        extracted_text: text,
        deals: deals as never,
      })
      .select("id, account_id, name, file_type, size_bytes, mime_type, created_at, extracted_text")
      .single();
    if (insErr || !row) {
      console.error("[library insert]", insErr);
      await supabase.storage.from("library").remove([storagePath]);
      throw new Error("Could not save file record. Please try again.");
    }

    const dto: LibraryFile = {
      id: row.id,
      account_id: row.account_id,
      name: row.name,
      file_type: row.file_type as LibraryFileType,
      size_bytes: row.size_bytes,
      mime_type: row.mime_type,
      created_at: row.created_at,
      has_text: (row.extracted_text ?? "").length > 0,
    };
    return dto;
  });

const ListInput = z.object({
  type: z.enum(["pdf", "xlsx", "pptx", "docx", "image", "other", "all"]).optional().default("all"),
  accountId: z.string().uuid().nullable().optional(),
  search: z.string().max(200).optional().default(""),
});

export const listLibraryFiles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ListInput.parse(d ?? {}))
  .handler(async ({ data, context }): Promise<LibraryFile[]> => {
    let q = context.supabase
      .from("library_files")
      .select("id, account_id, name, file_type, size_bytes, mime_type, created_at, extracted_text")
      .order("created_at", { ascending: false })
      .limit(500);
    if (data.type !== "all") q = q.eq("file_type", data.type as never);
    if (data.accountId) q = q.or(`account_id.is.null,account_id.eq.${data.accountId}`);
    if (data.search) q = q.ilike("name", `%${data.search}%`);
    const { data: rows, error } = await q;
    if (error) {
      console.error("[library list]", error);
      throw new Error("Could not load library.");
    }
    return (rows ?? []).map((r) => ({
      id: r.id,
      account_id: r.account_id,
      name: r.name,
      file_type: r.file_type as LibraryFileType,
      size_bytes: r.size_bytes,
      mime_type: r.mime_type,
      created_at: r.created_at,
      has_text: (r.extracted_text ?? "").length > 0,
    }));
  });

export const getLibraryFileText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("library_files")
      .select("id, name, file_type, extracted_text")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !row) throw new Error("File not found.");
    const type = row.file_type as LibraryFileType;
    return { id: row.id, name: row.name, text: (row.extracted_text ?? "").trim() || noTextFallback(row.name, type) };
  });

export const deleteLibraryFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error: getErr } = await context.supabase
      .from("library_files")
      .select("owner_id, storage_path")
      .eq("id", data.id)
      .maybeSingle();
    if (getErr || !row) throw new Error("File not found.");
    if (row.owner_id !== context.userId) {
      throw new Error("Only the file owner can delete this file.");
    }
    await context.supabase.storage.from("library").remove([row.storage_path]);
    const { error: delErr } = await context.supabase.from("library_files").delete().eq("id", data.id);
    if (delErr) {
      console.error("[library delete]", delErr);
      throw new Error("Could not delete file.");
    }
    return { ok: true };
  });
