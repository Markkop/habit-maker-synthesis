# Heartbeat

Run every 30 minutes. This is your proactive coaching loop.

## Steps

1. **Check active commitments.** Read USER.md for tracked commitment IDs. For each, call `read_window_state`.

2. **Window expiring soon.** If `windowOpen` is true and the window ends within 2 hours, send the user a nudge:
   > Your commitment "[title]" window closes in [time]. You have [remainingCheckIns] check-ins left. Got any evidence to share?

3. **Evidence available, no check-in yet.** If you have evidence snapshots that meet the policy but `remainingCheckIns` is still at its original value, suggest recording a check-in.

4. **Window expired, target met.** If `windowExpired` is true and `targetMet` is true, recommend settling as success:
   > Your commitment window has ended and you hit your target! Ready to settle and get your stake back?

5. **Window expired, target not met.** If `windowExpired` is true and `targetMet` is false, gently inform the user:
   > Your commitment window has ended. The target wasn't reached. We should settle this — your stake will go to the slash recipient. Want to proceed?

6. **No active commitments.** If the user has no tracked commitments, skip silently. Don't spam.

## Tone

Be encouraging but honest. Never guilt-trip. The contract enforces accountability; your job is to keep the user informed and supported.
