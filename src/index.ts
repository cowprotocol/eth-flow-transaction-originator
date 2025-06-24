import { parseArgs } from "jsr:@std/cli/parse-args";
import { Contract, ethers } from "npm:ethers@^6.14";

import { getRpcUrl, SupportedNetwork, supportedNetworks } from "./networks.ts";

interface AppDataInfo {
  count: number;
}

// Fixme: script assumes mainnet block time
const BLOCK_TIME = 12;
const DAYS_TO_FETCH = 30;
const ETH_FLOW_ABI = [
  // https://github.com/cowprotocol/ethflowcontract/blob/7166070efa65df4282e9f14e54beef57619ad883/src/interfaces/ICoWSwapOnchainOrders.sol#L23-L44
  "event OrderPlacement(address indexed sender, tuple(address, address, address, uint256, uint256, uint32, bytes32, uint256, bytes32, bool, bytes32, bytes32) order, tuple(uint8 scheme, bytes data) signature, bytes data)",
];
// Most RPCs limit the number of blocks you can query simultaneously for events.
// Decreasing this numbers makes more RPCs compatible with this script, on the
// other hand it makes its running time longer.
const MAX_BLOCK_RANGE = 10000;

interface OrderPlacementEventsInput {
  daysToFetch: number;
  ethFlowAddress: string;
  provider: ethers.JsonRpcApiProvider;
}
async function orderPlacementEvents(
  { daysToFetch, ethFlowAddress, provider }: OrderPlacementEventsInput,
): Promise<(ethers.Log | ethers.EventLog)[]> {
  const ethFlow = new Contract(ethFlowAddress, ETH_FLOW_ABI).connect(provider);
  const orderPlacementFilter = ethFlow.filters.OrderPlacement;
  const currentBlock = await provider.getBlockNumber();
  const blocksToFetch = daysToFetch * 24 * 3600 / BLOCK_TIME;

  const events = [];
  const queryCount = Math.ceil(blocksToFetch / MAX_BLOCK_RANGE);
  for (let i = 0; i < queryCount; i++) {
    const startingBlock = currentBlock -
      Math.min(blocksToFetch, (i + 1) * MAX_BLOCK_RANGE);
    const endingBlock = currentBlock - i * MAX_BLOCK_RANGE;
    //console.debug({ startingBlock, endingBlock });
    const partial = await ethFlow.queryFilter(
      orderPlacementFilter,
      startingBlock,
      endingBlock,
    );
    events.push(...partial);
  }
  return events;
}

const params = parseArgs(Deno.args, {
  string: ["address", "network"],
});

console.log("Script parameters:", params);

if (params.address === undefined) {
  throw new Error("Command-line parameter `address` is required.");
}
const supportedNetworksAsStrings: readonly string[] = supportedNetworks;
if (
  (params.network === undefined) ||
  !(supportedNetworksAsStrings.includes(params.network))
) {
  throw new Error(
    `Command-line parameter "--network" is required and must be one of: ${
      supportedNetworks.join(", ")
    }.`,
  );
}
const network = params.network as SupportedNetwork;

const ethFlowAddress = ethers.getAddress(params.address);
const rpcUrl = getRpcUrl(network);
const provider = new ethers.JsonRpcProvider(rpcUrl);

const events = await orderPlacementEvents({
  daysToFetch: DAYS_TO_FETCH,
  provider,
  ethFlowAddress,
});
const appDataFromEvents = events.map((e) => {
  if (!("args" in e)) {
    throw new Error(
      `Failed to decode event at transaction ${e.transactionHash}`,
    );
  }
  return e.args[1][6];
});
const appDataUsage: Map<string, AppDataInfo> = new Map();
for (const appData of appDataFromEvents) {
  let info = appDataUsage.get(appData);
  if (info === undefined) {
    info = {
      count: 0,
    };
    appDataUsage.set(appData, info);
  }
  info.count += 1;
}

async function getAppCode(
  appData: string,
  network: SupportedNetwork,
): Promise<string | null> {
  const url = `https://api.cow.fi/${network}/api/v1/app_data/${appData}`;
  const result = await fetch(url, {
    headers: {
      accept: "application/json",
    },
  });

  if (!result.ok) {
    return null;
  }

  const asJson = await result.json();

  const fullAppData = asJson.fullAppData;
  if (fullAppData === undefined) {
    return null;
  }
  const appCode = JSON.parse(fullAppData).appCode;
  if (appCode === undefined) {
    return null;
  }
  return appCode;
}

console.log(
  `In the last ${DAYS_TO_FETCH} days there were ${events.length} eth-flow orders for contract ${ethFlowAddress} on network ${network}.`,
);
console.log(
  "The following is a list of all the app data used in these orders. When possible, the corresponding `appCode` field has been recovered.",
);

const appDataByFrequency = [...appDataUsage.entries()].sort((
  lhs,
  rhs,
) => (rhs[1].count - lhs[1].count));

for (const [appData, info] of appDataByFrequency) {
  const appCode = await getAppCode(appData, network);
  console.log(
    `${appData}: count ${info.count}, appCode: ${appCode ?? "unknown"}`,
  );
}
