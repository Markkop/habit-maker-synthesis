export type Cadence = "daily" | "weekly";
export type EvidenceSource = "workouts" | "sleep" | "calendar-context" | "conversation-hints";
export type AgentAction =
  | "no_action"
  | "create_commitment"
  | "record_check_in"
  | "settle_success"
  | "settle_failure";

export type CommitmentConfig = {
  title: string;
  goal: string;
  cadence: Cadence;
  targetPerWindow: number;
  stakeEth: string;
  stakeWei: string;
  startAt: string;
  gracePolicy: "none";
  proofPolicy: {
    sources: EvidenceSource[];
    deterministicSources: EvidenceSource[];
    minimumDeterministicSignals: number;
    description: string;
  };
  proofPolicyHash: `0x${string}`;
};

export type EvidenceSnapshot = {
  id: string;
  source: EvidenceSource;
  windowStart: string;
  windowEnd: string;
  observedValue: string;
  unit?: string;
  meetsPolicy: boolean;
  deterministic: boolean;
  confidence: number;
  rawReference: string;
  notes?: string;
  createdAt: string;
};

export type PreparedAction = {
  action: AgentAction;
  contractAddress?: string;
  functionName?: "createCommitment" | "recordCheckIn" | "settleSuccess" | "settleFailure";
  args: readonly unknown[];
  value: string;
  explanation: string;
};

export type AgentRecommendation = {
  action: AgentAction;
  reason: string;
  confidence: number;
  requiresUserSignature: boolean;
  supportingEvidenceIds: string[];
  preparedAction?: PreparedAction;
};

export type CommitmentReadModel = {
  owner: string;
  title: string;
  stakeAmount: bigint;
  cadence: number;
  targetPerWindow: number;
  windowStart: bigint;
  windowEnd: bigint;
  status: number;
  checkInCount: number;
  proofPolicyHash: string;
};

export type WindowStateReadModel = {
  windowStart: bigint;
  windowEnd: bigint;
  windowOpen: boolean;
  windowExpired: boolean;
  targetMet: boolean;
  remainingCheckIns: number;
};

