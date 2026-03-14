# Environment & Contract Reference

## Deployed Contract

- **Name:** HabitMakerCommitments
- **Chain:** Base mainnet (8453)
- **Address:** `0x47cf89B3F97bFAF738fa909891b374cDa135d88E`
- **Explorer:** https://basescan.org/address/0x47cf89B3F97bFAF738fa909891b374cDa135d88E

## Contract Functions

| Function | Mutability | Purpose |
|----------|-----------|---------|
| `createCommitment(title, cadence, targetPerWindow, startAt, proofPolicyHash)` | payable | Create commitment with ETH stake |
| `recordCheckIn(commitmentId)` | nonpayable | Record a check-in during active window |
| `settleSuccess(commitmentId)` | nonpayable | Settle as success (refunds stake to owner) |
| `settleFailure(commitmentId)` | nonpayable | Settle as failure (sends stake to slashRecipient) |
| `getCommitment(commitmentId)` | view | Read full commitment struct |
| `getWindowState(commitmentId)` | view | Read window timing and progress |

## Cadence Values

- `0` = Daily (1-day window)
- `1` = Weekly (7-day window)

## Commitment Status

- `0` = Active
- `1` = Completed
- `2` = Failed

## Evidence Sources

- `workouts` — deterministic, from fitness APIs
- `sleep` — deterministic, from sleep/readiness APIs
- `calendar-context` — deterministic, from calendar data
- `conversation-hints` — non-deterministic, from chat inference

## HTTP API

The HTTP server (default port 8787) exposes the same tools as REST endpoints for agent-to-agent interop:

- `POST /plan-commitment` — `{ goal, startAt? }`
- `POST /evidence/mock` — `{ source, observedValue?, meetsPolicy?, ... }`
- `POST /recommend-action` — `{ plan, snapshots?, commitmentState?, contractAddress? }`
- `POST /prepare-action` — `{ action, contractAddress?, commitmentId?, plan? }`
- `GET /commitment/:id` — read commitment onchain
- `GET /commitment/:id/window` — read window state onchain
- `GET /health` — health check
