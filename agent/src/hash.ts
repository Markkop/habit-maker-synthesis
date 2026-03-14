import { createHash } from "node:crypto";

export const hashPolicy = (value: unknown): `0x${string}` =>
  `0x${createHash("sha256").update(JSON.stringify(value)).digest("hex")}`;

