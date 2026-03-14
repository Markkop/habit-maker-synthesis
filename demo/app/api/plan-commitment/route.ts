import { NextRequest, NextResponse } from "next/server";
import { planCommitment } from "../../../lib/agent-core";

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as { goal?: unknown; startAt?: unknown };

  if (typeof payload.goal !== "string" || payload.goal.trim().length === 0) {
    return NextResponse.json({ error: "goal is required" }, { status: 400 });
  }

  return NextResponse.json({
    plan: planCommitment(payload.goal, typeof payload.startAt === "string" ? payload.startAt : undefined),
  });
}

