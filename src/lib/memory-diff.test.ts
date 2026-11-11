/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { compareMemory, hasImportedMemoryDraft } from "./memory-diff";

describe("imported memory review", () => {
  test("shows a pending imported update even when current memory exists", () => {
    expect(hasImportedMemoryDraft("New call: buyer requested a tasting.")).toBe(true);
    expect(hasImportedMemoryDraft("   ")).toBe(false);
    expect(hasImportedMemoryDraft(null)).toBe(false);
  });

  test("marks removed detail and preserves the full previous text", () => {
    const current = "Buyer is Jo. No discount authority.\nOrder every Friday.";
    const diff = compareMemory(current, "Buyer is Jo.\nOrder every Friday.");
    expect(diff.current.filter((part) => part.removed).map((part) => part.value).join("")).toContain("No discount authority.");
    expect(diff.current.map((part) => part.value).join("")).toBe(current);
  });

  test("marks added detail and preserves the full proposed text", () => {
    const proposed = "Buyer is Jo. Tasting booked Tuesday.";
    const diff = compareMemory("Buyer is Jo.", proposed);
    expect(diff.proposed.filter((part) => part.added).map((part) => part.value).join("")).toContain("Tasting booked Tuesday.");
    expect(diff.proposed.map((part) => part.value).join("")).toBe(proposed);
  });

  test("unchanged text has no additions or removals", () => {
    expect(compareMemory("No volume push.", "No volume push.").hasChanges).toBe(false);
  });
});