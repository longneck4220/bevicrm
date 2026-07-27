import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listAccounts from "./tools/list-accounts";
import getAccount from "./tools/get-account";
import listVisits from "./tools/list-visits";
import createAccount from "./tools/create-account";
import logVisit from "./tools/log-visit";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "bevi-mcp",
  title: "BEVI",
  version: "0.1.0",
  instructions:
    "Post-visit field intelligence for BEVI. Use list_accounts to find a venue, get_account for its rolling memory and recent visits, list_visits for the activity log, create_account to add a venue, and log_visit to save a new post-visit note. All data is scoped to the signed-in BEVI user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listAccounts, getAccount, listVisits, createAccount, logVisit],
});
