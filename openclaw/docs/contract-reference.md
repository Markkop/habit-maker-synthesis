# HabitMakerCommitments Contract Reference

- **Chain:** Base mainnet (8453)
- **Address:** `0x47cf89B3F97bFAF738fa909891b374cDa135d88E`
- **Solidity:** ^0.8.24
- **License:** MIT

## Overview

Minimal ETH-backed health commitment contract. Users stake ETH on a goal with a time window, record check-ins during the window, and settle the outcome when the window expires. Success refunds the stake; failure sends it to the slash recipient.

## State Variables

| Variable | Type | Description |
|----------|------|-------------|
| `slashRecipient` | `address` (immutable) | Receives slashed stakes on failure |
| `nextCommitmentId` | `uint256` | Auto-incrementing commitment counter (starts at 1) |

## Structs

### Commitment

```solidity
struct Commitment {
    address owner;
    string title;
    uint256 stakeAmount;
    Cadence cadence;          // 0=Daily, 1=Weekly
    uint8 targetPerWindow;
    uint40 windowStart;
    uint40 windowEnd;
    CommitmentStatus status;  // 0=Active, 1=Completed, 2=Failed
    uint8 checkInCount;
    bytes32 proofPolicyHash;
}
```

## Functions

### `createCommitment(title, cadence, targetPerWindow, startAt, proofPolicyHash)`

Creates a new commitment with ETH stake.

- **Mutability:** `payable`
- **Parameters:**
  - `title` (string) — human-readable commitment title (max ~72 chars recommended)
  - `cadence` (uint8) — 0 for Daily, 1 for Weekly
  - `targetPerWindow` (uint8) — number of check-ins needed per window
  - `startAt` (uint40) — unix timestamp for window start (0 = block.timestamp)
  - `proofPolicyHash` (bytes32) — SHA-256 hash of the offchain proof policy
- **Returns:** `commitmentId` (uint256)
- **Value:** must be > 0 (the ETH stake)
- **Errors:** `InvalidStakeAmount`, `EmptyTitle`, `InvalidTargetPerWindow`, `InvalidCadence`, `InvalidStartTime`

### `recordCheckIn(commitmentId)`

Records one check-in during the active window.

- **Mutability:** `nonpayable`
- **Errors:** `CommitmentNotFound`, `NotCommitmentOwner`, `CommitmentNotActive`, `WindowNotStarted`, `WindowClosed`, `TargetAlreadyMet`

### `settleSuccess(commitmentId)`

Settles as success when window expired and target met. Refunds stake to owner.

- **Mutability:** `nonpayable`
- **Errors:** `CommitmentNotFound`, `NotCommitmentOwner`, `CommitmentNotActive`, `WindowStillActive`, `TargetNotMet`

### `settleFailure(commitmentId)`

Settles as failure when window expired and target not met. Sends stake to slash recipient.

- **Mutability:** `nonpayable`
- **Errors:** `CommitmentNotFound`, `NotCommitmentOwner`, `CommitmentNotActive`, `WindowStillActive`, `TargetAlreadySatisfied`

### `getCommitment(commitmentId)` (view)

Returns the full `Commitment` struct.

- **Errors:** `CommitmentNotFound`

### `getWindowState(commitmentId)` (view)

Returns window timing and progress.

- **Returns:** `windowStart`, `windowEnd`, `windowOpen`, `windowExpired`, `targetMet`, `remainingCheckIns`
- **Errors:** `CommitmentNotFound`

## Events

### CommitmentCreated

```
CommitmentCreated(commitmentId indexed, owner indexed, title, stakeAmount, targetPerWindow, windowStart, windowEnd, proofPolicyHash)
```

### CheckInRecorded

```
CheckInRecorded(commitmentId indexed, owner indexed, checkInCount, timestamp)
```

### CommitmentSettled

```
CommitmentSettled(commitmentId indexed, owner indexed, status, payoutAmount, payoutRecipient, timestamp)
```

## Errors

| Error | When |
|-------|------|
| `InvalidSlashRecipient` | Constructor: zero address |
| `InvalidStakeAmount` | createCommitment: msg.value == 0 |
| `InvalidTargetPerWindow` | createCommitment: targetPerWindow == 0 |
| `EmptyTitle` | createCommitment: empty title |
| `InvalidCadence` | createCommitment: cadence > 1 |
| `InvalidStartTime` | createCommitment: startAt < block.timestamp |
| `CommitmentNotFound` | Any: commitment.owner == address(0) |
| `NotCommitmentOwner` | Any: caller != owner |
| `CommitmentNotActive` | Any: status != Active |
| `WindowNotStarted` | recordCheckIn: before windowStart |
| `WindowClosed` | recordCheckIn: after windowEnd |
| `TargetAlreadyMet` | recordCheckIn: checkInCount >= target |
| `WindowStillActive` | settle*: before windowEnd |
| `TargetNotMet` | settleSuccess: checkInCount < target |
| `TargetAlreadySatisfied` | settleFailure: checkInCount >= target |
| `TransferFailed` | settle*: ETH transfer failed |

## Window Durations

- **Daily:** 86400 seconds (1 day)
- **Weekly:** 604800 seconds (7 days)
