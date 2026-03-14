# Agent Instructions

This repo exposes a public agent entrypoint in [skill.md](skill.md).

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
- OpenClaw workspace: `openclaw/`
- MCP server: `openclaw/mcp-server/`
- HTTP server: `openclaw/http-server/`
- shared core library: `openclaw/lib/`

## OpenClaw Agent

The `openclaw/` directory contains a full OpenClaw workspace for running HabitCoach as a standalone agent. It includes:

- workspace files (SOUL.md, TOOLS.md, SKILLS.md, HEARTBEAT.md, etc.)
- an MCP server exposing 6 tools for OpenClaw integration
- an HTTP server preserving the REST API for agent-to-agent interop
- wallet setup guides (petty cash, MetaMask delegation, Zodiac Safe)
- Synthesis hackathon submission guide

See `openclaw/README.md` for setup instructions.

## Safety

- do not claim chain state you have not verified
- do not treat conversation hints as deterministic proof
- do not auto-settle commitments without explicit human approval

