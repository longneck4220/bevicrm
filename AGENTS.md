# Architecture rules

- Keep the password-recovery route outside signed-out-only layouts so the recovery session cannot redirect away from the password form.
- Compare imported memory drafts in the browser using a shared text-diff helper; keep adoption on the existing authenticated save/history path so no AI prompt or ownership rules change.
