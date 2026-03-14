import { createServer } from "node:http";
import { planCommitment, createMockEvidence, recommendAction, prepareAction } from "../../lib/agent-core.js";
import { readCommitment, readWindowState } from "../../lib/onchain-reader.js";
import type { CommitmentConfig, CommitmentStateInput, EvidenceSnapshot } from "../../lib/types.js";

const port = Number.parseInt(process.env.PORT ?? "8787", 10);

const json = (status: number, body: unknown) => ({
  status,
  headers: {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET,POST,OPTIONS",
  },
  body: `${JSON.stringify(body, null, 2)}\n`,
});

const readBody = async (request: AsyncIterable<Buffer>) => {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>;
};

const extractCommitmentId = (url: string): number | null => {
  const match = url.match(/^\/commitment\/(\d+)/);
  return match ? Number.parseInt(match[1], 10) : null;
};

const sessions = new Map<string, EvidenceSnapshot[]>();

const getSessionKey = (payload: Record<string, unknown>) =>
  typeof payload.sessionKey === "string" && payload.sessionKey.length > 0
    ? payload.sessionKey
    : "default";

const getSnapshots = (key: string) => sessions.get(key) ?? [];

const appendSnapshot = (key: string, snapshot: EvidenceSnapshot) => {
  const list = getSnapshots(key);
  list.push(snapshot);
  sessions.set(key, list);
  return list;
};

const replaceSnapshots = (key: string, snapshots: EvidenceSnapshot[]) => {
  sessions.set(key, snapshots);
  return snapshots;
};

