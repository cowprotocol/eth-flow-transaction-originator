# Eth-flow order origin tracer

CoW Protocol is deprecating older addresses of the [ETH-flow contract](https://github.com/cowprotocol/ethflowcontract).
Before doing this, we want to get an understanding of how many orders it still has and who is still creating them.

The code in this repository helps with that: it collects on-chain information on all created orders and retrieves the originating app from the app data field when possible.

## Requirements

- [Deno](https://deno.com/).

## Usage

For analyzing the orders of eth-flow address `0x40A50cf069e992AA4536211B23F286eF88752187 on Ethereum mainnet:

```sh
./run.sh --address "0x40A50cf069e992AA4536211B23F286eF88752187" --network mainnet
```
