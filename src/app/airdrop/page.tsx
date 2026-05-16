"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Panel, PrimaryBtn, Stat, cls } from "@/components/lf";

type AirdropResult = {
  eligible: boolean;
  amount: string;
  tier: string;
  reason: string;
};

type StatsResp = {
  ok: boolean;
  eligibleWallets?: number;
  totalAllocation?: string;
};

const TIERS = [
  { name: "Spark", req: "5+ swaps", amt: "100–500" },
  { name: "Ember", req: "15+ txns", amt: "500–1,500" },
  { name: "Forgemaster", req: "50+ + stake", amt: "2,500+" },
];

export default function AirdropPage() {
  const { address, isConnected } = useAccount();
  const [addr, setAddr] = useState("");
  const [result, setResult] = useState<AirdropResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [err, setErr] = useState("");

  // Stats from server (aggregates only — no addresses)
  const [stats, setStats] = useState<{
    wallets: string;
    pool: string;
  }>({ wallets: "—", pool: "—" });

  // Pre-fill the connected wallet address
  useEffect(() => {
    if (isConnected && address) setAddr(address);
  }, [isConnected, address]);

  // Load aggregate stats
  useEffect(() => {
    let cancelled = false;
    fetch("/api/airdrop/stats")
      .then((r) => r.json())
      .then((data: StatsResp) => {
        if (cancelled || !data.ok) return;
        setStats({
          wallets: (data.eligibleWallets ?? 0).toLocaleString(),
          pool: data.totalAllocation ?? "0",
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const check = async () => {
    setErr("");
    if (!addr || !addr.startsWith("0x") || addr.length !== 42) {
      setErr("enter a full 0x… 42-char wallet address");
      return;
    }
    setChecking(true);
    setResult(null);
    try {
      const r = await fetch(
        `/api/airdrop?address=${encodeURIComponent(addr.toLowerCase())}`,
        { cache: "no-store" }
      );
      const data = await r.json();
      if (!data.ok) {
        setErr(data.error || "lookup failed");
      } else {
        setResult({
          eligible: !!data.eligible,
          amount: data.amount,
          tier: data.tier,
          reason: data.reason,
        });
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "network error");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="page-enter pt-10 max-w-3xl mx-auto space-y-6">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h1 className="font-mono font-extrabold text-2xl tracking-tight text-ink">
          <span className="text-ember">▲</span> AIRDROP · THE ANVIL
        </h1>
        <span className="font-mono text-[10px] tracking-[0.2em] text-dim">
          EPOCH 04 · 12 DAYS LEFT
        </span>
      </div>

      {/* Stats strip */}
      <Panel>
        <div className="grid grid-cols-3 divide-x divide-line">
          <div className="px-5 py-4">
            <Stat label="ALLOCATION POOL" value={stats.pool} unit="LITVM" />
          </div>
          <div className="px-5 py-4">
            <Stat label="ELIGIBLE WALLETS" value={stats.wallets} />
          </div>
          <div className="px-5 py-4">
            <Stat label="EPOCH" value="04" accent />
          </div>
        </div>
      </Panel>

      {/* The Anvil */}
      <Panel
        title="▸ CHECK ELIGIBILITY"
        glow={!!result?.eligible}
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="font-mono text-[10px] tracking-[0.2em] text-dim block mb-2">
              ▸ WALLET ADDRESS
            </label>
            <div className="flex gap-2">
              <input
                value={addr}
                onChange={(e) => {
                  setAddr(e.target.value);
                  setResult(null);
                  setErr("");
                }}
                placeholder="0x…"
                className="lf-input flex-1"
              />
              <PrimaryBtn
                loading={checking}
                onClick={check}
                className="!w-auto !px-6"
                disabled={!addr || addr.length !== 42}
              >
                CHECK
              </PrimaryBtn>
            </div>
            {address && (
              <div className="font-mono text-[10px] text-dim mt-2">
                ▸ try{" "}
                <button
                  onClick={() => {
                    setAddr(address);
                    setErr("");
                  }}
                  className="text-ember hover:underline"
                >
                  your connected address
                </button>
              </div>
            )}
            {err && (
              <div className="font-mono text-[10px] text-warn mt-2">▸ {err}</div>
            )}
          </div>

          {/* Result panel */}
          {result && (
            <div
              className={cls(
                "border rounded-xl p-5 page-enter",
                result.eligible
                  ? "border-ember bg-ember/5"
                  : "border-warn/40 bg-warn/5"
              )}
            >
              {result.eligible ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono text-[10px] tracking-[0.25em] text-emberDim mb-1">
                        ▸ ELIGIBLE
                      </div>
                      <div className="num font-extrabold text-4xl text-ember">
                        {result.amount}{" "}
                        <span className="text-lg text-ink ml-1 font-mono">
                          LITVM
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] tracking-wider text-ember border border-ember/40 px-2 py-1">
                      TIER · {result.tier.toUpperCase()}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-dim2">
                    ▸ {result.reason}
                  </div>
                  <div className="border border-ember/30 bg-ember/5 rounded-xl p-3">
                    <div className="font-mono text-[10px] tracking-[0.2em] text-emberDim mb-1">
                      ▸ ON-CHAIN DISTRIBUTION PENDING
                    </div>
                    <p className="font-mono text-[11px] text-dim2 leading-relaxed">
                      Your allocation is locked in for this epoch. The
                      distributor contract is not live yet — when it opens, the
                      owner will airdrop directly to your wallet. No action
                      required.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="font-mono text-[10px] tracking-[0.25em] text-warn mb-2">
                    ▸ NOT ON THE ANVIL
                  </div>
                  <div className="font-mono text-[12px] text-dim2">
                    {result.reason}
                  </div>
                  <div className="font-mono text-[11px] text-dim mt-3">
                    ▸ accumulate testnet activity (swap · bridge · stake) and
                    check back in epoch 05
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tiers */}
          <div className="pt-4 border-t border-line">
            <div className="font-mono text-[10px] tracking-[0.2em] text-dim mb-3">
              ▸ TIERS
            </div>
            <div className="grid grid-cols-3 gap-2">
              {TIERS.map((t) => (
                <div
                  key={t.name}
                  className="border border-line p-3 rounded-xl"
                >
                  <div className="font-mono font-bold text-ember text-xs tracking-wider">
                    {t.name.toUpperCase()}
                  </div>
                  <div className="font-mono text-[10px] text-dim mt-1">
                    {t.req}
                  </div>
                  <div className="font-mono text-[10px] text-dim2 num mt-0.5">
                    {t.amt} LITVM
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Panel>

    </div>
  );
}
