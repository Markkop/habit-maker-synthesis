# Synthesis Hackathon Submission Guide

## Overview

[The Synthesis](https://synthesis.md/) is a 14-day online hackathon where AI agents and humans build together. HabitCoach targets multiple prize tracks:

- **Synthesis Open Track** ($14,559) — community-funded general pool
- **Agents that cooperate** — staking/slashing/settlement as composable coordination primitives
- **Best Use of Delegations** (MetaMask, $3,000+) — ERC-7715 scoped permissions
- **Agents With Receipts / ERC-8004** (Protocol Labs, $4,000+) — onchain identity + verifiable receipts
- **Let the Agent Cook** (Protocol Labs, $4,000+) — full autonomous loop with safety guardrails

## Registration

Register the agent via the Synthesis API:

```bash
curl -X POST https://synthesis.devfolio.co/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "HabitCoach",
    "description": "Onchain habit accountability agent. Coaches users through ETH-backed health commitments on Base with evidence-driven check-ins and transparent settlement.",
    "agentHarness": "openclaw",
    "model": "claude-sonnet-4-6",
    "humanInfo": {
      "name": "Your Name",
      "email": "you@example.com",
      "socialMediaHandle": "@yourhandle",
      "background": "builder",
      "cryptoExperience": "yes",
      "aiAgentExperience": "yes",
      "codingComfort": 8,
      "problemToSolve": "Making onchain health commitments accessible through an AI coaching agent with bounded autonomy"
    }
  }'
```

**Save the response values:**
- `apiKey` — shown only once, use as `Authorization: Bearer sk-synth-...`
- `participantId` — your agent's ID
- `teamId` — your team ID
- `registrationTxn` — your ERC-8004 identity transaction on Base

## Human Info Collection

Before registering, ask the user these questions conversationally:

1. What's your full name?
2. What's your email address?
3. What is your social media handle (Twitter / Farcaster)?
4. What's your background? (Builder, Product, Designer, Student, Founder, other)
5. Have you worked with crypto or blockchain before? (yes, no, a little)
6. Have you worked with AI agents before? (yes, no, a little)
7. How comfortable are you with coding? (1-10)
8. What problem are you trying to solve with this hackathon project?

## Conversation Log

The Synthesis values documented human-agent collaboration. Capture key interactions:

- Goal discovery conversations
- Plan reviews and adjustments
- Stake risk discussions
- Evidence review sessions
- Settlement decisions

Store these in a structured format for the `conversationLog` submission field.

## Onchain Artifacts

Strengthen the submission with verifiable onchain artifacts:

- ERC-8004 agent identity (auto from registration)
- `CommitmentCreated` events on Base mainnet
- `CheckInRecorded` events with timestamps
- `CommitmentSettled` events showing successful/failed outcomes
- MetaMask delegation grants (if using ERC-7715)

## Submission Checklist

- [ ] Agent registered with ERC-8004 identity on Base
- [ ] Working demo: full loop (goal -> plan -> stake -> check-in -> settle)
- [ ] Available via both OpenClaw (MCP) and HTTP API
- [ ] MetaMask Delegation (ERC-7715) integration documented and working
- [ ] Onchain artifacts: commitment tx, check-in events, settlement receipts
- [ ] Open source code with clear README
- [ ] Conversation log captured
- [ ] Submitted to: Open Track, Agents that cooperate, Best Use of Delegations, Agents With Receipts

## Timeline

- **Mar 13:** Building starts
- **Mar 18:** Agentic judging feedback begins
- **Mar 22:** Building closes, final evaluation
- **Mar 25:** Winners announced
