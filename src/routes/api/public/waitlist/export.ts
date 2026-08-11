import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "node:crypto";

function csvCell(v: string | null) {
  const s = (v ?? "").replace(/"/g, '""');
  return `"${s}"`;
}

export const Route = createFileRoute("/api/public/waitlist/export")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const expected = process.env["WAITLIST_EXPORT_TOKEN"];
        if (!expected) return new Response("Not configured", { status: 503 });

        const url = new URL(request.url);
        const provided = request.headers.get("x-waitlist-token") ?? url.searchParams.get("token") ?? "";
        const a = Buffer.from(provided);
        const b = Buffer.from(expected);
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("waitlist_signups")
          .select("email, source, referrer, utm, created_at")
          .order("created_at", { ascending: false });
        if (error) return new Response("Export failed", { status: 500 });

        const rows = [
          "email,source,referrer,utm,created_at",
          ...(data ?? []).map((r) =>
            [r.email, r.source, r.referrer, r.utm, r.created_at].map((c) => csvCell(c)).join(","),
          ),
        ].join("\n");

        return new Response(rows, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Cache-Control": "no-store",
            "Content-Disposition": 'attachment; filename="bevi-waitlist.csv"',
          },
        });
      },
    },
  },
});
