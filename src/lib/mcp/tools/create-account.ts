import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "create_account",
  title: "Create account",
  description: "Create a new BEVI account (venue) owned by the signed-in user.",
  inputSchema: {
    name: z.string().describe("Venue / account name."),
    contact: z.string().optional().describe("Primary contact name at the venue."),
    memory: z.string().optional().describe("Initial account memory / background context."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ name, contact, memory }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");
    const { data, error } = await supabaseForUser(ctx)
      .from("accounts")
      .insert({
        owner_id: ctx.getUserId()!,
        name: name.trim(),
        contact: contact?.trim() || null,
        memory: memory?.trim() ?? "",
      })
      .select("id, name, contact, memory")
      .single();
    return error ? errorResult(error.message) : textResult(data);
  },
});
