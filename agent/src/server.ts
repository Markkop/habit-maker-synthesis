import { createServer } from "node:http";
import { appendSnapshot, getSnapshots, replaceSnapshots } from "./store.js";
import { createMockEvidence } from "./evidence.js";
import { planCommitment } from "./planner.js";
import { prepareAction, recommendAction } from "./recommendation.js";
import type { CommitmentConfig, CommitmentStateInput, EvidenceSnapshot } from "./types.js";

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
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>;
};

const getSessionKey = (payload: Record<string, unknown>) =>
  typeof payload.sessionKey === "string" && payload.sessionKey.length > 0 ? payload.sessionKey : "default";

createServer(async (request, response) => {
  if (!request.url || !request.method) {
    const result = json(400, { error: "invalid_request" });
    response.writeHead(result.status, result.headers).end(result.body);
    return;
  }

  if (request.method === "OPTIONS") {
    const result = json(204, {});
    response.writeHead(result.status, result.headers).end();
    return;
  }

  try {
    if (request.method === "GET" && request.url === "/health") {
      const result = json(200, { ok: true, service: "habit-maker-agent" });
      response.writeHead(result.status, result.headers).end(result.body);
      return;
    }

    if (request.method !== "POST") {
      const result = json(404, { error: "not_found" });
      response.writeHead(result.status, result.headers).end(result.body);
      return;
    }

    const payload = await readBody(request);

    if (request.url === "/plan-commitment") {
      const goal = typeof payload.goal === "string" ? payload.goal : "";
      if (!goal.trim()) {
        const result = json(400, { error: "goal is required" });
        response.writeHead(result.status, result.headers).end(result.body);
        return;
      }

      const plan = planCommitment(goal, typeof payload.startAt === "string" ? payload.startAt : undefined);
      const result = json(200, { plan });
      response.writeHead(result.status, result.headers).end(result.body);
      return;
    }

    if (request.url === "/evidence/mock") {
      const sessionKey = getSessionKey(payload);
      if (Array.isArray(payload.snapshots)) {
        const snapshots = payload.snapshots as EvidenceSnapshot[];
        const result = json(200, { sessionKey, snapshots: replaceSnapshots(sessionKey, snapshots) });
        response.writeHead(result.status, result.headers).end(result.body);
        return;
      }

      if (typeof payload.source !== "string") {
        const result = json(400, { error: "source is required" });
        response.writeHead(result.status, result.headers).end(result.body);
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
      const result = json(200, { sessionKey, snapshot, snapshots });
      response.writeHead(result.status, result.headers).end(result.body);
      return;
    }

    if (request.url === "/recommend-action") {
      const sessionKey = getSessionKey(payload);
      const plan = payload.plan as CommitmentConfig | undefined;
      if (!plan) {
        const result = json(400, { error: "plan is required" });
        response.writeHead(result.status, result.headers).end(result.body);
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

      const result = json(200, { sessionKey, snapshots, recommendation });
      response.writeHead(result.status, result.headers).end(result.body);
      return;
    }

    if (request.url === "/prepare-action") {
      const action = typeof payload.action === "string" ? payload.action : "no_action";
      const preparedAction = prepareAction({
        action: action as ReturnType<typeof prepareAction>["action"],
        contractAddress: typeof payload.contractAddress === "string" ? payload.contractAddress : undefined,
        commitmentId: typeof payload.commitmentId === "number" ? payload.commitmentId : undefined,
        plan:
          typeof payload.plan === "object" && payload.plan
            ? (payload.plan as CommitmentConfig)
            : undefined,
      });

      const result = json(200, { preparedAction });
      response.writeHead(result.status, result.headers).end(result.body);
      return;
    }

    const result = json(404, { error: "not_found" });
    response.writeHead(result.status, result.headers).end(result.body);
  } catch (error) {
    const result = json(500, {
      error: "internal_error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
    response.writeHead(result.status, result.headers).end(result.body);
  }
}).listen(port, () => {
  console.log(`Habit Maker agent listening on http://localhost:${port}`);
});

