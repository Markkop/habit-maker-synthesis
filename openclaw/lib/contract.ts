import { defineChain, type Chain } from "viem";
import { base, baseSepolia } from "viem/chains";

export const DEFAULT_CONTRACT_ADDRESS = "0x47cf89B3F97bFAF738fa909891b374cDa135d88E";
export const DEFAULT_CHAIN_ID = 8453;

export const habitMakerAbi = [
  {
    type: "function",
    name: "createCommitment",
    stateMutability: "payable",
    inputs: [
      { name: "title", type: "string" },
      { name: "cadence", type: "uint8" },
      { name: "targetPerWindow", type: "uint8" },
      { name: "startAt", type: "uint40" },
      { name: "proofPolicyHash", type: "bytes32" },
    ],
    outputs: [{ name: "commitmentId", type: "uint256" }],
  },
  {
    type: "function",
    name: "recordCheckIn",
    stateMutability: "nonpayable",
    inputs: [{ name: "commitmentId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "settleSuccess",
    stateMutability: "nonpayable",
    inputs: [{ name: "commitmentId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "settleFailure",
    stateMutability: "nonpayable",
    inputs: [{ name: "commitmentId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "getCommitment",
    stateMutability: "view",
    inputs: [{ name: "commitmentId", type: "uint256" }],
    outputs: [
      {
        components: [
          { name: "owner", type: "address" },
          { name: "title", type: "string" },
          { name: "stakeAmount", type: "uint256" },
          { name: "cadence", type: "uint8" },
          { name: "targetPerWindow", type: "uint8" },
          { name: "windowStart", type: "uint40" },
          { name: "windowEnd", type: "uint40" },
          { name: "status", type: "uint8" },
          { name: "checkInCount", type: "uint8" },
          { name: "proofPolicyHash", type: "bytes32" },
        ],
        name: "",
        type: "tuple",
      },
    ],
  },
  {
    type: "function",
    name: "getWindowState",
    stateMutability: "view",
    inputs: [{ name: "commitmentId", type: "uint256" }],
    outputs: [
      { name: "windowStart", type: "uint40" },
      { name: "windowEnd", type: "uint40" },
      { name: "windowOpen", type: "bool" },
      { name: "windowExpired", type: "bool" },
      { name: "targetMet", type: "bool" },
      { name: "remainingCheckIns", type: "uint8" },
    ],
  },
  {
    type: "event",
    name: "CommitmentCreated",
    inputs: [
      { indexed: true, name: "commitmentId", type: "uint256" },
      { indexed: true, name: "owner", type: "address" },
      { indexed: false, name: "title", type: "string" },
      { indexed: false, name: "stakeAmount", type: "uint256" },
      { indexed: false, name: "targetPerWindow", type: "uint8" },
      { indexed: false, name: "windowStart", type: "uint40" },
      { indexed: false, name: "windowEnd", type: "uint40" },
      { indexed: false, name: "proofPolicyHash", type: "bytes32" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "CheckInRecorded",
    inputs: [
      { indexed: true, name: "commitmentId", type: "uint256" },
      { indexed: true, name: "owner", type: "address" },
      { indexed: false, name: "checkInCount", type: "uint8" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "CommitmentSettled",
    inputs: [
      { indexed: true, name: "commitmentId", type: "uint256" },
      { indexed: true, name: "owner", type: "address" },
      { indexed: false, name: "status", type: "uint8" },
      { indexed: false, name: "payoutAmount", type: "uint256" },
      { indexed: false, name: "payoutRecipient", type: "address" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
    anonymous: false,
  },
] as const;

const localChain = defineChain({
  id: 31337,
  name: "Local Foundry",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.RPC_URL || "http://127.0.0.1:8545"] },
  },
});

export const resolveChain = (chainId: number): Chain => {
  if (chainId === 31337) return localChain;
  if (chainId === 8453) return base;
  return baseSepolia;
};
