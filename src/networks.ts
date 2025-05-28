// Network names match the ones used in the CoW back-end api:
// https://api.cow.fi/docs
export const supportedNetworks = [
  "mainnet",
  "xdai",
  "sepolia",
  "arbitrum_one",
  "base",
] as const;
export type SupportedNetwork = typeof supportedNetworks[number];

export function getRpcUrl(network: SupportedNetwork): string {
  // For more information about the RPC nodes: https://chainlist.org/
  switch (network) {
    case "mainnet":
      // https://mevblocker.io/#rpc
      return "https://rpc.mevblocker.io";
    case "xdai":
      // https://docs.gnosischain.com/tools/rpc/
      return "https://rpc.gnosischain.com";
    case "sepolia":
      return "https://ethereum-sepolia.publicnode.com";
    case "arbitrum_one":
      return "https://arbitrum-one-rpc.publicnode.com";
    case "base":
      return "https://base.llamarpc.com";
    default:
      throw new Error(`Invalid network ${network}`);
  }
}
