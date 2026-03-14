import type { EvidenceSnapshot } from "./types.js";

const evidenceStore = new Map<string, EvidenceSnapshot[]>();

export const getSnapshots = (sessionKey: string): EvidenceSnapshot[] => evidenceStore.get(sessionKey) ?? [];

export const appendSnapshot = (sessionKey: string, snapshot: EvidenceSnapshot): EvidenceSnapshot[] => {
  const next = [...getSnapshots(sessionKey), snapshot];
  evidenceStore.set(sessionKey, next);
  return next;
};

export const replaceSnapshots = (sessionKey: string, snapshots: EvidenceSnapshot[]) => {
  evidenceStore.set(sessionKey, snapshots);
  return snapshots;
};

