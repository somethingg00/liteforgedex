import Link from "next/link";
import { Panel } from "@/components/lf";

const TECH_STACK = [
  { label: "BASE LAYER", value: "Litecoin L1", note: "proof-of-work security" },
  { label: "ROLLUP TYPE", value: "Arbitrum Orbit", note: "EVM-equivalent" },
  { label: "EVM VERSION", value: "Shanghai", note: "Solidity ≤ 0.8.24" },
  { label: "CHAIN ID", value: "4441", note: "LiteForge testnet" },
  { label: "GAS TOKEN", value: "zkLTC", note: "18 decimals · 1:1 LTC via Grail" },
  { label: "BRIDGE", value: "BitcoinOS Grail", note: "trustless LTC ↔ zkLTC" },
  { label: "BLOCK TIME", value: "~0.4 s", note: "sub-second finality" },
  { label: "EXPLORER", value: "liteforge.explorer.caldera.xyz", note: "Caldera" },
];

const FEATURES = [
  {
    glyph: "⇄",
    title: "Instant Swaps",
    desc: "Trade any registered ERC20 against zkLTC with oracle-backed or manually set prices. No front-running, sub-second settlement.",
  },
  {
    glyph: "⇅",
    title: "Grail Bridge",
    desc: "Move real Litecoin from L1 into zkLTC on LitVM — trustlessly, via the BitcoinOS Grail Bridge. No wrapped custodians.",
  },
  {
    glyph: "▲",
    title: "Sequencer Staking",
    desc: "Lock LITVM tokens and earn a proportional share of sequencer fee revenue denominated in zkLTC. Pure on-chain math.",
  },
  {
    glyph: "◆",
    title: "Token Forge",
    desc: "Deploy capped, burnable, pausable ERC20s in a single transaction. Each token is immediately swappable and listable.",
  },
  {
    glyph: "✦",
    title: "Airdrop Engine",
    desc: "Snapshot-based airdrop distribution with on-chain eligibility checks. Tiered allocation: Forgemaster, Ember, and Spark.",
  },
  {
    glyph: "◎",
    title: "Live Activity",
    desc: "Full transaction history for every wallet — swaps, bridges, stakes — with real-time on-chain volume analytics.",
  },
];

