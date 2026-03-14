import type {
  AgentRecommendation,
  CommitmentConfig,
  CommitmentStateInput,
  EvidenceSnapshot,
  PreparedAction,
} from "./types.js";

const isExpired = (windowEnd?: string) => (windowEnd ? Date.now() >= new Date(windowEnd).getTime() : false);

const getPreparedAction = (
  action: PreparedAction["action"],
  explanation: string,
  input: {
    contractAddress?: string;
    commitmentId?: number;
    plan?: CommitmentConfig;
  },
): PreparedAction => {
  if (action === "create_commitment") {
    const plan = input.plan;
    if (!plan) {
      return { action, args: [], value: "0", explanation };
    }

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
  const deterministic = input.snapshots.filter(snapshot => snapshot.deterministic);
  const positive = deterministic.filter(snapshot => snapshot.meetsPolicy);
  const negative = deterministic.filter(snapshot => !snapshot.meetsPolicy);
  const checkInCount = input.commitmentState?.checkInCount ?? 0;
  const target = input.commitmentState?.targetPerWindow ?? input.plan.targetPerWindow;
  const expired = isExpired(input.commitmentState?.windowEnd);

  if (expired && positive.length >= target) {
    const reason = "The window ended and deterministic evidence meets the target. Settle the commitment as successful.";
    return {
      action: "settle_success",
      reason,
      confidence: 0.92,
      requiresUserSignature: true,
      supportingEvidenceIds: positive.map(snapshot => snapshot.id),
      preparedAction: getPreparedAction("settle_success", reason, {
        contractAddress: input.contractAddress,
        commitmentId: input.commitmentState?.commitmentId,
      }),
    };
  }

  if (expired && positive.length < target) {
    const reason = "The window ended without enough deterministic evidence. Settle the commitment as failed.";
    return {
      action: "settle_failure",
      reason,
      confidence: negative.length > 0 ? 0.9 : 0.78,
      requiresUserSignature: true,
      supportingEvidenceIds: deterministic.map(snapshot => snapshot.id),
      preparedAction: getPreparedAction("settle_failure", reason, {
        contractAddress: input.contractAddress,
        commitmentId: input.commitmentState?.commitmentId,
      }),
    };
  }

  if (positive.length > checkInCount) {
    const reason = "A deterministic signal supports progress in the active window. Record a check-in onchain.";
    return {
      action: "record_check_in",
      reason,
      confidence: 0.86,
      requiresUserSignature: true,
      supportingEvidenceIds: positive.map(snapshot => snapshot.id),
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
    supportingEvidenceIds: input.snapshots.map(snapshot => snapshot.id),
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

