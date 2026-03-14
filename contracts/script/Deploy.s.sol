// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {HabitMakerCommitments} from "../src/HabitMakerCommitments.sol";

contract Deploy is Script {
    function run() external returns (HabitMakerCommitments deployed) {
        address slashRecipient = vm.envAddress("SLASH_RECIPIENT");

        vm.startBroadcast();
        deployed = new HabitMakerCommitments(slashRecipient);
        vm.stopBroadcast();
    }
}

