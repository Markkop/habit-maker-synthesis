# Habit Maker Synthesis

Habit Maker is a hackathon-sized, self-contained project for The Synthesis. It turns health goals into onchain commitments backed by stake, mock evidence, and an external agent that recommends the next action.

This repo is intentionally separate from the private HabitChain codebase. It captures the core idea in a smaller system that is easier to understand, demo, and open source.

## Project Shape

- `contracts/`: minimal Foundry contract and tests
- `agent/`: standalone TypeScript HTTP service
- `demo/`: narrow Next.js app for planning, evidence, and signed actions
- `docs/`: architecture, demo script, conversation log, and deferred registration notes

## Core Product Flow

1. A user describes a health goal.
2. The external agent converts it into a `CommitmentConfig`.
3. The user signs `createCommitment` onchain.
4. Mock health/context signals are injected into the agent.
5. The agent recommends the next action.
6. The user signs the recommended contract action.

## Scope

Included:

- single-user commitments
- native ETH stake
- check-ins within a daily or weekly window
- success or failure settlement
- mock evidence from multiple sources
- external agent with explicit recommendation output

Excluded from v1:

- sponsor campaigns
- groups
- yield strategies
- paymasters
- invite systems
- autonomous signing
- Synthesis registration automation

## Run Order

1. Deploy the contract locally or on Base Sepolia.
2. Start the `agent/` service.
3. Start the `demo/` app.
4. Use the demo to plan a commitment and sign actions.

See [contracts/README.md](/Users/marcelokopmann/workspace/habitchain-base-workspace/habit-maker-synthesis/contracts/README.md) and [docs/demo-script.md](/Users/marcelokopmann/workspace/habitchain-base-workspace/habit-maker-synthesis/docs/demo-script.md).

