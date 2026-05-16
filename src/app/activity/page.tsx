"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useChainId, usePublicClient } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { formatUnits, parseAbiItem } from "viem";
import { GhostBtn, Panel, Stat } from "@/components/lf";
import { shortAddr, formatNumber } from "@/lib/format";
import { CONTRACT_ADDRESS } from "@/lib/chain";
import { findDeployBlock } from "@/lib/deployBlock";

type Kind = "all" | "SWAP" | "BRIDGE_IN" | "BRIDGE_OUT" | "CREATE";
const KINDS: Kind[] = ["all", "SWAP", "BRIDGE_IN", "BRIDGE_OUT", "CREATE"];

type Tx = {
  hash: `0x${string}`;
  kind: Exclude<Kind, "all">;
  detail: string;
  block: bigint;
  ts: number; // unix seconds
};

const SWAPPED = parseAbiItem(
  "event Swapped(address indexed user, address indexed fromToken, address indexed toToken, uint256 amountIn, uint256 amountOut)"
);
const BRIDGED_TO = parseAbiItem(
  "event BridgedToTestEth(address indexed user, uint256 nativeAmount, uint256 testEthAmount)"
);
const BRIDGED_FROM = parseAbiItem(
  "event BridgedFromTestEth(address indexed user, uint256 testEthAmount, uint256 nativeAmount)"
);
const TOKEN_CREATED = parseAbiItem(
  "event TokenCreated(address indexed token, string name, string symbol)"
);

