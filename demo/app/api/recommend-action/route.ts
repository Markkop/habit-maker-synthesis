import { NextRequest, NextResponse } from "next/server";
import { recommendAction } from "../../../lib/agent-core";
import type { CommitmentConfig, EvidenceSnapshot } from "../../../lib/types";

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as {
    plan?: CommitmentConfig;
    snapshots?: EvidenceSnapshot[];
    commitmentState?: {
      commitmentId?: number;
      checkInCount?: number;
      targetPerWindow?: number;
      windowStart?: string;
      windowEnd?: string;
      status?: "active" | "completed" | "failed";
    };
    contractAddress?: string;
  };

  if (!payload.plan) {
    return NextResponse.json({ error: "plan is required" }, { status: 400 });
  }

  return NextResponse.json({
    recommendation: recommendAction({
      plan: payload.plan,
      snapshots: Array.isArray(payload.snapshots) ? payload.snapshots : [],
      commitmentState: payload.commitmentState,
      contractAddress: typeof payload.contractAddress === "string" ? payload.contractAddress : undefined,
    }),
    snapshots: Array.isArray(payload.snapshots) ? payload.snapshots : [],
  });
}

