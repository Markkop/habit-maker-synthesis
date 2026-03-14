#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEMO_DIR="$ROOT_DIR/demo"
PROJECT_NAME="habit-maker-synthesis-demo"
TARGET="preview"

VERCEL_CMD=(vercel)
VERCEL_FLAGS=()

usage() {
  cat <<'EOF'
Usage:
  ./scripts/vercel-create-and-deploy-demo.sh [--project NAME] [--prod]

Creates or reuses a Vercel project for the demo app, links demo/, upserts
required env vars, and deploys the app.

Environment variables pulled from shell first, then demo/.env.local, then demo/.env.example:
  NEXT_PUBLIC_AGENT_URL
  NEXT_PUBLIC_CHAIN_ID
  NEXT_PUBLIC_RPC_URL
  NEXT_PUBLIC_CONTRACT_ADDRESS

Optional auth/scope env vars:
  VERCEL_TOKEN
  VERCEL_SCOPE
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project)
      PROJECT_NAME="${2:-}"
      shift 2
      ;;
    --prod)
      TARGET="production"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$PROJECT_NAME" ]]; then
  echo "Project name is required." >&2
  exit 1
fi

if [[ -n "${VERCEL_TOKEN:-}" ]]; then
  VERCEL_FLAGS+=(--token "$VERCEL_TOKEN")
fi

if [[ -n "${VERCEL_SCOPE:-}" ]]; then
  VERCEL_FLAGS+=(--scope "$VERCEL_SCOPE")
fi

run_vercel() {
  if [[ ${#VERCEL_FLAGS[@]} -gt 0 ]]; then
    "${VERCEL_CMD[@]}" "$@" "${VERCEL_FLAGS[@]}"
    return
  fi

  "${VERCEL_CMD[@]}" "$@"
}

run_demo_vercel() {
  if [[ ${#VERCEL_FLAGS[@]} -gt 0 ]]; then
    "${VERCEL_CMD[@]}" --cwd "$DEMO_DIR" "$@" "${VERCEL_FLAGS[@]}"
    return
  fi

  "${VERCEL_CMD[@]}" --cwd "$DEMO_DIR" "$@"
}

read_env_file_value() {
  local file="$1"
  local key="$2"

  if [[ ! -f "$file" ]]; then
    return 1
  fi

  awk -F= -v key="$key" '$1 == key { print substr($0, index($0, "=") + 1) }' "$file" | tail -n1
}

resolve_env_value() {
  local key="$1"
  local direct="${!key:-}"

  if [[ -n "$direct" ]]; then
    printf "%s" "$direct"
    return
  fi

  local local_value
  local_value="$(read_env_file_value "$DEMO_DIR/.env.local" "$key" || true)"
  if [[ -n "$local_value" ]]; then
    printf "%s" "$local_value"
    return
  fi

  local example_value
  example_value="$(read_env_file_value "$DEMO_DIR/.env.example" "$key" || true)"
  if [[ -n "$example_value" ]]; then
    printf "%s" "$example_value"
    return
  fi

  return 1
}

upsert_env() {
  local name="$1"
  local value="$2"
  local env="$3"

  run_demo_vercel env rm "$name" "$env" --yes >/dev/null 2>&1 || true

  if [[ "$env" == "preview" ]]; then
    printf "%s" "$value" | run_demo_vercel env add "$name" "$env" "" >/dev/null
  else
    printf "%s" "$value" | run_demo_vercel env add "$name" "$env" >/dev/null
  fi

  echo "Updated $name for $env"
}

if ! run_vercel whoami >/dev/null 2>&1; then
  echo "Vercel auth missing. Run: vercel login" >&2
  exit 1
fi

if ! run_vercel project inspect "$PROJECT_NAME" >/dev/null 2>&1; then
  echo "Creating and linking Vercel project: $PROJECT_NAME"
else
  echo "Using existing Vercel project: $PROJECT_NAME"
fi

run_demo_vercel link --yes --project "$PROJECT_NAME" >/dev/null

REQUIRED_ENVS=(
  NEXT_PUBLIC_AGENT_URL
  NEXT_PUBLIC_CHAIN_ID
  NEXT_PUBLIC_RPC_URL
  NEXT_PUBLIC_CONTRACT_ADDRESS
)

missing=()
for key in "${REQUIRED_ENVS[@]}"; do
  if ! resolve_env_value "$key" >/dev/null 2>&1; then
    missing+=("$key")
  fi
done

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "Missing required env values:" >&2
  for key in "${missing[@]}"; do
    echo "  - $key" >&2
  done
  echo "Set them in the shell or in $DEMO_DIR/.env.local" >&2
  exit 1
fi

for key in "${REQUIRED_ENVS[@]}"; do
  value="$(resolve_env_value "$key")"
  upsert_env "$key" "$value" production
  upsert_env "$key" "$value" preview
  upsert_env "$key" "$value" development
done

echo "Deploying demo to Vercel ($TARGET)"
if [[ "$TARGET" == "production" ]]; then
  run_demo_vercel deploy --yes --prod
else
  run_demo_vercel deploy --yes --target preview
fi
