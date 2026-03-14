# Wallet Setup: MetaMask Delegation (ERC-7715)

The recommended option for bounded agent autonomy. You grant the agent scoped permissions to interact with the HabitMakerCommitments contract on your behalf, enforced at the smart account level. The agent operates within your permissions without needing your signature for every transaction.

## When to Use

- You want the agent to operate autonomously within strict bounds
- You want human-readable permission controls
- You're comfortable with MetaMask smart accounts

## Prerequisites

- MetaMask Flask 13.5.0 or later
- Your account upgraded to a MetaMask smart account
- ETH on Base mainnet for stakes and gas

## Setup Steps

### 1. Upgrade to Smart Account

In MetaMask Flask, go to Settings > Experimental > Smart Account and enable it. This upgrades your EOA to an ERC-4337 smart account.

### 2. Agent Requests Permissions

The agent calls `wallet_grantPermissions` via the MetaMask RPC, requesting scoped access to the HabitMakerCommitments contract:

```json
{
  "method": "wallet_grantPermissions",
  "params": [{
    "permissions": [{
      "type": "contract-call",
      "data": {
        "address": "0x47cf89B3F97bFAF738fa909891b374cDa135d88E",
        "functions": [
          "createCommitment(string,uint8,uint8,uint40,bytes32)",
          "recordCheckIn(uint256)",
          "settleSuccess(uint256)",
          "settleFailure(uint256)"
        ]
      },
      "policies": [{
        "type": "native-token-spending-limit",
        "data": { "limit": "50000000000000000" }
      }, {
        "type": "expiry",
        "data": { "timestamp": 1743465600 }
      }]
    }],
    "signer": {
      "type": "account",
      "data": { "id": "<agent-session-account-address>" }
    }
  }]
}
```

### 3. Review and Approve

MetaMask displays a human-readable permission summary:

- **Contract:** HabitMakerCommitments (0x47cf...d88E)
- **Functions:** createCommitment, recordCheckIn, settleSuccess, settleFailure
- **Spending limit:** 0.05 ETH maximum
- **Expires:** 30 days from now

Review and approve. You can modify limits before approving.

### 4. Agent Receives Session Key

The agent receives a session key tied to the granted permissions. It can now execute the whitelisted functions within the caps without requiring your signature each time.

### 5. Done

The agent will:
- Create commitments (up to your spending cap)
- Record check-ins when evidence warrants it
- Settle commitments when windows expire

All within the bounds you set. You can revoke permissions at any time via MetaMask.

## Adjusting Permissions

- **Spending limit:** Change the `native-token-spending-limit` value
- **Time limit:** Change the `expiry` timestamp
- **Revoke:** Go to MetaMask > Connected Sites > Revoke permissions

## Security Notes

- Permissions are enforced at the smart contract level — the agent literally cannot exceed them.
- The session key is separate from your main account key.
- All transactions are onchain and auditable.
- You can revoke at any time without the agent's cooperation.
