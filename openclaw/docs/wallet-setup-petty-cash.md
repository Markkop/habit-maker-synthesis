# Wallet Setup: Petty Cash

The simplest option. You create a small, dedicated wallet for the agent and fund it with a small amount of ETH. Risk is limited to whatever you deposit.

## When to Use

- Testing the agent workflow
- Learning how HabitCoach works
- Small commitments (< 0.05 ETH stakes)

## Setup Steps

### 1. Generate the Agent Wallet

If using the `evm-wallet` skill:

```bash
node src/setup.js --json
```

This creates `~/.evm-wallet.json` with the agent's private key (chmod 600). The output includes the wallet address.

### 2. Fund the Wallet

Send a small amount of ETH on Base mainnet to the agent's wallet address. For example:

- **0.02 ETH** — enough for one commitment with a 0.01 ETH stake plus gas
- **0.05 ETH** — enough for a few commitments

You can send ETH from any wallet (MetaMask, Coinbase, etc.) to the agent's address on Base.

### 3. Verify

Ask the agent to check its balance:

> What's your wallet balance on Base?

The agent will confirm the funds are available.

### 4. Start Using

The agent will use this wallet to sign transactions directly. Every `createCommitment`, `recordCheckIn`, `settleSuccess`, or `settleFailure` call will be signed with this wallet's key.

## Reclaiming Funds

You can ask the agent to send remaining ETH back to your main wallet at any time:

> Send my remaining ETH back to 0xYourAddress

## Security Notes

- The private key is stored locally in `~/.evm-wallet.json` with AES-256 encryption.
- Only fund what you're willing to risk.
- The agent cannot access funds beyond what's in this wallet.