export default function AboutPage() {
  return (
    <div className="pt-10 space-y-16 max-w-5xl">

      {/* Hero */}
      <section className="space-y-5">
        <div className="font-mono text-[11px] tracking-[0.3em] text-dim">
          ▸ ABOUT · LITEFORGE DEX
        </div>
        <h1 className="font-mono font-extrabold text-4xl md:text-5xl tracking-tight text-ink leading-[0.95]">
          DeFi forged on<br />
          <span className="text-ember">Litecoin&apos;s bedrock.</span>
        </h1>
        <p className="text-dim2 text-[15px] leading-relaxed max-w-2xl">
          LiteForge DEX is the native DEX of LitVM LiteForge — the first EVM-compatible
          rollup secured by Litecoin proof-of-work. Trade, bridge, stake, and forge
          tokens on a network that inherits Litecoin&apos;s 13-year security record while
          running at EVM speed.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            href="/swap"
            className="bracket font-mono text-xs tracking-[0.2em] text-bg bg-ember hover:bg-ember/90 px-5 py-3 transition-colors rounded-xl"
          >
            START SWAPPING
          </Link>
          <a
            href="https://docs.litvm.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="bracket font-mono text-xs tracking-[0.2em] text-ember border border-ember/40 hover:bg-ember/10 px-5 py-3 transition-colors rounded-xl"
          >
            READ DOCS ↗
          </a>
        </div>
      </section>

      {/* Mission */}
      <section className="space-y-4">
        <h2 className="font-mono text-[11px] tracking-[0.25em] text-dim">▸ MISSION</h2>
        <div className="grid md:grid-cols-3 gap-3">
          {[
            {
              num: "01",
              title: "Trustless Bridge",
              body: "Connect Litecoin L1 value to the EVM world without custodians. zkLTC is 1:1 backed LTC, movable at any time.",
            },
            {
              num: "02",
              title: "Fair DeFi",
              body: "No pre-mine advantage. Staking rewards flow proportionally from real sequencer fee revenue — not inflation.",
            },
            {
              num: "03",
              title: "Open Infrastructure",
              body: "Any developer can deploy ERC20s, pair price feeds, and integrate the swap contract. Permissionless by design.",
            },
          ].map((c) => (
            <Panel key={c.num}>
              <div className="p-5 space-y-2">
                <div className="font-mono text-[10px] tracking-[0.2em] text-dim">{c.num}</div>
                <div className="font-mono font-bold text-ink tracking-wide">{c.title}</div>
                <p className="font-mono text-[12px] text-dim2 leading-relaxed">{c.body}</p>
              </div>
            </Panel>
          ))}
        </div>
      </section>

      {/* Why */}
      <section className="space-y-5">
        <h2 className="font-mono text-[11px] tracking-[0.25em] text-dim">▸ WHY LITEFORGE</h2>
        <div className="space-y-4 max-w-3xl">
          <p className="text-dim2 text-[14px] leading-relaxed">
            Litecoin has secured value for over a decade with one of the most battle-tested
            proof-of-work networks ever shipped — yet its expressive power has stayed frozen
            at the script level. Meanwhile the EVM world keeps reinventing security on top
            of validator sets that are years old. LiteForge bridges that gap: a full EVM
            execution layer that <span className="text-ember">settles into Litecoin&apos;s
            mining economy</span>, not a parallel committee.
          </p>
          <p className="text-dim2 text-[14px] leading-relaxed">
            Every swap, every bridge, every token deploy on this DEX runs on LitVM —
            an Arbitrum Orbit rollup with sub-second blocks. Native gas is zkLTC, which
            is real Litecoin held 1:1 by the BitcoinOS Grail Bridge. There are no
            custodial wrappers, no synthetic IOUs, and no governance switch that can
            mint zkLTC out of thin air. If you can bridge in, you can bridge out.
          </p>
          <p className="text-dim2 text-[14px] leading-relaxed">
            The DEX itself is intentionally minimal: an on-chain price oracle, a single
            swap router, a forge for permissionless ERC20 issuance, and a staking module
            that pays out from <span className="text-ember">real sequencer fees</span> —
            never from inflationary emissions. The protocol is the product. No hidden
            treasury, no team unlock cliffs you have to track on a third-party dashboard.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="space-y-4">
        <h2 className="font-mono text-[11px] tracking-[0.25em] text-dim">▸ WHAT YOU CAN DO</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="p-5 bg-panel border border-line rounded-xl space-y-2 hover:border-ember/40 transition-colors"
            >
              <div className="w-9 h-9 border border-line2 flex items-center justify-center font-mono text-ember text-base">
                {f.glyph}
              </div>
              <div className="font-mono font-bold text-ink tracking-wide text-[13px]">{f.title}</div>
              <p className="font-mono text-[11px] text-dim2 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section className="space-y-4">
        <h2 className="font-mono text-[11px] tracking-[0.25em] text-dim">▸ TECH STACK</h2>
        <Panel>
          <div className="divide-y divide-line">
            {TECH_STACK.map((row) => (
              <div key={row.label} className="flex items-center gap-4 px-5 py-3.5">
                <span className="font-mono text-[10px] tracking-[0.2em] text-dim w-28 shrink-0">
                  {row.label}
                </span>
                <span className="font-mono text-[13px] text-ink num flex-1">{row.value}</span>
                <span className="font-mono text-[10px] text-dim2 hidden sm:block">{row.note}</span>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      {/* FAQ */}
      <section className="space-y-4">
        <h2 className="font-mono text-[11px] tracking-[0.25em] text-dim">▸ FAQ</h2>
        <div className="space-y-3">
          {[
            {
              q: "What is zkLTC?",
              a: "zkLTC is the native gas token on LitVM. It is 1:1 backed by real Litecoin held by the BitcoinOS Grail Bridge contracts. Every zkLTC in circulation corresponds to exactly one LTC locked on Litecoin L1, and you can bridge back at any time.",
            },
            {
              q: "Is LiteForge custodial?",
              a: "No. The bridge is non-custodial and trust-minimized — no multisig of named individuals controls user funds. The DEX contracts are immutable swap and staking modules deployed on LitVM; LiteForge does not hold user deposits.",
            },
            {
              q: "How does staking pay rewards?",
              a: "Stakers lock LITVM tokens and receive a pro-rata share of zkLTC fee revenue collected by the sequencer. Rewards are denominated in zkLTC — i.e. real Litecoin — not in inflationary LITVM emissions.",
            },
            {
              q: "Can anyone list a token?",
              a: "Yes. The Token Forge lets you deploy a capped, burnable, pausable ERC20 in a single transaction. Once deployed, the token can be paired against zkLTC on the swap router with an oracle or manual price feed.",
            },
            {
              q: "What is the chain ID and how do I add the network?",
              a: "LiteForge runs on chain ID 4441. The RPC, explorer, and one-click \"Add Network\" button are available on the landing page and in the docs at docs.litvm.com.",
            },
            {
              q: "Is the source code open?",
              a: "Yes. The frontend and contract code are open-source on GitHub under the somethingg00/liteforgedex repository. Anyone can audit, fork, or integrate against the deployed contracts.",
            },
          ].map((item) => (
            <Panel key={item.q}>
              <div className="p-5 space-y-2">
                <div className="font-mono font-bold text-ink tracking-wide text-[13px]">
                  {item.q}
                </div>
                <p className="font-mono text-[12px] text-dim2 leading-relaxed">{item.a}</p>
              </div>
            </Panel>
          ))}
        </div>
      </section>

      {/* Links */}
      <section className="space-y-4">
        <h2 className="font-mono text-[11px] tracking-[0.25em] text-dim">▸ LINKS</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Documentation", href: "https://docs.litvm.com/", external: true, soon: false },
            { label: "Explorer", href: "https://liteforge.explorer.caldera.xyz", external: true, soon: false },
            { label: "GitHub — Source", href: "https://github.com/somethingg00/liteforgedex", external: true, soon: false },
            { label: "X / Twitter — @LitecoinVM", href: "https://twitter.com/LitecoinVM", external: true, soon: false },
            { label: "Developer — @ssomethingg00", href: "https://x.com/ssomethingg00", external: true, soon: false },
            { label: "Telegram (Soon)", href: "#", external: false, soon: true },
          ].map((link) =>
            link.soon ? (
              <span
                key={link.label}
                className="flex items-center gap-2 px-4 py-2.5 border border-line2/60 rounded-full bg-panel/30 font-mono text-[12px] text-dim/40 cursor-not-allowed"
              >
                {link.label}
              </span>
            ) : (
              <a
                key={link.label}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                className="flex items-center gap-2 px-4 py-2.5 border border-line2 rounded-full bg-panel/40 font-mono text-[12px] text-dim hover:text-ember hover:border-ember/50 transition-colors"
              >
                {link.label}
                {link.external && <span className="text-[10px]">↗</span>}
              </a>
            )
          )}
        </div>
      </section>

    </div>
  );
}
