import { hashPolicy } from "./hash.js";
import type { Cadence, CommitmentConfig, EvidenceSource, ProofPolicy } from "./types.js";

const DEFAULT_STAKE_ETH = "0.01";

const clampTitle = (goal: string) => goal.trim().replace(/\s+/g, " ").slice(0, 72) || "Health commitment";

const extractTarget = (goal: string, cadence: Cadence) => {
  const weeklyMatch = goal.match(/(\d+)\s*(x|times?)\s*(a|per)?\s*week/i);
  if (weeklyMatch) return Number.parseInt(weeklyMatch[1] ?? "1", 10);

  const dailyMatch = goal.match(/(\d+)\s*(x|times?)\s*(a|per)?\s*day/i);
  if (dailyMatch) return Number.parseInt(dailyMatch[1] ?? "1", 10);

  return cadence === "weekly" ? 3 : 1;
};

const inferCadence = (goal: string): Cadence => {
  if (/\b(week|weekly)\b/i.test(goal)) return "weekly";
  if (/\b(daily|every day|each day|morning|night)\b/i.test(goal)) return "daily";
  if (/\b(workout|run|gym|cardio|strength)\b/i.test(goal)) return "weekly";
  return "daily";
};

const inferSources = (goal: string): EvidenceSource[] => {
  const next = new Set<EvidenceSource>();

  if (/\b(workout|run|gym|cardio|strength|walk|steps)\b/i.test(goal)) next.add("workouts");
  if (/\b(sleep|rest|recovery|bed|oura)\b/i.test(goal)) next.add("sleep");
  if (/\b(calendar|schedule|meeting|event)\b/i.test(goal)) next.add("calendar-context");
  if (/\b(chat|conversation|journal|coach|check in with me)\b/i.test(goal)) next.add("conversation-hints");

  if (next.size === 0) {
    next.add("workouts");
    next.add("conversation-hints");
  }

  return Array.from(next);
};

const inferStake = (goal: string, targetPerWindow: number) => {
  if (/\bserious|strict|hardcore|must\b/i.test(goal)) return "0.05";
  if (targetPerWindow >= 4) return "0.03";
  if (targetPerWindow >= 2) return "0.02";
  return DEFAULT_STAKE_ETH;
};

const ethToWei = (eth: string) => {
  const [whole, fractional = ""] = eth.split(".");
  const normalizedFraction = `${fractional}000000000000000000`.slice(0, 18);
  return `${BigInt(whole || "0") * 10n ** 18n + BigInt(normalizedFraction)}`;
};

export const planCommitment = (goal: string, startAt?: string): CommitmentConfig => {
  const normalizedGoal = goal.trim();
  const cadence = inferCadence(normalizedGoal);
  const targetPerWindow = extractTarget(normalizedGoal, cadence);
  const sources = inferSources(normalizedGoal);

  const proofPolicy: ProofPolicy = {
    sources,
    deterministicSources: sources.filter(source => source !== "conversation-hints"),
    minimumDeterministicSignals: 1,
    description:
      "Deterministic signals can unlock check-ins or settlement recommendations. Conversation-derived hints remain advisory.",
  };

  const stakeEth = inferStake(normalizedGoal, targetPerWindow);
  const plan: CommitmentConfig = {
    title: clampTitle(normalizedGoal),
    goal: normalizedGoal,
    cadence,
    targetPerWindow,
    stakeEth,
    stakeWei: ethToWei(stakeEth),
    startAt: startAt ?? new Date().toISOString(),
    gracePolicy: "none",
    proofPolicy,
    proofPolicyHash: hashPolicy(proofPolicy),
  };

  return plan;
};

