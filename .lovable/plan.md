Protect the current main branch while keeping the Homepage V2 work as a reversible experiment.

Current state
- The project has two local branches: `main` (untouched) and the active edit branch `edit/edt-fec6ae0b-8819-4003-8e41-815a26bda334`.
- The V2 homepage rebuild is committed only on the edit branch (`fc21ac1 Rebuilt homepage V2 marketing`). `main` does not contain this commit.
- The user is worried V2 will overwrite the current look/schema before they are ready.

Plan
1. Verify the branch boundary
   - Run a diff between `main` and the edit branch to produce a precise list of files changed by V2.
   - Confirm that no app routes (Dashboard, Mobile, Login, Command Center, /try logic) or backend schema files are in the diff.
2. Preserve main
   - Document the current `main` HEAD commit hash for the user.
   - Explain that returning to `main` restores the pre-V2 marketing look immediately.
3. Make V2 reversible without merging
   - Keep the edit branch as the V2 experiment branch.
   - Do not merge or fast-forward `main` until the user explicitly asks.
   - Offer a revert path via Lovable's built-in History tab / chat revert button.
4. Optional preview isolation (if the user wants)
   - Create a short-lived published preview from the edit branch so they can share V2 without affecting the live published site on `main`.
   - No backend/schema migrations are part of V2, so there is no database risk.

Outcome
- The user can keep working on V2 safely, knowing `main` still holds the current live look and schema.
- No accidental takeover of the current site.
- Clear rollback instructions if they decide not to ship V2.