import { defineChain } from "viem";

// RPC URL must come from env. Hard-fail at boot instead of shipping a
// hardcoded LAN IP to every client (audit finding H-02).
//
// In .env.local set, e.g.:
//   NEXT_PUBLIC_RPC_URL=https://liteforge.rpc.caldera.xyz/http
//   NEXT_PUBLIC_CHAIN_ID=4441
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;
if (!RPC_URL) {
  throw new Error(
    "NEXT_PUBLIC_RPC_URL is not set. Add it to .env.local."
  );
}
// Hard-fail if chainId is missing or not LiteForge testnet — prevents
// silent fallback to Hardhat (31337) on a misconfigured production build.
const RAW_CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID;
if (!RAW_CHAIN_ID) {
  throw new Error(
    "NEXT_PUBLIC_CHAIN_ID is not set. Add `NEXT_PUBLIC_CHAIN_ID=4441` to .env.local."
  );
}
const CHAIN_ID = Number(RAW_CHAIN_ID);
if (CHAIN_ID !== 4441) {
  throw new Error(
    `NEXT_PUBLIC_CHAIN_ID must be 4441 (LitVM LiteForge). Got ${CHAIN_ID}.`
  );
}

export const RPC_URL_EXPORT = RPC_URL;

export const liteforge = defineChain({
  id: CHAIN_ID,
  name: "LitVM LiteForge",
  nativeCurrency: { name: "zkLTC", symbol: "zkLTC", decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
    public: { http: [RPC_URL] },
  },
  blockExplorers: {
    default: {
      name: "LiteForge Explorer",
      url: "https://liteforge.explorer.caldera.xyz",
    },
  },
  testnet: true,
});

export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ??
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

// LITVM token and Staking contract are NOT read from env: `main_control`
// deploys both internally and exposes them via public getters. The frontend
// bootstraps them at runtime by calling main_control.litvmToken() and
// main_control.staking() (see swapAbi in lib/abi.ts).
