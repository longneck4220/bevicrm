import logoSrc from "@/assets/bevi-logo.png";

/**
 * BEVI brandmark — uses the rendered reference image as the logo.
 * Keeps the same API (`size`, `animated`) so all existing usages work unchanged.
 */
export function BeviMark({ size = 40, animated = true }: { size?: number; animated?: boolean }) {
  void animated;
  return (
    <img
      src={logoSrc}
      alt="BEVI ambient sales intelligence"
      height={size}
      style={{ height: size, width: "auto", display: "block" }}
      draggable={false}
    />
  );
}
