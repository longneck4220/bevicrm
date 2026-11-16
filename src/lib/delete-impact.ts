// Wording for the counts shown in delete dialogs.
function plural(
  count: number,
  singular: string,
  pluralWord = `${singular}s`,
): string {
  return `${count} ${count === 1 ? singular : pluralWord}`;
}

/** Turns counts into dialog lines, leaving out anything that is zero. */
export function impactLines(counts: {
  venues?: number;
  visits: number;
  memoryVersions: number;
  pinnedFiles?: number;
  files?: number;
}): string[] {
  const lines: string[] = [];
  if (counts.venues) lines.push(plural(counts.venues, "venue"));
  if (counts.visits) lines.push(plural(counts.visits, "visit"));
  if (counts.memoryVersions)
    lines.push(plural(counts.memoryVersions, "account memory version"));
  if (counts.pinnedFiles)
    lines.push(
      plural(
        counts.pinnedFiles,
        "file pinned to this venue",
        "files pinned to this venue",
      ),
    );
  if (counts.files) lines.push(plural(counts.files, "library file"));
  return lines;
}
