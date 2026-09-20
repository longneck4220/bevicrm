import type { AiOutput } from "./trial.functions";

/**
 * Shared "how risky/how is this trending" logic. Every page that reads an
 * account's visit history — the dashboard, the pre-visit briefing, and the
 * manager team overview — used to compute this independently with three
 * near-identical copies of the same thresholds. Change the definition once,
 * here, and it applies everywhere.
 */

export type RiskLevel = "low" | "medium" | "high";
export type Momentum = "accelerating" | "steady" | "stalling";

const POSTURE_RANK: Record<string, number> = { Push: 4, Recommend: 3, Suggest: 2, Hold: 1 };

/** Risk from a single visit's AI output: 2+ flags is high, 1 is medium, 0 (or no output) is low. */
export function riskFromOutput(output: AiOutput | null | undefined): RiskLevel {
  const flags = output?.commercial_signals?.risk_flags?.length ?? 0;
  if (flags >= 2) return "high";
  if (flags === 1) return "medium";
  return "low";
}

/** Rank used to compare two visits' commercial posture — higher means more ready to push. */
export function postureScore(output: AiOutput | null | undefined): number {
  return POSTURE_RANK[output?.next_best_move?.commercial_posture ?? ""] ?? 0;
}

/**
 * Momentum from the trend between the last two visits' posture.
 * `previous`/`latest` may be omitted (e.g. fewer than two visits logged yet),
 * in which case momentum defaults to "steady" — there's nothing to trend on.
 */
export function momentumFromTrend(
  previous: AiOutput | null | undefined,
  latest: AiOutput | null | undefined,
): Momentum {
  if (!previous || !latest) return "steady";
  const prevScore = postureScore(previous);
  const latestScore = postureScore(latest);
  if (latestScore > prevScore) return "accelerating";
  if (latestScore < prevScore) return "stalling";
  return "steady";
}
