import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "list_visits",
  title: "List recent visits",
  description:
    "List the signed-in user's most recent logged visits across all accounts, newest first.",
  inputSchema: {
    account_id: z.string().optional().describe("Optional account UUID to filter by."),
    limit: z.number().int().optional().describe("Maximum visits to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ account_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");
    let query = supabaseForUser(ctx)
      .from("visits")
      .select("id, account_id, created_at, rating, raw_note, ai_output")
      .order("created_at", { ascending: false })
      .limit(Math.min(limit ?? 20, 100));
    if (account_id) query = query.eq("account_id", account_id);
    const { data, error } = await query;
    return error ? errorResult(error.message) : textResult(data ?? []);
  },
});