export default function ActivityPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const client = usePublicClient();
  const [filter, setFilter] = useState<Kind>("all");
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    if (!isConnected || !address || !client) return;
    let cancelled = false;
    setLoading(true);
    setErr("");

    (async () => {
      try {
        // Auto-detect contract deploy block on the connected chain (cached
        // per chain in localStorage). Falls back to a 9.5k-block window if
        // detection fails — that's the Alchemy free-tier getLogs cap.
        const head = await client.getBlockNumber();
        const detected = await findDeployBlock(client, CONTRACT_ADDRESS, chainId);
        const LOOKBACK = 9_500n;
        const fromBlock =
          detected !== null
            ? detected
            : head > LOOKBACK
              ? head - LOOKBACK
              : 0n;

        const [swapped, bIn, bOut, created] = await Promise.all([
          client.getLogs({
            address: CONTRACT_ADDRESS,
            event: SWAPPED,
            args: { user: address },
            fromBlock,
            toBlock: "latest",
          }),
          client.getLogs({
            address: CONTRACT_ADDRESS,
            event: BRIDGED_FROM,
            args: { user: address },
            fromBlock,
            toBlock: "latest",
          }),
          client.getLogs({
            address: CONTRACT_ADDRESS,
            event: BRIDGED_TO,
            args: { user: address },
            fromBlock,
            toBlock: "latest",
          }),
          // TokenCreated has no user arg — pull all and filter by tx sender below
          client.getLogs({
            address: CONTRACT_ADDRESS,
            event: TOKEN_CREATED,
            fromBlock,
            toBlock: "latest",
          }),
        ]);

        const createdMine = await Promise.all(
          created.map(async (log) => {
            try {
              const tx = await client.getTransaction({
                hash: log.transactionHash!,
              });
              return tx.from.toLowerCase() === address.toLowerCase()
                ? log
                : null;
            } catch {
              return null;
            }
          })
        );

        const blockSet = new Set<bigint>();
        const collect = (xs: { blockNumber: bigint | null }[]) =>
          xs.forEach((l) => l.blockNumber != null && blockSet.add(l.blockNumber));
        collect(swapped);
        collect(bIn);
        collect(bOut);
        collect(createdMine.filter((x): x is NonNullable<typeof x> => !!x));

        const blocks = await Promise.all(
          Array.from(blockSet).map((bn) =>
            client
              .getBlock({ blockNumber: bn })
              .then((b) => [bn, Number(b.timestamp)] as const)
          )
        );
        const tsMap = new Map<bigint, number>(blocks);

        const out: Tx[] = [];

        for (const log of swapped) {
          if (log.blockNumber == null) continue;
          const { fromToken, toToken, amountIn, amountOut } = log.args as {
            fromToken: `0x${string}`;
            toToken: `0x${string}`;
            amountIn: bigint;
            amountOut: bigint;
          };
          out.push({
            hash: log.transactionHash!,
            kind: "SWAP",
            detail: `${formatNumber(amountIn, 18, 4)} ${shortAddr(fromToken)} → ${formatNumber(amountOut, 18, 4)} ${shortAddr(toToken)}`,
            block: log.blockNumber,
            ts: tsMap.get(log.blockNumber) ?? 0,
          });
        }

        for (const log of bIn) {
          if (log.blockNumber == null) continue;
          const { testEthAmount, nativeAmount } = log.args as {
            testEthAmount: bigint;
            nativeAmount: bigint;
          };
          out.push({
            hash: log.transactionHash!,
            kind: "BRIDGE_IN",
            detail: `Bridged ${formatUnits(testEthAmount, 18)} WETH → ${formatUnits(nativeAmount, 18)} native`,
            block: log.blockNumber,
            ts: tsMap.get(log.blockNumber) ?? 0,
          });
        }

        for (const log of bOut) {
          if (log.blockNumber == null) continue;
          const { nativeAmount, testEthAmount } = log.args as {
            nativeAmount: bigint;
            testEthAmount: bigint;
          };
          out.push({
            hash: log.transactionHash!,
            kind: "BRIDGE_OUT",
            detail: `Bridged ${formatUnits(nativeAmount, 18)} native → ${formatUnits(testEthAmount, 18)} WETH`,
            block: log.blockNumber,
            ts: tsMap.get(log.blockNumber) ?? 0,
          });
        }

        for (const log of createdMine) {
          if (!log || log.blockNumber == null) continue;
          const { token, name, symbol } = log.args as {
            token: `0x${string}`;
            name: string;
            symbol: string;
          };
          out.push({
            hash: log.transactionHash!,
            kind: "CREATE",
            detail: `Deployed ${name} (${symbol}) · ${shortAddr(token)}`,
            block: log.blockNumber,
            ts: tsMap.get(log.blockNumber) ?? 0,
          });
        }

        out.sort((a, b) => Number(b.block - a.block));
        if (!cancelled) setTxs(out);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "fetch failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [address, isConnected, client, chainId, refreshTick]);

  const summary = useMemo(() => {
    const counts = { SWAP: 0, BRIDGE_IN: 0, BRIDGE_OUT: 0, CREATE: 0 };
    for (const t of txs) counts[t.kind]++;
    const days = new Set(txs.map((t) => Math.floor(t.ts / 86400)));

    // Streak: consecutive active days ending today (in user's local TZ).
    const today = Math.floor(Date.now() / 1000 / 86400);
    let streak = 0;
    let d = today;
    while (days.has(d)) {
      streak++;
      d--;
    }
    // If today has no tx but yesterday does, the streak still counts from yesterday.
    if (streak === 0 && days.has(today - 1)) {
      d = today - 1;
      while (days.has(d)) {
        streak++;
        d--;
      }
    }

    return {
      total: txs.length,
      swaps: counts.SWAP,
      bridges: counts.BRIDGE_IN + counts.BRIDGE_OUT,
      creates: counts.CREATE,
      activeDays: days.size,
      streak,
    };
  }, [txs]);

  const daily = useMemo(() => {
    const today = Math.floor(Date.now() / 1000 / 86400);
    const buckets = new Array(28).fill(0);
    for (const t of txs) {
      const day = Math.floor(t.ts / 86400);
      const idx = 27 - (today - day);
      if (idx >= 0 && idx < 28) buckets[idx]++;
    }
    return buckets;
  }, [txs]);

  const filtered = useMemo(
    () => (filter === "all" ? txs : txs.filter((t) => t.kind === filter)),
    [txs, filter]
  );
  const maxC = Math.max(...daily, 1);

  if (!isConnected) {
    return (
      <div className="page-enter pt-20 max-w-md mx-auto text-center">
        <Panel>
          <div className="p-10 space-y-4">
            <div className="font-mono text-[10px] tracking-[0.25em] text-emberDim">
              ▸ WALLET REQUIRED
            </div>
            <h2 className="font-mono font-extrabold text-2xl text-ink">
              Connect to view your activity
            </h2>
            <p className="font-mono text-[12px] text-dim2">
              your testnet history & on-chain volume
            </p>
            <div className="flex justify-center pt-2">
              <ConnectButton />
            </div>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="page-enter pt-10 space-y-6">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h1 className="font-mono font-extrabold text-2xl tracking-tight text-ink">
          <span className="text-ember">▲</span> ACTIVITY
        </h1>
        <span className="font-mono text-[10px] tracking-[0.2em] text-dim flex items-center gap-3 flex-wrap">
          <span>
            WALLET <span className="num text-dim2">{shortAddr(address)}</span>
          </span>
          <span>
            ACTIVE{" "}
            <span className="num text-dim2">{summary.activeDays}D</span>
          </span>
          <span>
            STREAK{" "}
            <span className="num text-ember">
              {summary.streak}D
              {summary.streak >= 3 ? " 🔥" : ""}
            </span>
          </span>
          <button
            onClick={() => setRefreshTick((x) => x + 1)}
            disabled={loading}
            className="text-ember hover:underline disabled:opacity-50"
          >
            {loading ? "▸ LOADING…" : "↻ REFRESH"}
          </button>
        </span>
      </div>

      {err && (
        <div className="border border-warn/40 bg-warn/5 rounded-xl px-4 py-3 font-mono text-[11px] text-warn">
          ▸ {err}
        </div>
      )}

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-4">
        <Panel className="relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.08] pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 80% 20%, #9FFF3C, transparent 50%)",
            }}
          />
          <div className="relative p-6">
            <div className="font-mono text-[10px] tracking-[0.25em] text-emberDim mb-2">
              ▸ TOTAL ON-CHAIN ACTIONS
            </div>
            <div className="flex items-baseline gap-3">
              <span className="num font-extrabold text-6xl text-ember leading-none">
                {summary.total}
              </span>
              <span className="font-mono text-xs text-dim">
                / {summary.activeDays} active days
              </span>
            </div>
            <div className="grid grid-cols-5 gap-3 mt-6 pt-6 border-t border-line">
              <Stat label="SWAPS" value={summary.swaps} size="sm" accent />
              <Stat label="BRIDGES" value={summary.bridges} size="sm" />
              <Stat label="CREATES" value={summary.creates} size="sm" />
              <Stat label="DAYS" value={summary.activeDays} size="sm" />
              <Stat
                label="STREAK"
                value={`${summary.streak}D`}
                size="sm"
                accent
              />
            </div>
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="font-mono text-[10px] tracking-[0.25em] text-dim mb-2">
            ▸ ACTIVITY MIX
          </div>
          {summary.total === 0 ? (
            <div className="font-mono text-[11px] text-dim2 mt-4">
              ▸ no on-chain actions yet · try a swap or bridge
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {[
                { kind: "SWAP", count: summary.swaps, color: "#9FFF3C" },
                { kind: "BRIDGE", count: summary.bridges, color: "#3DD9FF" },
                { kind: "CREATE", count: summary.creates, color: "#C77DFF" },
              ].map((b) => {
                const pct =
                  summary.total > 0
                    ? Math.round((b.count / summary.total) * 100)
                    : 0;
                return (
                  <div key={b.kind}>
                    <div className="flex justify-between font-mono text-[10px] mb-1">
                      <span className="text-dim2">{b.kind}</span>
                      <span className="num text-ink">
                        {b.count} · {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-panel2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: b.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      {(() => {
        const MONTHS = [
          "JAN","FEB","MAR","APR","MAY","JUN",
          "JUL","AUG","SEP","OCT","NOV","DEC",
        ];
        const dayDate = (offset: number) => {
          const d = new Date();
          d.setHours(0, 0, 0, 0);
          d.setDate(d.getDate() - offset);
          return d;
        };
        const fmt = (d: Date) =>
          `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]}`;
        const fmtFull = (d: Date) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const startDate = dayDate(27);
        const endDate = dayDate(0);
        const rangeLabel = `${fmt(startDate)} → ${fmt(endDate)}`;
        return (
          <Panel title={`▸ ACTIVITY · LAST 28 DAYS · ${rangeLabel}`}>
            <div className="p-5">
              <div className="flex gap-1.5 items-end h-24">
                {daily.map((c, i) => {
                  const h = Math.max(4, (c / maxC) * 100);
                  const d = dayDate(27 - i);
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-1 group"
                    >
                      <div
                        className="w-full rounded-t-sm transition-all hover:brightness-125"
                        style={{
                          height: `${h}%`,
                          background:
                            c === 0
                              ? "#1A2520"
                              : c < 3
                                ? "#2E4A18"
                                : c < 6
                                  ? "#5FAA22"
                                  : "#9FFF3C",
                          minHeight: "4px",
                        }}
                        title={`${fmtFull(d)} · ${c} txn`}
                      />
                    </div>
                  );
                })}
              </div>
              {/* Date axis: every 7th day label under bars */}
              <div className="flex gap-1.5 mt-1.5">
                {daily.map((_, i) => {
                  const d = dayDate(27 - i);
                  const show = i === 0 || i === 7 || i === 14 || i === 21 || i === 27;
                  return (
                    <div
                      key={i}
                      className="flex-1 text-center font-mono text-[9px] tracking-wider text-dim2 num"
                    >
                      {show ? fmt(d) : ""}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between font-mono text-[9px] tracking-wider text-dim mt-3">
                <span className="num">{fmt(startDate)} · 28D AGO</span>
                <span className="flex items-center gap-2">
                  <span className="text-dim2">LESS</span>
                  <span className="w-2 h-2" style={{ background: "#1A2520" }} />
                  <span className="w-2 h-2" style={{ background: "#2E4A18" }} />
                  <span className="w-2 h-2" style={{ background: "#5FAA22" }} />
                  <span className="w-2 h-2" style={{ background: "#9FFF3C" }} />
                  <span className="text-dim2">MORE</span>
                </span>
                <span className="num">{fmt(endDate)} · TODAY</span>
              </div>
            </div>
          </Panel>
        );
      })()}

      <Panel title={`▸ TRANSACTION LOG · ${filtered.length} ENTRIES`}>
        <div className="p-4 border-b border-line flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <GhostBtn
              key={k}
              onClick={() => setFilter(k)}
              active={filter === k}
            >
              {k}
            </GhostBtn>
          ))}
        </div>
        <div className="divide-y divide-line">
          {loading && filtered.length === 0 && (
            <div className="px-5 py-8 text-center font-mono text-xs text-dim">
              ▸ scanning chain…
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="px-5 py-8 text-center font-mono text-xs text-dim">
              ▸ no entries
            </div>
          )}
          {filtered.map((tx) => (
            <div
              key={`${tx.hash}-${tx.kind}`}
              className="grid grid-cols-[100px_1fr_auto] gap-4 items-center px-5 py-3 hover:bg-ember/[0.02] transition-colors"
            >
              <span className="font-mono text-[10px] tracking-[0.18em] text-ember">
                {tx.kind}
              </span>
              <div className="min-w-0">
                <div className="font-mono text-[12px] text-ink truncate">
                  {tx.detail}
                </div>
                <div className="font-mono text-[10px] text-dim num truncate">
                  {shortAddr(tx.hash)} · blk #{tx.block.toString()}
                </div>
              </div>
              <span className="font-mono text-[10px] text-emberDim whitespace-nowrap">
                ▸ {timeAgo(tx.ts)}
              </span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function timeAgo(ts: number): string {
  if (!ts) return "—";
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
