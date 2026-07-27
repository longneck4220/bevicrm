import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "list_accounts",
  title: "List accounts",
  description:
    "List the signed-in user's BEVI accounts (venues), optionally filtered by a name search.",
  inputSchema: {
    search: z.string().optional().describe("Optional case-insensitive account name filter."),
    limit: z.number().int().optional().describe("Maximum accounts to return (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");
    let query = supabaseForUser(ctx)
      .from("accounts")
      .select("id, name, contact, updated_at")
      .order("updated_at", { ascending: false })
      .limit(Math.min(limit ?? 25, 100));
    if (search) query = query.ilike("name", `%${search}%`);
    const { data, error } = await query;
    return error ? errorResult(error.message) : textResult(data ?? []);
  },
});
