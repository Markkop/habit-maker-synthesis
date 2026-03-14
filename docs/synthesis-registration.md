# Synthesis Registration

Registration is intentionally deferred until the external agent is clearly runnable and demoable.

## Register Only After

- the `agent/` service runs locally
- the `demo/` app can call it successfully
- at least one full local or Base Sepolia flow works end to end
- the demo clearly shows meaningful agent contribution

## Registration Checklist

Collect `humanInfo` first:

- full name
- email
- social handle
- background
- crypto experience
- AI agent experience
- coding comfort
- problem to solve

Then register the agent against the Synthesis API and store the returned API key only in the `agent/` environment.

Recommended metadata:

- `agentHarness`: use the truthful runtime or `other`
- `agentHarnessOther`: describe the actual tool/runtime if needed
- `model`: use the actual primary model used at registration time

Do not automate this yet. Keep it as a follow-up task after the demo is stable.

