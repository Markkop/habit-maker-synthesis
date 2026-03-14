import { createHash, randomUUID } from "node:crypto";
import type {
  AgentRecommendation,
  CommitmentConfig,
  CommitmentStateInput,
  EvidenceSnapshot,
  EvidenceSource,
  PreparedAction,
} from "./types.js";

const hashPolicy = (value: unknown): `0x${string}` =>
  `0x${createHash("sha256").update(JSON.stringify(value)).digest("hex")}`;

const DEFAULT_STAKE_ETH = "0.01";

const clampTitle = (goal: string) =>
  goal.trim().replace(/\s+/g, " ").slice(0, 72) || "Health commitment";

const inferCadence = (goal: string) => {
  if (/\b(week|weekly)\b/i.test(goal)) return "weekly" as const;
  if (/\b(daily|every day|each day|morning|night)\b/i.test(goal)) return "daily" as const;
  if (/\b(workout|run|gym|cardio|strength)\b/i.test(goal)) return "weekly" as const;
  return "daily" as const;
};

const extractTarget = (goal: string, cadence: CommitmentConfig["cadence"]) => {
  const weeklyMatch = goal.match(/(\d+)\s*(x|times?)\s*(a|per)?\s*week/i);
  if (weeklyMatch) return Number.parseInt(weeklyMatch[1] ?? "1", 10);

  const dailyMatch = goal.match(/(\d+)\s*(x|times?)\s*(a|per)?\s*day/i);
  if (dailyMatch) return Number.parseInt(dailyMatch[1] ?? "1", 10);

  return cadence === "weekly" ? 3 : 1;
};

