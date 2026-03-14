"use client";

import { useMemo, useState } from "react";
import type {
  AgentRecommendation,
  CommitmentConfig,
  CommitmentReadModel,
  EvidenceSnapshot,
  EvidenceSource,
  WindowStateReadModel,
} from "../lib/types";
import { decodeCreatedCommitmentId, ensureChain, executePreparedAction, formatEth, getWalletAddress, readCommitment } from "../lib/wallet";

const DEFAULT_AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL ?? "/api";
const DEFAULT_CHAIN_ID = Number.parseInt(process.env.NEXT_PUBLIC_CHAIN_ID ?? "8453", 10);
const DEFAULT_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "https://mainnet.base.org";
const DEFAULT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";
const SESSION_KEY = "habit-maker-demo";

const statusLabel = (status: number) => {
  if (status === 1) return "Completed";
  if (status === 2) return "Failed";
  return "Active";
};

export default function Page() {
  const [goal, setGoal] = useState("I want to work out 3 times a week and stay accountable");
  const [agentUrl, setAgentUrl] = useState(DEFAULT_AGENT_URL);
  const [chainId, setChainId] = useState(DEFAULT_CHAIN_ID);
  const [rpcUrl, setRpcUrl] = useState(DEFAULT_RPC_URL);
  const [contractAddress, setContractAddress] = useState(DEFAULT_CONTRACT_ADDRESS);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [plan, setPlan] = useState<CommitmentConfig | null>(null);
  const [snapshots, setSnapshots] = useState<EvidenceSnapshot[]>([]);
  const [recommendation, setRecommendation] = useState<AgentRecommendation | null>(null);
  const [commitmentId, setCommitmentId] = useState<number | null>(null);
  const [commitmentState, setCommitmentState] = useState<{
    commitment: CommitmentReadModel;
    windowState: WindowStateReadModel;
  } | null>(null);
  const [txStatus, setTxStatus] = useState<string>("Idle");
  const [error, setError] = useState<string>("");
  const [source, setSource] = useState<EvidenceSource>("workouts");
  const [observedValue, setObservedValue] = useState("completed workout");
  const [meetsPolicy, setMeetsPolicy] = useState(true);

  const prettyPlan = useMemo(() => {
    if (!plan) return null;
    return JSON.stringify(plan, null, 2);
  }, [plan]);

  const request = async <T,>(path: string, body?: object): Promise<T> => {
    const response = await fetch(`${agentUrl}${path}`, {
      method: body ? "POST" : "GET",
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = (await response.json()) as T & { error?: string };
    if (!response.ok) {
      throw new Error(typeof json.error === "string" ? json.error : "Agent request failed.");
    }

    return json;
  };

  const connectWallet = async () => {
    try {
      setError("");
      await ensureChain(chainId, rpcUrl);
      const address = await getWalletAddress();
      setWalletAddress(address);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to connect wallet.");
    }
  };

  const planCommitment = async () => {
    try {
      setError("");
      const response = await request<{ plan: CommitmentConfig }>("/plan-commitment", { goal });
      setPlan(response.plan);
      setRecommendation(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to plan commitment.");
    }
  };

  const createCommitment = async () => {
    if (!plan) return;
    if (!contractAddress) {
      setError("Enter a contract address first.");
      return;
    }

    try {
      setError("");
      setTxStatus("Preparing createCommitment...");

      const response = await request<{ preparedAction: AgentRecommendation["preparedAction"] }>("/prepare-action", {
        action: "create_commitment",
        contractAddress,
        plan,
      });

      if (!response.preparedAction) throw new Error("Agent did not return a prepared create action.");
      const { hash, receipt } = await executePreparedAction({
        preparedAction: response.preparedAction,
        chainId,
        rpcUrl,
      });

      const createdId = decodeCreatedCommitmentId(receipt);
      if (createdId !== undefined) {
        setCommitmentId(createdId);
      }

      setTxStatus(`Created commitment. Tx: ${hash}`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to create commitment.");
    }
  };

  const addMockEvidence = async () => {
    try {
      setError("");
      const response = await request<{ snapshot: EvidenceSnapshot }>("/evidence/mock", {
        source,
        observedValue,
        meetsPolicy,
      });
      setSnapshots(current => [...current, response.snapshot]);
      setRecommendation(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to add evidence.");
    }
  };

  const refreshCommitment = async () => {
    if (!commitmentId || !contractAddress) return;

    try {
      setError("");
      const state = await readCommitment({
        chainId,
        rpcUrl,
        contractAddress,
        commitmentId,
      });
      setCommitmentState(state);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to read commitment state.");
    }
  };

  const getRecommendation = async () => {
    if (!plan) return;

    try {
      setError("");
      let statePayload = undefined;

      if (commitmentId && contractAddress) {
        const state = await readCommitment({
          chainId,
          rpcUrl,
          contractAddress,
          commitmentId,
        });
        setCommitmentState(state);
        statePayload = {
          commitmentId,
          checkInCount: state.commitment.checkInCount,
          targetPerWindow: state.commitment.targetPerWindow,
          windowStart: new Date(Number(state.windowState.windowStart) * 1000).toISOString(),
          windowEnd: new Date(Number(state.windowState.windowEnd) * 1000).toISOString(),
          status: state.commitment.status === 1 ? "completed" : state.commitment.status === 2 ? "failed" : "active",
        };
      }

      const response = await request<{ recommendation: AgentRecommendation; snapshots: EvidenceSnapshot[] }>("/recommend-action", {
        sessionKey: SESSION_KEY,
        contractAddress,
        plan,
        snapshots,
        commitmentState: statePayload,
      });

      setSnapshots(response.snapshots);
      setRecommendation(response.recommendation);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to get recommendation.");
    }
  };

  const signRecommendedAction = async () => {
    if (!recommendation?.preparedAction) {
      setError("No prepared action is available.");
      return;
    }

    try {
      setError("");
      setTxStatus(`Signing ${recommendation.preparedAction.functionName ?? recommendation.action}...`);
      const { hash } = await executePreparedAction({
        preparedAction: recommendation.preparedAction,
        chainId,
        rpcUrl,
      });
      setTxStatus(`Action sent. Tx: ${hash}`);
      await refreshCommitment();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to sign recommended action.");
    }
  };

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Agents that cooperate</p>
          <h1>Habit Maker</h1>
          <p className="lede">
            A thin external agent that turns health goals into onchain commitments, mock evidence, and user-approved actions.
          </p>
        </div>
        <div className="pill-row">
          <button onClick={connectWallet}>{walletAddress ? `Wallet: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Connect wallet"}</button>
          <span className="pill">Tx status: {txStatus}</span>
        </div>
      </section>

      <section className="grid">
        <article className="card">
          <h2>Setup</h2>
          <label>
            Agent URL
            <input value={agentUrl} onChange={event => setAgentUrl(event.target.value)} />
          </label>
          <label>
            Chain ID
            <input
              type="number"
              value={chainId}
              onChange={event => setChainId(Number.parseInt(event.target.value || "84532", 10))}
            />
          </label>
          <label>
            RPC URL
            <input value={rpcUrl} onChange={event => setRpcUrl(event.target.value)} />
          </label>
          <label>
            Contract address
            <input value={contractAddress} onChange={event => setContractAddress(event.target.value)} />
          </label>
          <label>
            Commitment ID
            <input
              type="number"
              value={commitmentId ?? ""}
              onChange={event => setCommitmentId(event.target.value ? Number.parseInt(event.target.value, 10) : null)}
            />
          </label>
          <button onClick={refreshCommitment} disabled={!commitmentId || !contractAddress}>
            Refresh onchain commitment
          </button>
        </article>

        <article className="card">
          <h2>Goal input / planning</h2>
          <label>
            Goal
            <textarea rows={5} value={goal} onChange={event => setGoal(event.target.value)} />
          </label>
          <button onClick={planCommitment}>Plan commitment</button>
          {prettyPlan ? <pre>{prettyPlan}</pre> : <p className="muted">No plan yet.</p>}
          <button onClick={createCommitment} disabled={!plan || !contractAddress}>
            Create commitment
          </button>
        </article>

        <article className="card">
          <h2>Evidence inspector</h2>
          <label>
            Source
            <select value={source} onChange={event => setSource(event.target.value as EvidenceSource)}>
              <option value="workouts">workouts</option>
              <option value="sleep">sleep</option>
              <option value="calendar-context">calendar-context</option>
              <option value="conversation-hints">conversation-hints</option>
            </select>
          </label>
          <label>
            Observed value
            <input value={observedValue} onChange={event => setObservedValue(event.target.value)} />
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={meetsPolicy} onChange={event => setMeetsPolicy(event.target.checked)} />
            Meets policy
          </label>
          <button onClick={addMockEvidence}>Add mock evidence</button>
          <pre>{JSON.stringify(snapshots, null, 2)}</pre>
        </article>

        <article className="card">
          <h2>Recommendation panel</h2>
          <button onClick={getRecommendation} disabled={!plan}>
            Get recommendation
          </button>
          {recommendation ? (
            <>
              <p>
                <strong>Action:</strong> {recommendation.action}
              </p>
              <p>{recommendation.reason}</p>
              <p>
                <strong>Confidence:</strong> {recommendation.confidence}
              </p>
              <pre>{JSON.stringify(recommendation.preparedAction ?? null, null, 2)}</pre>
              <button
                onClick={signRecommendedAction}
                disabled={!recommendation.preparedAction || recommendation.action === "no_action"}
              >
                Sign recommended action
              </button>
            </>
          ) : (
            <p className="muted">No recommendation yet.</p>
          )}
        </article>

        <article className="card wide">
          <h2>Active commitment detail</h2>
          {commitmentState ? (
            <div className="two-col">
              <div>
                <p>
                  <strong>Title:</strong> {commitmentState.commitment.title}
                </p>
                <p>
                  <strong>Status:</strong> {statusLabel(commitmentState.commitment.status)}
                </p>
                <p>
                  <strong>Stake:</strong> {formatEth(commitmentState.commitment.stakeAmount)} ETH
                </p>
                <p>
                  <strong>Check-ins:</strong> {commitmentState.commitment.checkInCount} / {commitmentState.commitment.targetPerWindow}
                </p>
              </div>
              <div>
                <p>
                  <strong>Window open:</strong> {String(commitmentState.windowState.windowOpen)}
                </p>
                <p>
                  <strong>Window expired:</strong> {String(commitmentState.windowState.windowExpired)}
                </p>
                <p>
                  <strong>Target met:</strong> {String(commitmentState.windowState.targetMet)}
                </p>
                <p>
                  <strong>Remaining check-ins:</strong> {commitmentState.windowState.remainingCheckIns}
                </p>
              </div>
            </div>
          ) : (
            <p className="muted">Refresh a commitment after creation to see its onchain state.</p>
          )}
        </article>
      </section>

      {error ? <p className="error">{error}</p> : null}
    </main>
  );
}
