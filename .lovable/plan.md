## Fix: File Upload Payload Lacks Size Cap Before Decode

Add an upper bound to the `base64` field in `UploadInput` so oversized payloads are rejected by Zod before any `atob()` decode / `Uint8Array` allocation runs.

### Change

**`src/lib/library.functions.ts`** (line 105):

```ts
// before
base64: z.string().min(1),

// after
base64: z.string().min(1).max(28_000_000), // ~20 MB binary -> ~27 MB base64
```

The existing 20 MB post-decode byte check remains as a second layer.

### After applying

Mark the `agent_security` / `base64_no_maxlen` finding as fixed.
