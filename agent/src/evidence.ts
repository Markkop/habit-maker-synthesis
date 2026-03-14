import { randomUUID } from "node:crypto";
import type { EvidenceSnapshot, EvidenceSource } from "./types.js";

type MockEvidenceInput = {
  source: EvidenceSource;
  observedValue?: string;
  unit?: string;
  meetsPolicy?: boolean;
  deterministic?: boolean;
  confidence?: number;
  rawReference?: string;
  notes?: string;
  windowStart?: string;
  windowEnd?: string;
};

const DEFAULTS: Record<EvidenceSource, { observedValue: string; unit: string; deterministic: boolean; notes: string }> = {
  workouts: {
    observedValue: "completed workout",
    unit: "session",
    deterministic: true,
    notes: "Mocked from a workout or fitness API.",
  },
  sleep: {
    observedValue: "8.1",
    unit: "hours",
    deterministic: true,
    notes: "Mocked from a sleep or readiness API.",
  },
  "calendar-context": {
    observedValue: "blocked health event",
    unit: "event",
    deterministic: true,
    notes: "Mocked from calendar and schedule context.",
  },
  "conversation-hints": {
    observedValue: "user reported strong intent",
    unit: "hint",
    deterministic: false,
    notes: "Mocked from conversational inference.",
  },
};

export const createMockEvidence = (input: MockEvidenceInput): EvidenceSnapshot => {
  const defaults = DEFAULTS[input.source];
  const now = new Date();
  const windowStart = input.windowStart ?? now.toISOString();
  const windowEnd =
    input.windowEnd ??
    new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  return {
    id: randomUUID(),
    source: input.source,
    windowStart,
    windowEnd,
    observedValue: input.observedValue ?? defaults.observedValue,
    unit: input.unit ?? defaults.unit,
    meetsPolicy: input.meetsPolicy ?? true,
    deterministic: input.deterministic ?? defaults.deterministic,
    confidence: input.confidence ?? (defaults.deterministic ? 0.88 : 0.55),
    rawReference: input.rawReference ?? `mock://${input.source}/${now.getTime()}`,
    notes: input.notes ?? defaults.notes,
    createdAt: now.toISOString(),
  };
};

