# Contracts

This folder contains the minimal Habit Maker commitment contract used by the demo.

## Scope

Included:

- create commitments with native ETH stake
- one active window at a time
- user check-ins
- success settlement
- failure settlement with slashed stake routed to a slash recipient

Not included:

- sponsors
- groups
- yield accounting
- upgradeability
- invite systems

## Expected Commands

```bash
forge install foundry-rs/forge-std
forge test
forge script script/Deploy.s.sol:Deploy --rpc-url $RPC_URL --broadcast
node script/export-abi.mjs
```

## Current Mainnet Deployment

- chain: Base mainnet (`8453`)
- contract: `HabitMakerCommitments`
- address: `0x47cf89B3F97bFAF738fa909891b374cDa135d88E`
- tx hash: `0x924f351f010bc407d55a14b87fa0b04bec30b3d37d4bb685d7297f170a6026e9`
- deployed block: `43331093`

## Repeatable Mainnet Deploy

Use [script/deploy-mainnet.sh](/Users/marcelokopmann/workspace/habitchain-base-workspace/habit-maker-synthesis/contracts/script/deploy-mainnet.sh).

Expected env vars:

- `PRIVATE_KEY`
- `BASE_MAINNET_RPC_URL` or `RPC_URL`
- optional `SLASH_RECIPIENT`

If `SLASH_RECIPIENT` is unset, the script defaults it to the deployer address derived from `PRIVATE_KEY`.

## Environment

Copy `.env.example` to `.env` when you are ready to deploy.

