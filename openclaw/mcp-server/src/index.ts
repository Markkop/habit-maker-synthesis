import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { planCommitment, createMockEvidence, recommendAction, prepareAction } from "../../lib/agent-core.js";
import { readCommitment, readWindowState } from "../../lib/onchain-reader.js";
import type { CommitmentConfig, CommitmentStateInput, EvidenceSnapshot } from "../../lib/types.js";

const server = new McpServer({
  name: "habit-maker-tools",
  version: "0.1.0",
});

server.tool(
  "plan_commitment",
  "Turn a freeform health goal into a structured commitment plan with cadence, target, stake, and proof policy",
  {
    goal: z.string().describe("The user's health goal in plain language"),
    startAt: z.string().optional().describe("ISO 8601 start time (defaults to now)"),
  },
  async ({ goal, startAt }) => {
    const plan = planCommitment(goal, startAt);
    return { content: [{ type: "text", text: JSON.stringify(plan, null, 2) }] };
  },
);

server.tool(
  "create_mock_evidence",
  "Create a mock evidence snapshot for testing. Supported sources: workouts, sleep, calendar-context, conversation-hints",
  {
    source: z.enum(["workouts", "sleep", "calendar-context", "conversation-hints"]),
    observedValue: z.string().optional(),
    unit: z.string().optional(),
    meetsPolicy: z.boolean().optional().describe("Whether this evidence meets the proof policy"),
    deterministic: z.boolean().optional().describe("Whether this is deterministic evidence"),
    confidence: z.number().min(0).max(1).optional(),
    rawReference: z.string().optional(),
    notes: z.string().optional(),
    windowStart: z.string().optional(),
    windowEnd: z.string().optional(),
  },
  async (input) => {
    const snapshot = createMockEvidence(input);
    return { content: [{ type: "text", text: JSON.stringify(snapshot, null, 2) }] };
  },
);

server.tool(
  "recommend_action",
  "Evaluate evidence against a commitment plan and recommend the next onchain action (check-in, settle, or no action)",
  {
    plan: z.any().describe("The CommitmentConfig object from plan_commitment"),
    snapshots: z.array(z.any()).optional().describe("Array of EvidenceSnapshot objects"),
    commitmentState: z.object({
      commitmentId: z.number().optional(),
      checkInCount: z.number().optional(),
      targetPerWindow: z.number().optional(),
      windowStart: z.string().optional(),
      windowEnd: z.string().optional(),
      status: z.enum(["active", "completed", "failed"]).optional(),
    }).optional().describe("Current onchain commitment state"),
    contractAddress: z.string().optional(),
  },
  async ({ plan, snapshots, commitmentState, contractAddress }) => {
    const recommendation = recommendAction({
      plan: plan as CommitmentConfig,
      snapshots: (snapshots ?? []) as EvidenceSnapshot[],
      commitmentState: commitmentState as CommitmentStateInput | undefined,
      contractAddress,
    });
    return { content: [{ type: "text", text: JSON.stringify(recommendation, null, 2) }] };
  },
);

server.tool(
  "prepare_action",
  "Prepare unsigned contract calldata for a specific action (create_commitment, record_check_in, settle_success, settle_failure)",
  {
    action: z.enum(["create_commitment", "record_check_in", "settle_success", "settle_failure", "no_action"]),
    contractAddress: z.string().optional(),
    commitmentId: z.number().optional(),
    plan: z.any().optional().describe("CommitmentConfig (required for create_commitment)"),
  },
  async ({ action, contractAddress, commitmentId, plan }) => {
    const prepared = prepareAction({
      action,
      contractAddress,
      commitmentId,
      plan: plan as CommitmentConfig | undefined,
    });
    return { content: [{ type: "text", text: JSON.stringify(prepared, null, 2) }] };
  },
);

server.tool(
  "read_commitment",
  "Read the current state of a commitment from the HabitMakerCommitments contract onchain",
  {
    commitmentId: z.number().describe("The commitment ID to look up"),
    contractAddress: z.string().optional(),
    chainId: z.number().optional().describe("Chain ID (default: 8453 for Base mainnet)"),
    rpcUrl: z.string().optional(),
  },
  async (input) => {
    const commitment = await readCommitment(input);
    const serializable = {
      ...commitment,
      stakeAmount: commitment.stakeAmount.toString(),
      windowStart: commitment.windowStart.toString(),
      windowEnd: commitment.windowEnd.toString(),
    };
    return { content: [{ type: "text", text: JSON.stringify(serializable, null, 2) }] };
  },
);

server.tool(
  "read_window_state",
  "Read the current window state (open/expired, target met, remaining check-ins) for a commitment onchain",
  {
    commitmentId: z.number().describe("The commitment ID to look up"),
    contractAddress: z.string().optional(),
    chainId: z.number().optional().describe("Chain ID (default: 8453 for Base mainnet)"),
    rpcUrl: z.string().optional(),
  },
  async (input) => {
    const state = await readWindowState(input);
    const serializable = {
      ...state,
      windowStart: state.windowStart.toString(),
      windowEnd: state.windowEnd.toString(),
    };
    return { content: [{ type: "text", text: JSON.stringify(serializable, null, 2) }] };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("MCP server failed to start:", err);
  process.exit(1);
});
