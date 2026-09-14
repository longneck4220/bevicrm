// Cross-environment clipboard write. Handles: preview iframe (no
// clipboard-write permission), older Safari, and non-secure contexts.
// Returns true on success.
// Copies verbatim. Never transform the text on the way out — what the rep
// sees on screen has to be exactly what lands in the paste buffer.
export async function copyToClipboard(text: string): Promise<boolean> {
  // Path 0: write an explicit text/plain flavour. On iPadOS/Safari a plain
  // writeText of text that starts with or contains URL-ish fragments can be
  // re-typed by the receiving app as a link, which is what produces %20 in
  // place of spaces when pasted. Declaring text/plain up front prevents that.
  try {
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard?.write &&
      typeof ClipboardItem !== "undefined"
    ) {
      const item = new ClipboardItem({
        "text/plain": new Blob([text], { type: "text/plain" }),
      });
      await navigator.clipboard.write([item]);
      return true;
    }
  } catch {
    // fall through
  }
  // Path 1: modern async clipboard API. Rejects silently in iframes lacking
  // the clipboard-write permission, so we fall through on any failure.
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through
  }
  // Path 2: legacy execCommand fallback via a hidden textarea. Works in
  // iframes and older Safari where the async API is blocked.
  try {
    if (typeof document === "undefined") return false;
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "0";
    ta.style.left = "0";
    ta.style.opacity = "0";
    ta.style.pointerEvents = "none";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
