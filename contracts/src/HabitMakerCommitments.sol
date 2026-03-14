// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title HabitMakerCommitments
/// @notice Minimal ETH-backed health commitments for the Habit Maker demo.
contract HabitMakerCommitments {
    enum Cadence {
        Daily,
        Weekly
    }

    enum CommitmentStatus {
        Active,
        Completed,
        Failed
    }

    struct Commitment {
        address owner;
        string title;
        uint256 stakeAmount;
        Cadence cadence;
        uint8 targetPerWindow;
        uint40 windowStart;
        uint40 windowEnd;
        CommitmentStatus status;
        uint8 checkInCount;
        bytes32 proofPolicyHash;
    }

    error InvalidSlashRecipient();
    error InvalidStakeAmount();
    error InvalidTargetPerWindow();
    error EmptyTitle();
    error InvalidCadence();
    error InvalidStartTime();
    error CommitmentNotFound();
    error NotCommitmentOwner();
    error CommitmentNotActive();
    error WindowNotStarted();
    error WindowClosed();
    error TargetAlreadyMet();
    error WindowStillActive();
    error TargetNotMet();
    error TargetAlreadySatisfied();
    error TransferFailed();

    event CommitmentCreated(
        uint256 indexed commitmentId,
        address indexed owner,
        string title,
        uint256 stakeAmount,
        uint8 targetPerWindow,
        uint40 windowStart,
        uint40 windowEnd,
        bytes32 proofPolicyHash
    );
    event CheckInRecorded(uint256 indexed commitmentId, address indexed owner, uint8 checkInCount, uint256 timestamp);
    event CommitmentSettled(
        uint256 indexed commitmentId,
        address indexed owner,
        CommitmentStatus status,
        uint256 payoutAmount,
        address payoutRecipient,
        uint256 timestamp
    );

    uint40 private constant DAILY_WINDOW = 1 days;
    uint40 private constant WEEKLY_WINDOW = 7 days;

    address public immutable slashRecipient;
    uint256 public nextCommitmentId = 1;

    mapping(uint256 => Commitment) private commitments;

    constructor(address slashRecipient_) {
        if (slashRecipient_ == address(0)) revert InvalidSlashRecipient();
        slashRecipient = slashRecipient_;
    }

    function createCommitment(
        string calldata title,
        Cadence cadence,
        uint8 targetPerWindow,
        uint40 startAt,
        bytes32 proofPolicyHash
    ) external payable returns (uint256 commitmentId) {
        if (msg.value == 0) revert InvalidStakeAmount();
        if (bytes(title).length == 0) revert EmptyTitle();
        if (targetPerWindow == 0) revert InvalidTargetPerWindow();
        if (uint8(cadence) > uint8(Cadence.Weekly)) revert InvalidCadence();

        uint40 effectiveStart = startAt == 0 ? uint40(block.timestamp) : startAt;
        if (effectiveStart < block.timestamp) revert InvalidStartTime();

        uint40 duration = _windowDuration(cadence);
        uint40 effectiveEnd = effectiveStart + duration;

        commitmentId = nextCommitmentId++;
        commitments[commitmentId] = Commitment({
            owner: msg.sender,
            title: title,
            stakeAmount: msg.value,
            cadence: cadence,
            targetPerWindow: targetPerWindow,
            windowStart: effectiveStart,
            windowEnd: effectiveEnd,
            status: CommitmentStatus.Active,
            checkInCount: 0,
            proofPolicyHash: proofPolicyHash
        });

        emit CommitmentCreated(
            commitmentId,
            msg.sender,
            title,
            msg.value,
            targetPerWindow,
            effectiveStart,
            effectiveEnd,
            proofPolicyHash
        );
    }

    function recordCheckIn(uint256 commitmentId) external {
        Commitment storage commitment = commitments[commitmentId];
        _requireActiveOwner(commitment, msg.sender);

        if (block.timestamp < commitment.windowStart) revert WindowNotStarted();
        if (block.timestamp >= commitment.windowEnd) revert WindowClosed();
        if (commitment.checkInCount >= commitment.targetPerWindow) revert TargetAlreadyMet();

        unchecked {
            commitment.checkInCount += 1;
        }

        emit CheckInRecorded(commitmentId, msg.sender, commitment.checkInCount, block.timestamp);
    }

    function settleSuccess(uint256 commitmentId) external {
        Commitment storage commitment = commitments[commitmentId];
        _requireActiveOwner(commitment, msg.sender);

        if (block.timestamp < commitment.windowEnd) revert WindowStillActive();
        if (commitment.checkInCount < commitment.targetPerWindow) revert TargetNotMet();

        commitment.status = CommitmentStatus.Completed;
        uint256 payout = commitment.stakeAmount;
        commitment.stakeAmount = 0;

        _safeTransfer(payable(commitment.owner), payout);
        emit CommitmentSettled(commitmentId, msg.sender, CommitmentStatus.Completed, payout, commitment.owner, block.timestamp);
    }

    function settleFailure(uint256 commitmentId) external {
        Commitment storage commitment = commitments[commitmentId];
        _requireActiveOwner(commitment, msg.sender);

        if (block.timestamp < commitment.windowEnd) revert WindowStillActive();
        if (commitment.checkInCount >= commitment.targetPerWindow) revert TargetAlreadySatisfied();

        commitment.status = CommitmentStatus.Failed;
        uint256 payout = commitment.stakeAmount;
        commitment.stakeAmount = 0;

        _safeTransfer(payable(slashRecipient), payout);
        emit CommitmentSettled(commitmentId, msg.sender, CommitmentStatus.Failed, payout, slashRecipient, block.timestamp);
    }

    function getCommitment(uint256 commitmentId) external view returns (Commitment memory) {
        Commitment memory commitment = commitments[commitmentId];
        if (commitment.owner == address(0)) revert CommitmentNotFound();
        return commitment;
    }

    function getWindowState(uint256 commitmentId)
        external
        view
        returns (
            uint40 windowStart,
            uint40 windowEnd,
            bool windowOpen,
            bool windowExpired,
            bool targetMet,
            uint8 remainingCheckIns
        )
    {
        Commitment memory commitment = commitments[commitmentId];
        if (commitment.owner == address(0)) revert CommitmentNotFound();

        windowStart = commitment.windowStart;
        windowEnd = commitment.windowEnd;
        windowOpen = block.timestamp >= commitment.windowStart && block.timestamp < commitment.windowEnd;
        windowExpired = block.timestamp >= commitment.windowEnd;
        targetMet = commitment.checkInCount >= commitment.targetPerWindow;
        remainingCheckIns = commitment.targetPerWindow > commitment.checkInCount
            ? commitment.targetPerWindow - commitment.checkInCount
            : 0;
    }

    function _windowDuration(Cadence cadence) internal pure returns (uint40) {
        if (cadence == Cadence.Daily) return DAILY_WINDOW;
        return WEEKLY_WINDOW;
    }

    function _requireActiveOwner(Commitment storage commitment, address caller) internal view {
        if (commitment.owner == address(0)) revert CommitmentNotFound();
        if (commitment.owner != caller) revert NotCommitmentOwner();
        if (commitment.status != CommitmentStatus.Active) revert CommitmentNotActive();
    }

    function _safeTransfer(address payable to, uint256 amount) internal {
        (bool ok,) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
