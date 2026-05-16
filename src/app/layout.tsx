import type { Metadata } from "next";
import "./globals.css";
import { ClientShell } from "./ClientShell";
import { Navbar } from "@/components/Navbar";
import { FooterTicker } from "@/components/lf";
import { Footer } from "@/components/Footer";

const SITE_URL = "https://liteforgedex.com";
const SITE_NAME = "LiteForge DEX";
const SITE_DESCRIPTION =
  "LiteForge DEX — swap, bridge, stake and forge tokens on LitVM LiteForge, the trustless EVM rollup secured by Litecoin.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — LitVM Testnet`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "LiteForge",
    "LiteForge DEX",
    "LitVM",
    "zkLTC",
    "Litecoin DeFi",
    "Litecoin rollup",
    "EVM rollup",
    "Caldera",
    "DEX",
    "bridge",
    "stake",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — LitVM Testnet`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og.png",
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
    images: ["/og.png"],
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
