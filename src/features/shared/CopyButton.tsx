import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/clipboard";

export function CopyButton({ text }: { text: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <div className="flex shrink-0 flex-col items-end">
      <Button
        type="button"
        variant="secondary"
        className="min-h-11 min-w-20"
        onClick={async () => {
          const ok = await copyToClipboard(text);
          setStatus(ok ? "copied" : "failed");
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => setStatus("idle"), 1800);
        }}
      >
        {status === "copied" ? "Copied ✓" : "Copy"}
      </Button>
      <span role="status" className="max-w-40 text-right text-xs text-muted-foreground">
        {status === "failed" ? "Couldn't copy — select manually" : ""}
      </span>
    </div>
  );
}