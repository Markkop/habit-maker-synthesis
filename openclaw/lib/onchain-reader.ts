import { createPublicClient, http, type Address } from "viem";
import {
  habitMakerAbi,
  resolveChain,
  DEFAULT_CONTRACT_ADDRESS,
  DEFAULT_CHAIN_ID,
} from "./contract.js";
import type { CommitmentReadModel, WindowStateReadModel } from "./types.js";

const getPublicClient = (chainId: number, rpcUrl?: string) => {
  const chain = resolveChain(chainId);
  return createPublicClient({
    chain,
    transport: http(rpcUrl ?? chain.rpcUrls.default.http[0]),
  });
};

export const readCommitment = async (input: {
  commitmentId: number;
  contractAddress?: string;
  chainId?: number;
  rpcUrl?: string;
}): Promise<CommitmentReadModel> => {
  const client = getPublicClient(input.chainId ?? DEFAULT_CHAIN_ID, input.rpcUrl);
  const address = (input.contractAddress ?? DEFAULT_CONTRACT_ADDRESS) as Address;

  const result = (await client.readContract({
    address,
    abi: habitMakerAbi,
    functionName: "getCommitment",
    args: [BigInt(input.commitmentId)],
  })) as unknown as CommitmentReadModel;

  return result;
};

export const readWindowState = async (input: {
  commitmentId: number;
  contractAddress?: string;
  chainId?: number;
  rpcUrl?: string;
}): Promise<WindowStateReadModel> => {
  const client = getPublicClient(input.chainId ?? DEFAULT_CHAIN_ID, input.rpcUrl);
  const address = (input.contractAddress ?? DEFAULT_CONTRACT_ADDRESS) as Address;

  const raw = (await client.readContract({
    address,
    abi: habitMakerAbi,
    functionName: "getWindowState",
    args: [BigInt(input.commitmentId)],
  })) as unknown as readonly [number | bigint, number | bigint, boolean, boolean, boolean, number];

  return {
    windowStart: BigInt(raw[0]),
    windowEnd: BigInt(raw[1]),
    windowOpen: raw[2],
    windowExpired: raw[3],
    targetMet: raw[4],
    remainingCheckIns: Number(raw[5]),
  };
};
