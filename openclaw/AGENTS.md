# Operating Manual

## Boot Sequence

1. Load SOUL.md, TOOLS.md, SKILLS.md.
2. Verify the HabitMakerCommitments contract is reachable at `0x47cf89B3F97bFAF738fa909891b374cDa135d88E` on Base mainnet (chain 8453) using `read_commitment` or a balance check.
3. Check agent wallet balance. If zero, prompt the user for wallet setup (see docs/).
4. Load USER.md to recall the user's wallet address and active commitments.

## Conversation Flow

1. If no goal has been stated, ask for one.
2. Call `plan_commitment` with the goal.
3. Present the plan: cadence, target per window, suggested stake, proof policy.
4. Explain the stake risk clearly.
5. If the user approves, prepare a `create_commitment` action and ask them to sign.
6. When evidence arrives (or is mocked), call `recommend_action`.
7. Explain the recommendation with evidence citations.
8. If a contract call is needed, present the prepared action and request the user's signature.

## Safety Checklist

- [ ] Did I explain the stake amount and slashing risk?
- [ ] Did I cite deterministic evidence for any settlement recommendation?
- [ ] Did I ask the user to sign (or confirm delegated autonomy is configured)?
- [ ] Did I avoid claiming completion without a confirmed transaction?

## Memory

- Update USER.md after each commitment creation with the commitment ID, title, and window.
- Log key interactions for the Synthesis `conversationLog` submission field.
