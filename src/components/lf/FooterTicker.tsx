"use client";

import { useEffect, useState } from "react";
import { useChainId, usePublicClient } from "wagmi";
import { formatUnits, parseAbiItem } from "viem";
import { CONTRACT_ADDRESS } from "@/lib/chain";
import { shortAddr } from "@/lib/format";
import { findDeployBlock } from "@/lib/deployBlock";

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

type Item = {
  key: string;
  text: string;
  ts: number; // unix seconds, 0 = unknown
};

const FALLBACK: Item[] = [
  { key: "wait", text: "waiting for first on-chain event…", ts: 0 },
];

const LOOKBACK_BLOCKS = 5_000n; // fallback window — safely under Alchemy's 10k-block cap

// Block timestamps never change — cache them across re-renders and polls
const blockTsCache = new Map<bigint, number>();

export function FooterTicker() {
  const client = usePublicClient();
  const chainId = useChainId();
  const [items, setItems] = useState<Item[]>(FALLBACK);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  // tick clock for "Xs ago" labels — 30s is precise enough, saves 60 re-renders/min
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 30_000);
    return () => clearInterval(id);
  }, []);

  // initial load + poll every 15s
  useEffect(() => {
    if (!client) return;
    let cancelled = false;

    const load = async () => {
      try {
        const head = await client.getBlockNumber();
        // Auto-detect deploy block on the connected chain (cached per-chain
        // in localStorage). Fall back to a 5k-block window on RPC failure.
        const detected = await findDeployBlock(client, CONTRACT_ADDRESS, chainId);
        const fromBlock =
          detected !== null
            ? detected
            : head > LOOKBACK_BLOCKS
              ? head - LOOKBACK_BLOCKS
              : 0n;

        const [swapped, bIn, bOut, created] = await Promise.all([
          client.getLogs({
            address: CONTRACT_ADDRESS,
            event: SWAPPED,
            fromBlock,
            toBlock: "latest",
          }),
          client.getLogs({
            address: CONTRACT_ADDRESS,
            event: BRIDGED_FROM,
            fromBlock,
            toBlock: "latest",
          }),
          client.getLogs({
            address: CONTRACT_ADDRESS,
            event: BRIDGED_TO,
            fromBlock,
            toBlock: "latest",
          }),
          client.getLogs({
            address: CONTRACT_ADDRESS,
            event: TOKEN_CREATED,
            fromBlock,
            toBlock: "latest",
          }),
        ]);

        type Raw = {
          blockNumber: bigint;
          logIndex: number;
          text: string;
        };
        const raw: Raw[] = [];

        for (const l of swapped) {
          if (l.blockNumber == null) continue;
          const a = l.args as {
            user: `0x${string}`;
            fromToken: `0x${string}`;
            toToken: `0x${string}`;
            amountIn: bigint;
            amountOut: bigint;
          };
          raw.push({
            blockNumber: l.blockNumber,
            logIndex: l.logIndex ?? 0,
            text: `${shortAddr(a.user)} swapped ${formatUnits(a.amountIn, 18)} ${shortAddr(a.fromToken)} → ${shortAddr(a.toToken)}`,
          });
        }
        for (const l of bIn) {
          if (l.blockNumber == null) continue;
          const a = l.args as {
            user: `0x${string}`;
            testEthAmount: bigint;
            nativeAmount: bigint;
          };
          raw.push({
            blockNumber: l.blockNumber,
            logIndex: l.logIndex ?? 0,
            text: `${shortAddr(a.user)} bridged ${formatUnits(a.testEthAmount, 18)} WETH → native`,
          });
        }
        for (const l of bOut) {
          if (l.blockNumber == null) continue;
          const a = l.args as {
            user: `0x${string}`;
            nativeAmount: bigint;
            testEthAmount: bigint;
          };
          raw.push({
            blockNumber: l.blockNumber,
            logIndex: l.logIndex ?? 0,
            text: `${shortAddr(a.user)} bridged ${formatUnits(a.nativeAmount, 18)} native → WETH`,
          });
        }
        for (const l of created) {
          if (l.blockNumber == null) continue;
          const a = l.args as {
            token: `0x${string}`;
            name: string;
            symbol: string;
          };
          raw.push({
            blockNumber: l.blockNumber,
            logIndex: l.logIndex ?? 0,
            text: `deployed token · ${a.symbol} (${shortAddr(a.token)})`,
          });
        }

        raw.sort(
          (a, b) =>
            Number(b.blockNumber - a.blockNumber) || b.logIndex - a.logIndex
        );
        const top = raw.slice(0, 12);

        // Only fetch timestamps for blocks not already cached
        const uniq = Array.from(new Set(top.map((r) => r.blockNumber)))
          .filter((bn) => !blockTsCache.has(bn));
        await Promise.all(
          uniq.map((bn) =>
            client
              .getBlock({ blockNumber: bn })
              .then((b) => { blockTsCache.set(bn, Number(b.timestamp)); })
              .catch(() => {})
          )
        );
        const tsMap = blockTsCache;

        const built: Item[] = top.map((r) => ({
          key: `${r.blockNumber}-${r.logIndex}`,
          text: r.text,
          ts: tsMap.get(r.blockNumber) ?? 0,
        }));

        if (!cancelled) {
          setItems(built.length > 0 ? built : FALLBACK);
        }
      } catch {
        // silently keep last items
      }
    };

    load();
    const id = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [client, chainId]);

  // Duplicate items so the marquee track loops seamlessly
  const display = [...items, ...items];

  return (
    <footer className="border-t border-line bg-panel mt-16 relative z-10">
      <div className="max-w-7xl mx-auto px-6 h-10 flex items-center gap-4 overflow-hidden">
        <div className="shrink-0 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-ember pulse-dot" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-ember">
            LIVE
          </span>
        </div>
        <div className="flex-1 overflow-hidden relative">
          <div className="ticker-track flex gap-8 whitespace-nowrap font-mono text-[11px] text-dim2 num">
            {display.map((e, i) => (
              <span key={`${e.key}-${i}`} className="flex items-center gap-2">
                <span className="text-emberDim">▸</span>
                {e.text}
                {e.ts > 0 && (
                  <>
                    <span className="text-dim ml-2">·</span>
                    <span className="text-dim">{ago(now - e.ts)}</span>
                  </>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="max-w-7xl mx-auto px-6 h-10 flex items-center justify-between font-mono text-[10px] tracking-[0.18em] text-dim flex-wrap gap-2">
          <span>LITEFORGE TESTNET · CHAIN 4441 · GAS zkLTC · GOV LITVM</span>
          <span className="num">
            CT {CONTRACT_ADDRESS.slice(0, 8)}…{CONTRACT_ADDRESS.slice(-4)}
          </span>
        </div>
      </div>
    </footer>
  );
}

function ago(diffSec: number): string {
  if (diffSec < 0) diffSec = 0;
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}
