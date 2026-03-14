#!/usr/bin/env bash
set -euo pipefail

forge script script/Deploy.s.sol:Deploy \
  --rpc-url "${RPC_URL:-http://127.0.0.1:8545}" \
  --broadcast

