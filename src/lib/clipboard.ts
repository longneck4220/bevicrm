// Cross-environment clipboard write. Handles: preview iframe (no
// clipboard-write permission), older Safari, and non-secure contexts.
// Returns true on success.
// Copies verbatim. Never transform the text on the way out — what the rep
// sees on screen has to be exactly what lands in the paste buffer.
export async function copyToClipboard(text: string): Promise<boolean> {
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
