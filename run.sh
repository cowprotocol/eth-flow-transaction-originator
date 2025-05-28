#!/bin/bash

set -o errexit -o nounset -o pipefail

base_path="$(dirname "$(realpath -s "$0")")/src"

deno run \
  --check \
  --deny-read \
  --allow-write="./out" \
  --allow-env="\
NODE_EXTRA_CA_CERTS,\
WS_NO_BUFFER_UTIL" \
  --allow-net="\
rpc.mevblocker.io,\
rpc.gnosischain.com,\
ethereum-sepolia.publicnode.com,\
arbitrum-one-rpc.publicnode.com,\
base.llamarpc.com,\
api.cow.fi" \
  -- \
  "$base_path/index.ts" \
  "$@"
