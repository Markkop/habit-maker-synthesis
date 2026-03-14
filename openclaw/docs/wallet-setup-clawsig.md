# Wallet Setup: ClawSig (Zodiac Safe)

An alternative bounded autonomy option using a Gnosis Safe with the Zodiac Roles Modifier. Good for users who prefer Safe's ecosystem or don't use MetaMask.

## When to Use

- You already use Gnosis Safe
- You want multi-sig governance over agent permissions
- You need fine-grained parameter-level access control

## Prerequisites

- A Gnosis Safe deployed on Base mainnet (deploy at [safe.global](https://safe.global))
- Familiarity with the Safe Apps interface

## Setup Steps

### 1. Deploy a Safe

Go to [app.safe.global](https://app.safe.global) and create a new Safe on Base:
- Set yourself as the sole owner (1-of-1 threshold for simplicity)
- Fund it with ETH for stakes and gas

### 2. Enable Zodiac Roles Modifier

In your Safe, go to Apps > Zodiac > Roles Modifier and enable it. The Safe becomes the owner of the Roles Modifier by default.

### 3. Create an Agent Role

Using the Zodiac Roles SDK or the Safe Apps UI:

```typescript
import { processPermissions, planApplyRole } from "zodiac-roles-sdk";

const permissions = processPermissions([
  {
    targetAddress: "0x47cf89B3F97bFAF738fa909891b374cDa135d88E",
    functionSignatures: [
      "createCommitment(string,uint8,uint8,uint40,bytes32)",
      "recordCheckIn(uint256)",
      "settleSuccess(uint256)",
      "settleFailure(uint256)",
    ],
    send: true, // allow sending ETH (for createCommitment)
  },
]);

const calls = planApplyRole(ROLE_KEY, permissions, currentRoleState);
```

### 4. Assign the Agent Wallet

Add the agent's wallet address (from `evm-wallet` setup) as a member of the agent role.

### 5. Configure Limits (Optional)

The Zodiac Roles Modifier supports:
- **Rate limits:** max N transactions per time period
- **Value limits:** max ETH per transaction
- **Parameter constraints:** restrict specific function parameter values

### 6. Agent Executes Through Safe

The agent submits transactions via the Roles Modifier. The modifier checks that each call matches the whitelisted role and rejects anything outside bounds.

## Revoking Access

Remove the agent's wallet from the role, or disable the Roles Modifier module entirely.

## Security Notes

- The Safe holds the funds, not the agent wallet.
- The Roles Modifier enforces permissions at the contract level.
- All transactions flow through the Safe and are fully auditable.
- Multi-sig governance can be added later by increasing the Safe threshold.

## Resources

- [Zodiac Roles Modifier docs](https://zodiac.wiki/documentation/roles-modifier)
- [Zodiac Roles SDK](https://docs.roles.gnosisguild.org/sdk/getting-started)
- [Safe App](https://app.safe.global)
