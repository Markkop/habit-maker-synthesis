"use client";

import { createPublicClient, createWalletClient, custom, decodeEventLog, http, parseEther, type Address } from "viem";
import type { CommitmentReadModel, PreparedAction, WindowStateReadModel } from "./types";
import { habitMakerAbi, resolveChain } from "./contract";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

export const getWalletAddress = async () => {
  if (!window.ethereum) throw new Error("No injected wallet found.");
  const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
  if (!accounts[0]) throw new Error("Wallet did not return an account.");
  return accounts[0] as Address;
};

export const ensureChain = async (chainId: number, rpcUrl: string) => {
  if (!window.ethereum) throw new Error("No injected wallet found.");
  const hexChainId = `0x${chainId.toString(16)}`;

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: hexChainId }],
    });
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? Number((error as { code?: number }).code) : 0;
    if (code !== 4902) throw error;

    const chain = resolveChain(chainId);
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: hexChainId,
          chainName: chain.name,
          nativeCurrency: chain.nativeCurrency,
          rpcUrls: [rpcUrl],
        },
      ],
    });
  }
};

export const getPublicClient = (chainId: number, rpcUrl: string) =>
  createPublicClient({
    chain: resolveChain(chainId),
    transport: http(rpcUrl),
  });

const getWalletClient = (chainId: number) => {
  if (!window.ethereum) throw new Error("No injected wallet found.");
  return createWalletClient({
    chain: resolveChain(chainId),
    transport: custom(window.ethereum),
  });
};

export const executePreparedAction = async (input: {
  preparedAction: PreparedAction;
  chainId: number;
  rpcUrl: string;
}) => {
  if (!input.preparedAction.functionName) {
    throw new Error("Prepared action does not include a callable contract function.");
  }

  const walletClient = getWalletClient(input.chainId);
  const publicClient = getPublicClient(input.chainId, input.rpcUrl);
  const [account] = await walletClient.getAddresses();
  if (!account) throw new Error("Connect a wallet first.");

  const request = {
    address: input.preparedAction.contractAddress as Address,
    abi: habitMakerAbi,
    functionName: input.preparedAction.functionName,
    args: input.preparedAction.args as never,
    account,
    chain: resolveChain(input.chainId),
  } as const;

  const hash = await walletClient.writeContract({
    ...request,
    ...(input.preparedAction.value === "0" ? {} : { value: BigInt(input.preparedAction.value) }),
  } as never);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return { hash, receipt };
};

export const decodeCreatedCommitmentId = (receipt: { logs: Array<{ data: `0x${string}`; topics: readonly `0x${string}`[] }> }) => {
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: habitMakerAbi,
        data: log.data,
        topics: [...log.topics] as [`0x${string}`, ...`0x${string}`[]] | [],
      });
      if (decoded.eventName === "CommitmentCreated") {
        return Number(decoded.args.commitmentId);
      }
    } catch {
      // ignore unrelated logs
    }
  }

  return undefined;
};

export const readCommitment = async (input: { chainId: number; rpcUrl: string; contractAddress: string; commitmentId: number }) => {
  const client = getPublicClient(input.chainId, input.rpcUrl);
  const commitment = (await client.readContract({
    address: input.contractAddress as Address,
    abi: habitMakerAbi,
    functionName: "getCommitment",
    args: [BigInt(input.commitmentId)],
  })) as unknown as CommitmentReadModel;

  const windowStateRaw = (await client.readContract({
    address: input.contractAddress as Address,
    abi: habitMakerAbi,
    functionName: "getWindowState",
    args: [BigInt(input.commitmentId)],
  })) as unknown as readonly [number | bigint, number | bigint, boolean, boolean, boolean, number];

  const windowState: WindowStateReadModel = {
    windowStart: BigInt(windowStateRaw[0]),
    windowEnd: BigInt(windowStateRaw[1]),
    windowOpen: windowStateRaw[2],
    windowExpired: windowStateRaw[3],
    targetMet: windowStateRaw[4],
    remainingCheckIns: Number(windowStateRaw[5]),
  };

  return { commitment, windowState };
};

export const formatEth = (value: bigint) => Number(value) / 1e18;
export { parseEther };
