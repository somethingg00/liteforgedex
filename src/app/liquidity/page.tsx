import Link from "next/link";
import { Panel } from "@/components/lf";

const PLANNED = [
  {
    glyph: "＋",
    title: "Add Liquidity",
    desc: "Deposit a token pair into a pool and receive LP tokens representing your share.",
  },
  {
    glyph: "－",
    title: "Remove Liquidity",
    desc: "Burn your LP tokens to withdraw your proportional share of the pool at any time.",
  },
  {
    glyph: "◎",
    title: "Pool Analytics",
    desc: "Real-time TVL, volume, fee APR, and price-impact data for every active pair.",
  },
  {
    glyph: "▲",
    title: "Fee Earnings",
    desc: "LPs earn a fraction of every swap routed through their pool — automatically compounded.",
  },
];

export default function LiquidityPage() {
  return (
    <div className="pt-10 space-y-10 max-w-3xl mx-auto">

      {/* Header */}
      <div className="space-y-3">
        <div className="font-mono text-[11px] tracking-[0.3em] text-dim">▸ LIQUIDITY</div>
        <h1 className="font-mono font-extrabold text-4xl md:text-5xl tracking-tight text-ink leading-[0.95]">
          Liquidity pools<br />
          <span className="text-ember">coming soon.</span>
        </h1>
        <p className="font-mono text-[14px] text-dim2 leading-relaxed max-w-xl">
          AMM liquidity pools are under active development. In the meantime, swaps
          are settled via the oracle / manual-price engine and native zkLTC reserves.
        </p>
      </div>

      {/* Coming soon badge */}
      <div className="flex items-center gap-3 px-5 py-4 border border-ember/30 bg-ember/5 rounded-2xl">
        <span className="w-2 h-2 rounded-full bg-warn shrink-0" />
        <span className="font-mono text-[12px] text-warn tracking-wider">
          POOL CONTRACTS NOT DEPLOYED · ETA TBD
        </span>
      </div>

      {/* Planned features */}
      <section className="space-y-3">
        <div className="font-mono text-[10px] tracking-[0.25em] text-dim">▸ PLANNED FEATURES</div>
        <div className="grid sm:grid-cols-2 gap-3">
          {PLANNED.map((f) => (
            <Panel key={f.title}>
              <div className="p-5 space-y-2">
                <div className="font-mono text-xl text-ember">{f.glyph}</div>
                <div className="font-mono font-bold text-ink tracking-wide text-[13px]">{f.title}</div>
                <p className="font-mono text-[11px] text-dim2 leading-relaxed">{f.desc}</p>
              </div>
            </Panel>
          ))}
        </div>
      </section>

      {/* Mock pool UI (preview) */}
      <section className="space-y-3">
        <div className="font-mono text-[10px] tracking-[0.25em] text-dim">▸ INTERFACE PREVIEW</div>
        <Panel title="ADD LIQUIDITY · PREVIEW">
          <div className="p-5 space-y-3 opacity-40 pointer-events-none select-none">
            <div>
              <div className="font-mono text-[10px] tracking-[0.2em] text-dim mb-1.5">TOKEN A</div>
              <div className="lf-input flex items-center justify-between">
                <span className="text-dim2 font-mono text-[13px]">0.0</span>
                <span className="font-mono text-[11px] text-dim border border-line px-2 py-0.5 rounded-lg">zkLTC ▾</span>
              </div>
            </div>
            <div className="flex justify-center">
              <span className="font-mono text-ember text-lg">＋</span>
            </div>
            <div>
              <div className="font-mono text-[10px] tracking-[0.2em] text-dim mb-1.5">TOKEN B</div>
              <div className="lf-input flex items-center justify-between">
                <span className="text-dim2 font-mono text-[13px]">0.0</span>
                <span className="font-mono text-[11px] text-dim border border-line px-2 py-0.5 rounded-lg">SELECT ▾</span>
              </div>
            </div>
            <div className="border border-line rounded-xl p-3 space-y-1.5 bg-panel2/40">
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-dim">POOL SHARE</span>
                <span className="text-dim2">—%</span>
              </div>
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-dim">EXCHANGE RATE</span>
                <span className="text-dim2">— zkLTC / token</span>
              </div>
            </div>
            <div className="w-full py-3 bg-ember/30 rounded-xl font-mono text-[11px] tracking-[0.15em] text-center text-bg">
              ADD LIQUIDITY
            </div>
          </div>
        </Panel>
      </section>

      {/* CTA */}
      <div className="flex flex-wrap gap-3 pt-2">
        <Link
          href="/swap"
          className="bracket font-mono text-xs tracking-[0.2em] text-bg bg-ember hover:bg-ember/90 px-5 py-3 transition-colors rounded-xl"
        >
          SWAP INSTEAD
        </Link>
        <Link
          href="/stake"
          className="bracket font-mono text-xs tracking-[0.2em] text-ember border border-ember/40 hover:bg-ember/10 px-5 py-3 transition-colors rounded-xl"
        >
          STAKE LITVM
        </Link>
      </div>

    </div>
  );
}
