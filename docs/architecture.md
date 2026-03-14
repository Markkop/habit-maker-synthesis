# Architecture

Habit Maker is split into three isolated parts:

## Contracts

`contracts/src/HabitMakerCommitments.sol` defines a minimal onchain state machine:

- create a commitment with ETH stake
- record a check-in during the active window
- settle success when the window ends and the target is met
- settle failure when the window ends and the target is not met

The contract keeps the proof policy as a compact `bytes32` hash, so the detailed policy stays offchain while the commitment terms remain auditable.

## Agent

`agent/` is a standalone Node + TypeScript HTTP service. It does not sign transactions and does not custody funds.

It is responsible for:

- converting freeform health goals into normalized plans
- accepting mock evidence from multiple sources
- evaluating whether evidence meets the policy
- recommending the next action
- preparing contract call metadata for the demo app

The agent is intentionally deterministic. Conversational and contextual signals can influence recommendations, but only deterministic signals can directly mark a commitment as ready for check-in or settlement.

## Demo

`demo/` is a narrow Next.js app that:

- collects a goal
- calls the agent planner
- lets the user review the proposed commitment
- signs onchain actions with the browser wallet
- shows evidence snapshots and recommendations

The demo is intentionally not a full product. It exists to prove the health-agent + onchain-commitment interaction loop.

