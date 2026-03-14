import assert from "node:assert/strict";
import test from "node:test";
import { createMockEvidence } from "../src/evidence.js";
import { planCommitment } from "../src/planner.js";
import { prepareAction, recommendAction } from "../src/recommendation.js";

test("planCommitment derives a weekly workout plan", () => {
  const plan = planCommitment("I want to work out 3 times a week and stay accountable");

  assert.equal(plan.cadence, "weekly");
  assert.equal(plan.targetPerWindow, 3);
  assert.equal(plan.proofPolicy.sources.includes("workouts"), true);
  assert.equal(plan.stakeWei.endsWith("0000000000000000"), true);
});

test("mock evidence adapter yields normalized snapshots", () => {
  const snapshot = createMockEvidence({ source: "sleep", meetsPolicy: true });

  assert.equal(snapshot.source, "sleep");
  assert.equal(typeof snapshot.id, "string");
  assert.equal(snapshot.deterministic, true);
});

test("recommendAction proposes a check-in during an active window", () => {
  const plan = planCommitment("Sleep 8 hours daily");
  const snapshot = createMockEvidence({ source: "sleep", meetsPolicy: true });

  const recommendation = recommendAction({
    plan,
    snapshots: [snapshot],
    commitmentState: {
      commitmentId: 1,
      checkInCount: 0,
      targetPerWindow: 1,
      windowEnd: new Date(Date.now() + 60_000).toISOString(),
    },
  });

  assert.equal(recommendation.action, "record_check_in");
});

test("recommendAction proposes failure when the window expired without enough evidence", () => {
  const plan = planCommitment("Work out 3 times a week");
  const snapshot = createMockEvidence({ source: "workouts", meetsPolicy: true });

  const recommendation = recommendAction({
    plan,
    snapshots: [snapshot],
    commitmentState: {
      commitmentId: 7,
      checkInCount: 1,
      targetPerWindow: 3,
      windowEnd: new Date(Date.now() - 60_000).toISOString(),
    },
  });

  assert.equal(recommendation.action, "settle_failure");
});

test("prepareAction emits createCommitment calldata metadata", () => {
  const plan = planCommitment("Meditate daily");
  const prepared = prepareAction({
    action: "create_commitment",
    plan,
    contractAddress: "0x1234",
  });

  assert.equal(prepared.functionName, "createCommitment");
  assert.equal(prepared.value, plan.stakeWei);
  assert.equal(Array.isArray(prepared.args), true);
});

