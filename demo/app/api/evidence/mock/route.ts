import { NextRequest, NextResponse } from "next/server";
import { createMockEvidence } from "../../../../lib/agent-core";
import type { EvidenceSource } from "../../../../lib/types";

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as {
    source?: unknown;
    observedValue?: unknown;
    unit?: unknown;
    meetsPolicy?: unknown;
    deterministic?: unknown;
    confidence?: unknown;
    rawReference?: unknown;
    notes?: unknown;
    windowStart?: unknown;
    windowEnd?: unknown;
  };

  if (typeof payload.source !== "string") {
    return NextResponse.json({ error: "source is required" }, { status: 400 });
  }

  const snapshot = createMockEvidence({
    source: payload.source as EvidenceSource,
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

  return NextResponse.json({ snapshot });
}

