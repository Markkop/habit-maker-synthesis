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

## Environment

Copy `.env.example` to `.env` when you are ready to deploy.