createServer(async (request, response) => {
  if (!request.url || !request.method) {
    const r = json(400, { error: "invalid_request" });
    response.writeHead(r.status, r.headers).end(r.body);
    return;
  }

  if (request.method === "OPTIONS") {
    const r = json(204, {});
    response.writeHead(r.status, r.headers).end();
    return;
  }

  try {
    if (request.method === "GET" && request.url === "/health") {
      const r = json(200, { ok: true, service: "habit-maker-agent" });
      response.writeHead(r.status, r.headers).end(r.body);
      return;
    }

    if (request.method === "GET" && request.url.match(/^\/commitment\/\d+\/window$/)) {
      const commitmentId = extractCommitmentId(request.url);
      if (commitmentId === null) {
        const r = json(400, { error: "invalid commitment id" });
        response.writeHead(r.status, r.headers).end(r.body);
        return;
      }
      const state = await readWindowState({ commitmentId });
      const serializable = {
        ...state,
        windowStart: state.windowStart.toString(),
        windowEnd: state.windowEnd.toString(),
      };
      const r = json(200, serializable);
      response.writeHead(r.status, r.headers).end(r.body);
      return;
    }

    if (request.method === "GET" && request.url.match(/^\/commitment\/\d+$/)) {
      const commitmentId = extractCommitmentId(request.url);
      if (commitmentId === null) {
        const r = json(400, { error: "invalid commitment id" });
        response.writeHead(r.status, r.headers).end(r.body);
        return;
      }
      const commitment = await readCommitment({ commitmentId });
      const serializable = {
        ...commitment,
        stakeAmount: commitment.stakeAmount.toString(),
        windowStart: commitment.windowStart.toString(),
        windowEnd: commitment.windowEnd.toString(),
      };
      const r = json(200, serializable);
      response.writeHead(r.status, r.headers).end(r.body);
      return;
    }

    if (request.method !== "POST") {
      const r = json(404, { error: "not_found" });
      response.writeHead(r.status, r.headers).end(r.body);
      return;
    }

    const payload = await readBody(request);

    if (request.url === "/plan-commitment") {
      const goal = typeof payload.goal === "string" ? payload.goal : "";
      if (!goal.trim()) {
        const r = json(400, { error: "goal is required" });
        response.writeHead(r.status, r.headers).end(r.body);
        return;
      }
      const plan = planCommitment(goal, typeof payload.startAt === "string" ? payload.startAt : undefined);
      const r = json(200, { plan });
      response.writeHead(r.status, r.headers).end(r.body);
      return;
    }

    if (request.url === "/evidence/mock") {
      const sessionKey = getSessionKey(payload);

      if (Array.isArray(payload.snapshots)) {
        const snapshots = payload.snapshots as EvidenceSnapshot[];
        const r = json(200, { sessionKey, snapshots: replaceSnapshots(sessionKey, snapshots) });
        response.writeHead(r.status, r.headers).end(r.body);
        return;
      }

      if (typeof payload.source !== "string") {
        const r = json(400, { error: "source is required" });
        response.writeHead(r.status, r.headers).end(r.body);
        return;
      }

      const snapshot = createMockEvidence({
        source: payload.source as EvidenceSnapshot["source"],
        observedValue: typeof payload.observedValue === "string" ? payload.observedValue : undefined,
        unit: typeof payload.unit === "string" ? payload.unit : undefined,
        meetsPolicy: typeof payload.meetsPolicy === "boolean" ? payload.meetsPolicy : undefined,
        deterministic: typeof payload.deterministic === "boolean" ? payload.deterministic : undefined,
        confidence: typeof payload.confidence === "number" ? payload.confidence : undefined,
        rawReference: typeof payload.rawReference === "string" ? payload.rawReference : undefined,
        notes: typeof payload.notes === "string" ? payload.notes : undefined,
        windowStart: typeof payload.windowStart === "string" ? payload.windowStart : undefined,
        windowEnd: typeof payload.windowEnd === "string" ? payload.windowEnd : undefined,
      });

      const snapshots = appendSnapshot(sessionKey, snapshot);
      const r = json(200, { sessionKey, snapshot, snapshots });
      response.writeHead(r.status, r.headers).end(r.body);
      return;
    }

    if (request.url === "/recommend-action") {
      const sessionKey = getSessionKey(payload);
      const plan = payload.plan as CommitmentConfig | undefined;
      if (!plan) {
        const r = json(400, { error: "plan is required" });
        response.writeHead(r.status, r.headers).end(r.body);
        return;
      }

      const snapshots = Array.isArray(payload.snapshots)
        ? (payload.snapshots as EvidenceSnapshot[])
        : getSnapshots(sessionKey);

      const commitmentState =
        typeof payload.commitmentState === "object" && payload.commitmentState
          ? (payload.commitmentState as CommitmentStateInput)
          : undefined;

      const recommendation = recommendAction({
        plan,
        snapshots,
        commitmentState,
        contractAddress: typeof payload.contractAddress === "string" ? payload.contractAddress : undefined,
      });

      const r = json(200, { sessionKey, snapshots, recommendation });
      response.writeHead(r.status, r.headers).end(r.body);
      return;
    }

    if (request.url === "/prepare-action") {
      const action = typeof payload.action === "string" ? payload.action : "no_action";
      const prepared = prepareAction({
        action: action as ReturnType<typeof prepareAction>["action"],
        contractAddress: typeof payload.contractAddress === "string" ? payload.contractAddress : undefined,
        commitmentId: typeof payload.commitmentId === "number" ? payload.commitmentId : undefined,
        plan:
          typeof payload.plan === "object" && payload.plan
            ? (payload.plan as CommitmentConfig)
            : undefined,
      });

      const r = json(200, { preparedAction: prepared });
      response.writeHead(r.status, r.headers).end(r.body);
      return;
    }

    const r = json(404, { error: "not_found" });
    response.writeHead(r.status, r.headers).end(r.body);
  } catch (error) {
    const r = json(500, {
      error: "internal_error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
    response.writeHead(r.status, r.headers).end(r.body);
  }
}).listen(port, () => {
  console.log(`Habit Maker HTTP agent listening on http://localhost:${port}`);
});
