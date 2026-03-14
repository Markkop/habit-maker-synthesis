#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PRIVATE_KEY="${PRIVATE_KEY:-}"
RPC_URL="${BASE_MAINNET_RPC_URL:-${RPC_URL:-}}"

if [[ -z "$PRIVATE_KEY" ]]; then
  echo "Missing PRIVATE_KEY" >&2
  exit 1
fi

if [[ -z "$RPC_URL" ]]; then
  echo "Missing BASE_MAINNET_RPC_URL or RPC_URL" >&2
  exit 1
fi

SLASH_RECIPIENT="${SLASH_RECIPIENT:-$(cast wallet address --private-key "$PRIVATE_KEY")}"

echo "Deploying HabitMakerCommitments to Base mainnet"
echo "Slash recipient: $SLASH_RECIPIENT"

SLASH_RECIPIENT="$SLASH_RECIPIENT" forge script script/Deploy.s.sol:Deploy \
  --rpc-url "$RPC_URL" \
  --broadcast \
  --private-key "$PRIVATE_KEY"

