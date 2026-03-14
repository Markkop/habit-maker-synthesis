import { NextRequest, NextResponse } from "next/server";
import { prepareAction } from "../../../lib/agent-core";
import type { CommitmentConfig, PreparedAction } from "../../../lib/types";

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as {
    action?: PreparedAction["action"];
    contractAddress?: string;
    commitmentId?: number;
    plan?: CommitmentConfig;
  };

  return NextResponse.json({
    preparedAction: prepareAction({
      action: payload.action ?? "no_action",
      contractAddress: typeof payload.contractAddress === "string" ? payload.contractAddress : undefined,
      commitmentId: typeof payload.commitmentId === "number" ? payload.commitmentId : undefined,
      plan: payload.plan,
    }),
  });
}

