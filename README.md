# Habit Maker Synthesis

Habit Maker is a hackathon-sized, self-contained project for The Synthesis. It turns health goals into onchain commitments backed by stake, mock evidence, and an external agent that recommends the next action.

This repo is intentionally separate from the private HabitChain codebase. It captures the core idea in a smaller system that is easier to understand, demo, and open source.

## Project Shape

- `contracts/`: minimal Foundry contract and tests
- `agent/`: standalone TypeScript HTTP service
- `demo/`: narrow Next.js app for planning, evidence, and signed actions
- `docs/`: architecture, demo script, conversation log, and deferred registration notes

## Public Agent File

This repo now includes two agent-facing entrypoints:

- [skill.md](/Users/marcelokopmann/workspace/habitchain-base-workspace/habit-maker-synthesis/skill.md): primary public skill file for Synthesis/OpenClaw-style agents
- [AGENTS.md](/Users/marcelokopmann/workspace/habitchain-base-workspace/habit-maker-synthesis/AGENTS.md): repo-local instructions for coding agents

If another agent needs to learn how to use Habit Maker, point it at `skill.md` first.

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

## Live Deployment

Current Base mainnet deployment:

- contract: `HabitMakerCommitments`
- chain: `8453`
- address: `0x47cf89B3F97bFAF738fa909891b374cDa135d88E`
- tx: `0x924f351f010bc407d55a14b87fa0b04bec30b3d37d4bb685d7297f170a6026e9`

## Vercel Demo Deploy

Use [scripts/vercel-create-and-deploy-demo.sh](/Users/marcelokopmann/workspace/habitchain-base-workspace/habit-maker-synthesis/scripts/vercel-create-and-deploy-demo.sh) to:

- create a Vercel project if it does not exist
- link the local `demo/` directory
- upsert the required demo env vars
- deploy the `demo/` app

Examples:

```bash
./scripts/vercel-create-and-deploy-demo.sh --project habit-maker-synthesis-demo
./scripts/vercel-create-and-deploy-demo.sh --project habit-maker-synthesis-demo --prod
```
