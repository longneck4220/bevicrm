import { diffWordsWithSpace } from "diff";

/** Compare exact text, including whitespace, without interpreting paraphrases as facts. */
export function compareMemory(current: string, proposed: string) {
  const changes = diffWordsWithSpace(current, proposed);
  return {
    current: changes.filter((change) => !change.added),
    proposed: changes.filter((change) => !change.removed),
    hasChanges: changes.some((change) => change.added || change.removed),
  };
}

export function hasImportedMemoryDraft(draft: string | null) {
  return Boolean(draft?.trim());
}