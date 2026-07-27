import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "log_visit",
  title: "Log a visit note",
  description:
    "Save a raw post-visit note against an account. Intelligence generation happens in the BEVI app.",
  inputSchema: {
    account_id: z.string().describe("The account UUID the visit belongs to."),
    raw_note: z.string().describe("The raw post-visit note text."),
    supporting_context: z.string().optional().describe("Any extra supporting context."),
    rating: z.string().optional().describe("Optional visit rating / sentiment label."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ account_id, raw_note, supporting_context, rating }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Not authenticated");
    const { data, error } = await supabaseForUser(ctx)
      .from("visits")
      .insert({
        owner_id: ctx.getUserId()!,
        account_id,
        raw_note: raw_note.trim(),
        supporting_context: supporting_context?.trim() ?? "",
        rating: rating?.trim() || null,
      })
      .select("id, account_id, created_at")
      .single();
    return error ? errorResult(error.message) : textResult(data);
  },
});