const inferSources = (goal: string): EvidenceSource[] => {
  const next = new Set<EvidenceSource>();

  if (/\b(workout|run|gym|cardio|strength|walk|steps)\b/i.test(goal)) next.add("workouts");
  if (/\b(sleep|rest|recovery|bed|oura)\b/i.test(goal)) next.add("sleep");
  if (/\b(calendar|schedule|meeting|event)\b/i.test(goal)) next.add("calendar-context");
  if (/\b(chat|conversation|journal|coach|check in with me)\b/i.test(goal))
    next.add("conversation-hints");

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

  const proofPolicy = {
    sources,
    deterministicSources: sources.filter((source) => source !== "conversation-hints"),
    minimumDeterministicSignals: 1,
    description:
      "Deterministic signals can unlock check-ins or settlement recommendations. Conversation-derived hints remain advisory.",
  };

  const stakeEth = inferStake(normalizedGoal, targetPerWindow);
  return {
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
};

const DEFAULTS: Record<
  EvidenceSource,
  { observedValue: string; unit: string; deterministic: boolean; notes: string }
> = {
  workouts: {
    observedValue: "completed workout",
    unit: "session",
    deterministic: true,
    notes: "Mocked from a workout or fitness API.",
  },
  sleep: {
    observedValue: "8.1",
    unit: "hours",
    deterministic: true,
    notes: "Mocked from a sleep or readiness API.",
  },
  "calendar-context": {
    observedValue: "blocked health event",
    unit: "event",
    deterministic: true,
    notes: "Mocked from calendar and schedule context.",
  },
  "conversation-hints": {
    observedValue: "user reported strong intent",
    unit: "hint",
    deterministic: false,
    notes: "Mocked from conversational inference.",
  },
};

export const createMockEvidence = (input: {
  source: EvidenceSource;
  observedValue?: string;
  unit?: string;
  meetsPolicy?: boolean;
  deterministic?: boolean;
  confidence?: number;
  rawReference?: string;
  notes?: string;
  windowStart?: string;
  windowEnd?: string;
}): EvidenceSnapshot => {
  const defaults = DEFAULTS[input.source];
  const now = new Date();
  return {
    id: randomUUID(),
    source: input.source,
    windowStart: input.windowStart ?? now.toISOString(),
    windowEnd: input.windowEnd ?? new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    observedValue: input.observedValue ?? defaults.observedValue,
    unit: input.unit ?? defaults.unit,
    meetsPolicy: input.meetsPolicy ?? true,
    deterministic: input.deterministic ?? defaults.deterministic,
    confidence: input.confidence ?? (defaults.deterministic ? 0.88 : 0.55),
    rawReference: input.rawReference ?? `mock://${input.source}/${now.getTime()}`,
    notes: input.notes ?? defaults.notes,
    createdAt: now.toISOString(),
  };
};

const isExpired = (windowEnd?: string) =>
  windowEnd ? Date.now() >= new Date(windowEnd).getTime() : false;

const getPreparedAction = (
  action: PreparedAction["action"],
  explanation: string,
  input: { contractAddress?: string; commitmentId?: number; plan?: CommitmentConfig },
): PreparedAction => {
  if (action === "create_commitment") {
    const plan = input.plan;
    if (!plan) return { action, args: [], value: "0", explanation };

    return {
      action,
      contractAddress: input.contractAddress,
      functionName: "createCommitment",
      args: [
        plan.title,
        plan.cadence === "daily" ? 0 : 1,
        plan.targetPerWindow,
        Math.floor(new Date(plan.startAt).getTime() / 1000),
        plan.proofPolicyHash,
      ],
      value: plan.stakeWei,
      explanation,
    };
  }

  if (action === "record_check_in") {
    return {
      action,
      contractAddress: input.contractAddress,
      functionName: "recordCheckIn",
      args: [input.commitmentId ?? 0],
      value: "0",
      explanation,
    };
  }

  if (action === "settle_success") {
    return {
      action,
      contractAddress: input.contractAddress,
      functionName: "settleSuccess",
      args: [input.commitmentId ?? 0],
      value: "0",
      explanation,
    };
  }

  if (action === "settle_failure") {
    return {
      action,
      contractAddress: input.contractAddress,
      functionName: "settleFailure",
      args: [input.commitmentId ?? 0],
      value: "0",
      explanation,
    };
  }

  return { action, args: [], value: "0", explanation };
};

export const recommendAction = (input: {
  plan: CommitmentConfig;
  snapshots: EvidenceSnapshot[];
  commitmentState?: CommitmentStateInput;
  contractAddress?: string;
}): AgentRecommendation => {
  const deterministic = input.snapshots.filter((snapshot) => snapshot.deterministic);
  const positive = deterministic.filter((snapshot) => snapshot.meetsPolicy);
  const negative = deterministic.filter((snapshot) => !snapshot.meetsPolicy);
  const checkInCount = input.commitmentState?.checkInCount ?? 0;
  const target = input.commitmentState?.targetPerWindow ?? input.plan.targetPerWindow;
  const expired = isExpired(input.commitmentState?.windowEnd);

  if (expired && positive.length >= target) {
    const reason =
      "The window ended and deterministic evidence meets the target. Settle the commitment as successful.";
    return {
      action: "settle_success",
      reason,
      confidence: 0.92,
      requiresUserSignature: true,
      supportingEvidenceIds: positive.map((snapshot) => snapshot.id),
      preparedAction: getPreparedAction("settle_success", reason, {
        contractAddress: input.contractAddress,
        commitmentId: input.commitmentState?.commitmentId,
      }),
    };
  }

  if (expired && positive.length < target) {
    const reason =
      "The window ended without enough deterministic evidence. Settle the commitment as failed.";
    return {
      action: "settle_failure",
      reason,
      confidence: negative.length > 0 ? 0.9 : 0.78,
      requiresUserSignature: true,
      supportingEvidenceIds: deterministic.map((snapshot) => snapshot.id),
      preparedAction: getPreparedAction("settle_failure", reason, {
        contractAddress: input.contractAddress,
        commitmentId: input.commitmentState?.commitmentId,
      }),
    };
  }

  if (positive.length > checkInCount) {
    const reason =
      "A deterministic signal supports progress in the active window. Record a check-in onchain.";
    return {
      action: "record_check_in",
      reason,
      confidence: 0.86,
      requiresUserSignature: true,
      supportingEvidenceIds: positive.map((snapshot) => snapshot.id),
      preparedAction: getPreparedAction("record_check_in", reason, {
        contractAddress: input.contractAddress,
        commitmentId: input.commitmentState?.commitmentId,
      }),
    };
  }

  const reason =
    input.snapshots.length === 0
      ? "No evidence has been provided yet. Wait for a signal or add a mock evidence snapshot."
      : "The current evidence is not strong enough to justify a new onchain action yet.";

  return {
    action: "no_action",
    reason,
    confidence: input.snapshots.length === 0 ? 0.8 : 0.64,
    requiresUserSignature: false,
    supportingEvidenceIds: input.snapshots.map((snapshot) => snapshot.id),
  };
};

export const prepareAction = (input: {
  action: PreparedAction["action"];
  contractAddress?: string;
  commitmentId?: number;
  plan?: CommitmentConfig;
}): PreparedAction =>
  getPreparedAction(input.action, "Prepared contract call for the selected action.", {
    contractAddress: input.contractAddress,
    commitmentId: input.commitmentId,
    plan: input.plan,
  });
