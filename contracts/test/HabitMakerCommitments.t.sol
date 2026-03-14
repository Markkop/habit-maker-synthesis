// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {HabitMakerCommitments} from "../src/HabitMakerCommitments.sol";

contract HabitMakerCommitmentsTest is Test {
    HabitMakerCommitments internal commitments;

    address internal constant USER = address(0xA11CE);
    address internal constant SLASH_RECIPIENT = address(0xBEEF);
    bytes32 internal constant POLICY_HASH = keccak256("policy");

    function setUp() public {
        commitments = new HabitMakerCommitments(SLASH_RECIPIENT);
        vm.deal(USER, 10 ether);
    }

    function testCreateCommitmentStoresFields() public {
        vm.prank(USER);
        uint256 id = commitments.createCommitment{value: 0.2 ether}(
            "Workout 3x weekly",
            HabitMakerCommitments.Cadence.Weekly,
            3,
            uint40(block.timestamp + 1 hours),
            POLICY_HASH
        );

        HabitMakerCommitments.Commitment memory commitment = commitments.getCommitment(id);
        assertEq(commitment.owner, USER);
        assertEq(commitment.title, "Workout 3x weekly");
        assertEq(commitment.stakeAmount, 0.2 ether);
        assertEq(uint8(commitment.cadence), uint8(HabitMakerCommitments.Cadence.Weekly));
        assertEq(commitment.targetPerWindow, 3);
        assertEq(commitment.proofPolicyHash, POLICY_HASH);
        assertEq(uint8(commitment.status), uint8(HabitMakerCommitments.CommitmentStatus.Active));
    }

    function testRejectInvalidConfig() public {
        vm.prank(USER);
        vm.expectRevert(HabitMakerCommitments.InvalidStakeAmount.selector);
        commitments.createCommitment{value: 0}("Habit", HabitMakerCommitments.Cadence.Daily, 1, 0, POLICY_HASH);

        vm.prank(USER);
        vm.expectRevert(HabitMakerCommitments.InvalidTargetPerWindow.selector);
        commitments.createCommitment{value: 0.01 ether}("Habit", HabitMakerCommitments.Cadence.Daily, 0, 0, POLICY_HASH);

        vm.prank(USER);
        vm.expectRevert(HabitMakerCommitments.InvalidCadence.selector);
        commitments.createCommitment{value: 0.01 ether}("Habit", HabitMakerCommitments.Cadence(uint8(2)), 1, 0, POLICY_HASH);
    }

    function testRecordCheckInOnceAndRejectDuplicateWhenTargetIsOne() public {
        vm.prank(USER);
        uint256 id = commitments.createCommitment{value: 0.05 ether}(
            "Meditate daily",
            HabitMakerCommitments.Cadence.Daily,
            1,
            0,
            POLICY_HASH
        );

        vm.prank(USER);
        commitments.recordCheckIn(id);

        HabitMakerCommitments.Commitment memory commitment = commitments.getCommitment(id);
        assertEq(commitment.checkInCount, 1);

        vm.prank(USER);
        vm.expectRevert(HabitMakerCommitments.TargetAlreadyMet.selector);
        commitments.recordCheckIn(id);
    }

    function testRejectLateCheckIn() public {
        vm.prank(USER);
        uint256 id = commitments.createCommitment{value: 0.05 ether}(
            "Sleep 8 hours",
            HabitMakerCommitments.Cadence.Daily,
            1,
            0,
            POLICY_HASH
        );

        vm.warp(block.timestamp + 1 days);

        vm.prank(USER);
        vm.expectRevert(HabitMakerCommitments.WindowClosed.selector);
        commitments.recordCheckIn(id);
    }

    function testSettleSuccessRefundsStake() public {
        vm.prank(USER);
        uint256 id = commitments.createCommitment{value: 0.4 ether}(
            "Hydrate daily",
            HabitMakerCommitments.Cadence.Daily,
            1,
            0,
            POLICY_HASH
        );

        vm.prank(USER);
        commitments.recordCheckIn(id);

        vm.warp(block.timestamp + 1 days);

        uint256 beforeBalance = USER.balance;
        vm.prank(USER);
        commitments.settleSuccess(id);

        HabitMakerCommitments.Commitment memory commitment = commitments.getCommitment(id);
        assertEq(uint8(commitment.status), uint8(HabitMakerCommitments.CommitmentStatus.Completed));
        assertEq(commitment.stakeAmount, 0);
        assertEq(USER.balance, beforeBalance + 0.4 ether);
    }

    function testSettleFailureRoutesStakeToSlashRecipient() public {
        vm.prank(USER);
        uint256 id = commitments.createCommitment{value: 0.3 ether}(
            "Stretch daily",
            HabitMakerCommitments.Cadence.Daily,
            1,
            0,
            POLICY_HASH
        );

        vm.warp(block.timestamp + 1 days);

        uint256 slashBefore = SLASH_RECIPIENT.balance;
        vm.prank(USER);
        commitments.settleFailure(id);

        HabitMakerCommitments.Commitment memory commitment = commitments.getCommitment(id);
        assertEq(uint8(commitment.status), uint8(HabitMakerCommitments.CommitmentStatus.Failed));
        assertEq(commitment.stakeAmount, 0);
        assertEq(SLASH_RECIPIENT.balance, slashBefore + 0.3 ether);
    }

    function testWindowStateExposesReadModel() public {
        vm.prank(USER);
        uint256 id = commitments.createCommitment{value: 0.05 ether}(
            "Workout",
            HabitMakerCommitments.Cadence.Weekly,
            2,
            0,
            POLICY_HASH
        );

        vm.prank(USER);
        commitments.recordCheckIn(id);

        (uint40 windowStart, uint40 windowEnd, bool windowOpen, bool windowExpired, bool targetMet, uint8 remainingCheckIns) =
            commitments.getWindowState(id);

        assertTrue(windowOpen);
        assertFalse(windowExpired);
        assertFalse(targetMet);
        assertEq(windowEnd - windowStart, 7 days);
        assertEq(remainingCheckIns, 1);
    }
}
