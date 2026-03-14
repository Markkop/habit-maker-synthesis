# HabitCoach — OpenClaw Agent

An onchain habit accountability agent that coaches users through ETH-backed health commitments on Base mainnet. Built for [The Synthesis](https://synthesis.md/) hackathon.

## Quick Start

### 1. Install OpenClaw

```bash
npm install -g openclaw
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your RPC URL and optional Telegram bot token
```

### 3. Build the MCP Server

```bash
cd mcp-server
npm install
npm run build
cd ..
```

### 4. Start the Gateway

```bash
openclaw gateway start
```

This starts the OpenClaw gateway with the HabitCoach agent, connecting to your configured channels (terminal, Telegram, etc.).

### 5. (Optional) Start the HTTP Server

For agent-to-agent interop via REST:

```bash
cd http-server
npm install
npm start
```

The HTTP server runs on port 8787 by default.

## Architecture

```
openclaw/
  SOUL.md          — coach persona and values
  AGENTS.md        — operating manual and safety checklist
  TOOLS.md         — contract reference and environment
  SKILLS.md        — evm-wallet + habit-maker-tools
  HEARTBEAT.md     — proactive coaching loop
  BOOT.md          — startup verification
  USER.md          — user profile state

  lib/             — shared core library
  mcp-server/      — MCP interface (for OpenClaw)
  http-server/     — HTTP interface (for other agents)
  docs/            — wallet guides, contract reference, Synthesis guide
```

Two interface layers share one core library:

- **MCP Server** — 6 tools consumed by the OpenClaw gateway via stdio
- **HTTP Server** — 6 REST endpoints + health check for agent-to-agent interop

## Wallet Setup

Choose one:

| Option | Effort | Autonomy | Risk |
|--------|--------|----------|------|
| [Petty Cash](docs/wallet-setup-petty-cash.md) | Low | Full (small wallet) | Limited to deposit |
| [MetaMask Delegation](docs/wallet-setup-delegation.md) | Medium | Bounded (ERC-7715) | Capped by permissions |
| [ClawSig / Zodiac Safe](docs/wallet-setup-clawsig.md) | Higher | Bounded (Roles) | Capped by role |

## Tools

### MCP Tools (via OpenClaw)

- `plan_commitment` — parse goal into structured commitment plan
- `create_mock_evidence` — generate test evidence snapshots
- `recommend_action` — evaluate evidence, recommend next action
- `prepare_action` — build unsigned contract calldata
- `read_commitment` — read commitment state onchain
- `read_window_state` — read window timing onchain

### HTTP Endpoints

- `POST /plan-commitment`
- `POST /evidence/mock`
- `POST /recommend-action`
- `POST /prepare-action`
- `GET  /commitment/:id`
- `GET  /commitment/:id/window`
- `GET  /health`

## Contract

- **Name:** HabitMakerCommitments
- **Chain:** Base mainnet (8453)
- **Address:** `0x47cf89B3F97bFAF738fa909891b374cDa135d88E`

See [docs/contract-reference.md](docs/contract-reference.md) for full ABI documentation.

## The Synthesis

This agent is built for [The Synthesis](https://synthesis.md/) hackathon. See [docs/synthesis-submission.md](docs/synthesis-submission.md) for registration, track strategy, and submission checklist.

Target tracks:

- Synthesis Open Track
- Agents that cooperate
- Best Use of Delegations (MetaMask)
- Agents With Receipts / ERC-8004 (Protocol Labs)
