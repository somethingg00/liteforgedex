"use client";
import { useState } from "react";

export function ForgeMark({
  size = 22,
  glow = false,
}: {
  size?: number;
  glow?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={glow ? { filter: "drop-shadow(0 0 6px #9FFF3C)" } : undefined}
    >
      <path
        d="M3 8 L12 3 L21 8 L21 16 L12 21 L3 16 Z"
        stroke="#9FFF3C"
        strokeWidth="1.5"
      />
      <path
        d="M8 11 L16 11 M12 8 L12 16"
        stroke="#9FFF3C"
        strokeWidth="1.5"
      />
    </svg>
  );
}

const PALETTE: Array<[string, string]> = [
  ["#9FFF3C", "#0C1311"],
  ["#3DD9FF", "#0C1311"],
  ["#FF6B35", "#0C1311"],
  ["#FFD23F", "#0C1311"],
  ["#C77DFF", "#0C1311"],
  ["#5FAA22", "#D4E4DA"],
];

// Well-known token logos from TrustWallet assets
const TOKEN_LOGOS: Record<string, string> = {
  WBTC: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png",
  WETH: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
  LINK: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png",
  DAI:  "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png",
  USDC: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
  USDT: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
  UNI:  "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png",
  AAVE: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9/logo.png",
  MATIC: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0/logo.png",
  ARB:  "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png",
  SOL:  "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
};

export function TokenGlyph({
  symbol = "?",
  size = 28,
  dim = false,
  iconUrl: iconUrlProp,
}: {
  symbol?: string;
  size?: number;
  dim?: boolean;
  iconUrl?: string;
}) {
  const idx =
    (symbol || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0) %
    PALETTE.length;
  const [bg, fg] = PALETTE[idx];
  const logoUrl = iconUrlProp || TOKEN_LOGOS[(symbol || "").toUpperCase()];

  const hexClip =
    "polygon(20% 0, 80% 0, 100% 50%, 80% 100%, 20% 100%, 0 50%)";

  const [imgFailed, setImgFailed] = useState(false);

  if (logoUrl && !dim && !imgFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={symbol}
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <div
      className="shrink-0 flex items-center justify-center font-mono font-bold border"
      style={{
        width: size,
        height: size,
        background: dim ? "#0F1714" : bg,
        color: dim ? "#5A6B62" : fg,
        borderColor: dim ? "#1A2520" : "transparent",
        fontSize: size * 0.42,
        clipPath: hexClip,
      }}
    >
      {(symbol || "?").slice(0, 1).toUpperCase()}
    </div>
  );
}
