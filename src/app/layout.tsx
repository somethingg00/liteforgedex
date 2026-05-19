import type { Metadata } from "next";
import "./globals.css";
import { ClientShell } from "./ClientShell";
import { Navbar } from "@/components/Navbar";
import { FooterTicker } from "@/components/lf";
import { Footer } from "@/components/Footer";

const SITE_URL = "https://liteforgedex.com";
const SITE_NAME = "LiteForge DEX";
const SITE_DESCRIPTION =
  "Trade zkLTC, bridge LTC via BitcoinOS Grail, stake $LITVM on LiteForge DEX — the flagship DEX on LitVM, Litecoin's first trustless EVM rollup endorsed by the Litecoin Foundation. Hard Money Web3 built on Arbitrum Orbit.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — LitVM Testnet · Litecoin DeFi, Bridge, Stake & Swap`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    // Brand
    "LiteForge",
    "LiteForge DEX",
    "LitVM LiteForge",
    // Network — LitVM
    "LitVM",
    "LitVM DEX",
    "LitVM Testnet",
    "LitVM rollup",
    "LitVM bridge",
    "LitVM stake",
    "Litecoin Virtual Machine",
    // Tokens
    "$LITVM",
    "LITVM token",
    "LITVM staking",
    "$zkLTC",
    "zkLTC",
    "zkLTC swap",
    "zkLTC bridge",
    "zkLTC gas token",
    // Litecoin DeFi positioning
    "Litecoin DeFi",
    "Litecoin DEX",
    "Litecoin rollup",
    "Litecoin L2",
    "Litecoin EVM",
    "Litecoin ZK rollup",
    "Litecoin smart contracts",
    "Litecoin staking",
    "Litecoin yield",
    "Litecoin DAO",
    "Litecoin Foundation",
    "Hard Money Web3",
    // Tech stack
    "Arbitrum Orbit",
    "Arbitrum Nitro",
    "Caldera",
    "Succinct zkVM",
    "SP1 zkVM",
    "Espresso sequencer",
    "BitcoinOS",
    "BitcoinOS Grail",
    "Grail Bridge",
    "BitSNARK",
    // Concepts
    "trustless bridge",
    "non-custodial bridge",
    "ZK rollup",
    "EVM rollup",
    "ZK-SNARK",
    "validity proofs",
    "sequencer fees",
    "sequencer fee revenue",
    "1:1 LTC backing",
    // Litecoin-native assets
    "Litecoin Ordinals",
    "Litecoin Runes",
    "LTC-20",
    "BitcoinOS Charms",
    // Product features
    "DEX",
    "decentralized exchange",
    "bridge",
    "stake",
    "liquidity",
    "airdrop",
    // Ecosystem apps
    "MidasHand",
    "Lester Labs",
    "OnmiFun",
  ],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — LitVM Testnet`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — DeFi forged on Litecoin's bedrock`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@LitecoinVM",
    creator: "@ssomethingg00",
    title: `${SITE_NAME} — LitVM Testnet`,
    description: SITE_DESCRIPTION,
    images: ["/og.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ClientShell>
          <div className="min-h-screen flex flex-col relative z-10">
            <Navbar />
            <main className="flex-1 w-full max-w-[1480px] mx-auto px-4 md:px-8 lg:px-12 pb-12">
              {children}
            </main>
            <Footer />
            <FooterTicker />
          </div>
        </ClientShell>
      </body>
    </html>
  );
}
