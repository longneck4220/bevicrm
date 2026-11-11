import { compareMemory } from "@/lib/memory-diff";

export function MemoryComparison({ current, proposed }: { current: string; proposed: string }) {
  const comparison = compareMemory(current, proposed);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 text-sm">
        <span className="text-signal-risk">− Removed</span>
        <span className="text-signal-positive">+ Added</span>
        {!comparison.hasChanges && <span className="text-muted-foreground">No changes</span>}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <section aria-label="Current memory comparison" className="min-w-0">
          <h3 className="mb-2 text-sm font-medium text-foreground">Current memory</h3>
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
            {current ? comparison.current.map((part, index) => part.removed ? (
              <del key={index} className="bg-signal-risk/15 text-signal-risk decoration-signal-risk">{part.value}</del>
            ) : <span key={index}>{part.value}</span>) : <span className="text-muted-foreground">No memory yet.</span>}
          </p>
        </section>
        <section aria-label="Proposed memory comparison" className="min-w-0">
          <h3 className="mb-2 text-sm font-medium text-foreground">Proposed memory</h3>
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
            {comparison.proposed.map((part, index) => part.added ? (
              <ins key={index} className="bg-signal-positive/15 text-signal-positive decoration-signal-positive">{part.value}</ins>
            ) : <span key={index}>{part.value}</span>)}
          </p>
        </section>
      </div>
    </div>
  );
}