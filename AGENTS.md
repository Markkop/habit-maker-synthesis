# Agent Instructions

This repo exposes a public agent entrypoint in [skill.md](/Users/marcelokopmann/workspace/habitchain-base-workspace/habit-maker-synthesis/skill.md).

If you are an agent operating against this repo:

- start with `skill.md`
- use the deployed demo at `https://habit-maker-synthesis-demo.vercel.app/`
- treat prepared actions as unsigned suggestions
- keep the human in the signature loop

## Project Pointers

- onchain contract: `contracts/src/HabitMakerCommitments.sol`
- live contract: `0x47cf89B3F97bFAF738fa909891b374cDa135d88E` on Base mainnet
- demo UI: `demo/app/page.tsx`
- server routes: `demo/app/api/*`

## Safety

- do not claim chain state you have not verified
- do not treat conversation hints as deterministic proof
- do not auto-settle commitments without explicit human approval

