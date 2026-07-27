import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "get_account",
  title: "Get account with memory",
  description:
    "Fetch one BEVI account including its rolling account memory and most recent visit notes.",
  inputSchema: {
    account_id: z.string().describe("The account UUID, as returned by list_accounts."),
    visits: z.number().int().optional().describe("How many recent visits to include (default 5)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ account_id, visits }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");
    const supabase = supabaseForUser(ctx);
    const { data: account, error } = await supabase
      .from("accounts")
      .select("id, name, contact, memory, created_at, updated_at")
      .eq("id", account_id)
      .maybeSingle();
    if (error) return errorResult(error.message);
    if (!account) return errorResult("Account not found");

    const { data: recent, error: visitError } = await supabase
      .from("visits")
      .select("id, created_at, rating, raw_note, ai_output")
      .eq("account_id", account_id)
      .order("created_at", { ascending: false })
      .limit(Math.min(visits ?? 5, 20));
    if (visitError) return errorResult(visitError.message);

    return textResult({ account, recent_visits: recent ?? [] });
  },
});
