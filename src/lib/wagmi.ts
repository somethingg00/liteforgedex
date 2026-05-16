import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "viem";
import { liteforge, RPC_URL_EXPORT } from "./chain";

const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
if (!WC_PROJECT_ID) {
  throw new Error(
    "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. Get a real id at https://cloud.walletconnect.com."
  );
}

export const wagmiConfig = getDefaultConfig({
  appName: "LiteForge DEX",
  projectId: WC_PROJECT_ID,
  chains: [liteforge],
  ssr: true,
  transports: {
    [liteforge.id]: http(RPC_URL_EXPORT),
  },
});
