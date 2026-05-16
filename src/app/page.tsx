"use client";

import Link from "next/link";
import { useReadContract } from "wagmi";
import { Panel } from "@/components/lf";
import { swapAbi } from "@/lib/abi";
import { CONTRACT_ADDRESS } from "@/lib/chain";

const TILES = [
  {
    href: "/swap",
    title: "SWAP",
    desc: "Trade zkLTC against any registered token. Oracle + manual price quote.",
    glyph: "⇄",
  },
  {
    href: "/bridge",
    title: "BRIDGE",
    desc: "Move value between Litecoin L1 and zkLTC via the BitcoinOS Grail Bridge.",
    glyph: "⇅",
  },
  {
    href: "/tokens",
    title: "TOKENS",
    desc: "Browse every ERC20 deployed on LitVM. Caps, decimals, supply.",
    glyph: "◆",
  },
  {
    href: "/stake",
    title: "STAKE",
    desc: "Stake LITVM, earn a share of sequencer fee revenue paid in zkLTC.",
    glyph: "▲",
  },
  {
    href: "/airdrop",
    title: "AIRDROP",
    desc: "Check the anvil. Claim if your address is on the list.",
    glyph: "✦",
  },
  {
    href: "/activity",
    title: "ACTIVITY",
    desc: "Your transaction history, achievements & on-chain volume.",
    glyph: "◎",
  },
];

const ECOSYSTEM = [
  { name: "MidasHand", kind: "Prediction Markets" },
  { name: "Lester Labs", kind: "Token Launchpad" },
  { name: "OnmiFun", kind: "NFT Campaigns" },
  { name: "LiteForge", kind: "DEX & Stake" },
];

export default function HomePage() {
  const { data: registered } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: swapAbi,
    functionName: "getRegisteredTokens",
  });
  const { data: deployed } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: swapAbi,
    functionName: "check_all_deploy_tokens",
  });
  const regCount = (registered as `0x${string}`[] | undefined)?.length ?? 0;
  const depCount = (deployed as `0x${string}`[] | undefined)?.length ?? 0;

  const stats = [
    { label: "TVL", value: "4,182,907", unit: "zkLTC" },
    { label: "REGISTERED", value: regCount.toString(), unit: "" },
    { label: "DEPLOYED", value: depCount.toString(), unit: "" },
    { label: "BLOCK TIME", value: "0.4", unit: "s" },
  ];

  return (
    <div className="space-y-12">
      {/* HERO — full-width, two columns balanced */}
      <section className="grid lg:grid-cols-[1.5fr_1fr] gap-8 pt-10 lg:pt-16 items-center">
        <div className="space-y-6">
          <div className="font-mono text-[11px] tracking-[0.3em] text-emberDim">
            ▸ THE FORGE · TESTNET BUILD 04.18
          </div>
          <h1 className="font-mono font-extrabold tracking-tight text-ink text-5xl md:text-6xl xl:text-7xl leading-[0.95]">
            Forge your stake.
            <br />
            <span className="text-ember">Claim your spark.</span>
          </h1>
          <p className="text-dim2 max-w-2xl text-[15px] leading-relaxed">
            The first trustless EVM rollup secured by Litecoin. Swap zkLTC, bridge to LTC L1
            via Grail, stake LITVM for sequencer revenue, and forge new ERC20s — all on Arbitrum Orbit.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/swap"
              className="bracket font-mono text-xs tracking-[0.2em] text-bg bg-ember hover:bg-ember/90 px-5 py-3 transition-colors rounded-xl"
            >
              OPEN SWAP
            </Link>
            <Link
              href="/stake"
              className="bracket font-mono text-xs tracking-[0.2em] text-ember border border-ember/40 hover:bg-ember/10 px-5 py-3 transition-colors rounded-xl"
            >
              ENTER FURNACE
            </Link>
            <Link
              href="/tokens"
              className="font-mono text-xs tracking-[0.2em] text-dim2 hover:text-ink px-3 py-3 transition-colors"
            >
              ▸ EXPLORE TOKENS
            </Link>
          </div>

          {/* compact tech badges merged into hero — fills horizontal space */}
          <div className="flex flex-wrap gap-2 pt-4">
            {["Arbitrum Orbit", "Grail Bridge", "ZK-Rollup", "Litecoin L1"].map((s) => (
              <span
                key={s}
                className="font-mono text-[10px] tracking-wider text-dim2 border border-line2 px-2.5 py-1 rounded-full bg-panel/40"
              >
                {s}
              </span>
            ))}
            <span className="font-mono text-[10px] tracking-wider text-emberDim border border-ember/30 px-2.5 py-1 rounded-full bg-ember/5">
              GAS · <span className="num text-ember">{"<0.1 Gwei"}</span>
            </span>
          </div>
        </div>

        <Panel title="FORGE STATS · LIVE" className="self-center">
          <div className="divide-y divide-line">
            {stats.map((s, i) => (
              <div key={s.label} className="flex items-baseline justify-between px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="text-emberDim font-mono text-[10px]">0{i + 1}</span>
                  <span className="font-mono text-[11px] tracking-[0.18em] text-dim">{s.label}</span>
                </div>
                <div>
                  <span className="num font-bold text-xl text-ink">{s.value}</span>
                  {s.unit && <span className="font-mono text-xs text-dim ml-2">{s.unit}</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-line bg-panel2/50">
            <div className="font-mono text-[10px] tracking-wider text-dim flex items-center justify-between">
              <span>EPOCH 04 · 12 DAYS</span>
              <span className="text-ember">▸ ACTIVE</span>
            </div>
          </div>
        </Panel>
      </section>

      {/* MODULES — wider grid (3 cols on lg, 6 on 2xl to span fully) */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-mono text-[11px] tracking-[0.25em] text-dim">▸ MODULES</h2>
          <span className="font-mono text-[10px] text-dim">
            {TILES.length.toString().padStart(2, "0")} // total
          </span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-3">
          {TILES.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="group text-left p-5 bg-panel border border-line hover:border-ember/50 hover:bg-panel2 transition-all rounded-xl"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 border border-line2 group-hover:border-ember/60 flex items-center justify-center font-mono text-ember text-lg transition-colors shrink-0">
                  {t.glyph}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-mono font-bold text-ink tracking-wider">{t.title}</h3>
                    <span className="font-mono text-dim group-hover:text-ember transition-colors">→</span>
                  </div>
                  <p className="text-[12px] text-dim2 mt-1.5 leading-relaxed">{t.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ECOSYSTEM — slim single-row strip instead of big card grid */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-mono text-[11px] tracking-[0.25em] text-dim">
            ▸ ECOSYSTEM · LIVE ON LITEFORGE
          </h2>
          <span className="font-mono text-[10px] text-dim">{ECOSYSTEM.length} // apps</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {ECOSYSTEM.map((app) => (
            <div
              key={app.name}
              className="flex items-center gap-3 px-3.5 py-2 bg-panel border border-line rounded-full hover:border-spark/40 transition-colors"
            >
              <span className="font-mono font-bold text-ink text-[12px] tracking-wider">
                {app.name}
              </span>
              <span className="font-mono text-[10px] tracking-[0.18em] text-spark">
                · {app.kind.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
