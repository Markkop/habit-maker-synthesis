#!/usr/bin/env bash
set -euo pipefail

forge script script/Deploy.s.sol:Deploy \
  --rpc-url "$RPC_URL" \
  --broadcast \
  --verify

