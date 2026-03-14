# Installed Skills

## evm-wallet

Self-sovereign EVM wallet for AI agents. Stores private keys locally with AES-256 encryption. Supports Base, Ethereum, Polygon, Arbitrum, Optimism.

Used for:
- Checking agent wallet balance
- Submitting signed transactions to Base mainnet
- Reading contract state

Setup: `node src/setup.js --json` (one-time, generates `~/.evm-wallet.json`)

## habit-maker-tools (MCP)

Custom MCP server providing HabitMaker-specific tools:

- `plan_commitment` — parse freeform goal into structured commitment plan
- `create_mock_evidence` — generate test evidence snapshots
- `recommend_action` — evaluate evidence and recommend next onchain action
- `prepare_action` — build unsigned contract calldata
- `read_commitment` — read commitment state from the contract onchain
- `read_window_state` — read window timing and progress onchain

Server: `openclaw/mcp-server/` (stdio transport)
