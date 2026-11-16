// Copies text verbatim: what the rep sees on screen is exactly what lands in
// the paste buffer. Never transform the text.
//
// On iPhone and iPad, copy through a text selection (the same mechanism as
// long-press → Copy). Copied text starts with "Subject:" or "Contact:", which
// iOS can read as a link; apps like Messages then paste the percent-encoded
// link (%20, %0A) instead of the plain text.
export async function copyToClipboard(text: string): Promise<boolean> {
  if (isAppleTouchDevice() && copyViaSelection(text)) return true;
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through: blocked in iframes without clipboard-write permission.
  }
  return copyViaSelection(text);
}

function isAppleTouchDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

// Must run synchronously inside the tap handler, before any await, or iOS
// refuses the copy.
function copyViaSelection(text: string): boolean {
  if (typeof document === "undefined") return false;
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.setAttribute("aria-hidden", "true");
  ta.style.position = "fixed";
  ta.style.top = "0";
  ta.style.left = "0";
  ta.style.opacity = "0";
  ta.style.fontSize = "16px"; // smaller text makes iOS zoom the page on focus
  document.body.appendChild(ta);
  let ok = false;
  try {
    ta.select();
    ta.setSelectionRange(0, text.length);
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);
  window.getSelection()?.removeAllRanges();
  return ok;
}
