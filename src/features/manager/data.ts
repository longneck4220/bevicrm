export type Status = "red" | "amber" | "green";

// BEVI's own signal tokens (styles.css), not ad-hoc hex — keeps this section
// in step with the same red/amber/green used everywhere else in the app.
export const STATUS_COLOR: Record<Status, string> = {
  red: "var(--signal-risk)",
  amber: "var(--signal-warning)",
  green: "var(--signal-positive)",
};

export type Rings = {
  volume: number; // 0..1 call volume
  quality: number; // 0..1 note quality
  progression: number; // 0..1 account progression
};
