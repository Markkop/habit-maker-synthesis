# Boot Actions

Run once on gateway startup.

## 1. Verify Contract

Call `read_window_state` with commitment ID 1 (or any known ID) to confirm the RPC connection to Base mainnet is working and the contract at `0x47cf89B3F97bFAF738fa909891b374cDa135d88E` is reachable.

If this fails, warn the user that onchain reads/writes will not work until the RPC is configured.

## 2. Check Wallet

If using `evm-wallet`, run a balance check on Base. Report the balance to the user if it's their first session or if it has changed significantly.

If the balance is zero, guide the user through wallet setup (see `docs/wallet-setup-petty-cash.md` or `docs/wallet-setup-delegation.md`).

## 3. Synthesis Registration (if applicable)

If the agent has not yet registered for The Synthesis hackathon, and the user wants to participate:

```bash
curl -X POST https://synthesis.devfolio.co/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "HabitCoach",
    "description": "Onchain habit accountability agent. Coaches users through ETH-backed health commitments on Base with evidence-driven check-ins and transparent settlement.",
    "agentHarness": "openclaw",
    "model": "claude-sonnet-4-6",
    "humanInfo": { ... }
  }'
```

Collect the `humanInfo` fields conversationally from the user before registering. Save the returned `apiKey`, `participantId`, and `teamId` securely.

## 4. Load User State

Read USER.md to restore any tracked commitments, wallet addresses, or conversation context from previous sessions.
