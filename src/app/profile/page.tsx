"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useBalance, useChainId, usePublicClient } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { erc20Abi, swapAbi } from "@/lib/abi";
import { CONTRACT_ADDRESS } from "@/lib/chain";
import { Panel, Stat, cls } from "@/components/lf";
import { formatCompact, formatNumber, shortAddr } from "@/lib/format";

type TokenRow = {
  address: `0x${string}`;
  name: string;
  symbol: string;
  decimals: number;
  balance: bigint;
  totalSupply: bigint;
  // optional price (chainlink-style int with 8 decimals)
  price: bigint | null;
};

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      title={copied ? "Copied" : "Copy"}
      className="text-dim hover:text-ember transition-colors shrink-0"
    >
      {copied ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const client = usePublicClient();
  const { data: nativeBal } = useBalance({ address });

  const [rows, setRows] = useState<TokenRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!isConnected || !address || !client) return;
    let cancelled = false;
    setLoading(true);
    setErr("");

    (async () => {
      try {
        // 1) Pull deployed token list from the swap contract
        const list = (await client.readContract({
          address: CONTRACT_ADDRESS,
          abi: swapAbi,
          functionName: "getRegisteredTokens",
        })) as `0x${string}`[];

        // 2) For each token, batch-read metadata + balance + price
        const out: TokenRow[] = await Promise.all(
          list.map(async (token) => {
            const [name, symbol, decimals, balance, totalSupply, paired] =
              await Promise.all([
                client
                  .readContract({
                    address: token,
                    abi: erc20Abi,
                    functionName: "name",
                  })
                  .catch(() => "Unknown"),
                client
                  .readContract({
                    address: token,
                    abi: erc20Abi,
                    functionName: "symbol",
                  })
                  .catch(() => "???"),
                client
                  .readContract({
                    address: token,
                    abi: erc20Abi,
                    functionName: "decimals",
                  })
                  .catch(() => 18),
                client
                  .readContract({
                    address: token,
                    abi: erc20Abi,
                    functionName: "balanceOf",
                    args: [address],
                  })
                  .catch(() => 0n),
                client
                  .readContract({
                    address: token,
                    abi: erc20Abi,
                    functionName: "totalSupply",
                  })
                  .catch(() => 0n),
                client
                  .readContract({
                    address: CONTRACT_ADDRESS,
                    abi: swapAbi,
                    functionName: "contract_to_paird_address",
                    args: [token],
                  })
                  .catch(() => "0x0000000000000000000000000000000000000000"),
              ]);

            // Try price via paired feed (chainlink convention: 8-dec int).
            let price: bigint | null = null;
            const pairedAddr = paired as string;
            if (
              pairedAddr &&
              pairedAddr !== "0x0000000000000000000000000000000000000000"
            ) {
              try {
                price = (await client.readContract({
                  address: CONTRACT_ADDRESS,
                  abi: swapAbi,
                  functionName: "getPriceByAddress",
                  args: [pairedAddr as `0x${string}`],
                })) as bigint;
              } catch {
                price = null;
              }
            }

            return {
              address: token,
              name: name as string,
              symbol: symbol as string,
              decimals: Number(decimals),
              balance: balance as bigint,
              totalSupply: totalSupply as bigint,
              price,
            };
          })
        );

        if (!cancelled) setRows(out);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "fetch failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [address, isConnected, client, chainId, refresh]);

  // Derived stats
  const heldRows = useMemo(
    () => rows.filter((r) => r.balance > 0n),
    [rows]
  );

  const totalUsd = useMemo(() => {
    let total = 0;
    for (const r of rows) {
      if (r.price == null || r.balance === 0n) continue;
      const human = Number(r.balance) / 10 ** r.decimals;
      const usd = (Number(r.price) / 1e8) * human;
      if (Number.isFinite(usd)) total += usd;
    }
    return total;
  }, [rows]);

  if (!isConnected) {
    return (
      <div className="page-enter pt-20 max-w-md mx-auto text-center">
        <Panel>
          <div className="p-10 space-y-4">
            <div className="font-mono text-[10px] tracking-[0.25em] text-emberDim">
              ▸ WALLET REQUIRED
            </div>
            <h2 className="font-mono font-extrabold text-2xl text-ink">
              Connect to view your portfolio
            </h2>
            <p className="font-mono text-[12px] text-dim2">
              your balances across every token deployed on LiteForge
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
          <span className="text-ember">▲</span> PROFILE · PORTFOLIO
        </h1>
        <span className="font-mono text-[10px] tracking-[0.2em] text-dim flex items-center gap-3">
          <span>
            WALLET <span className="num text-dim2">{shortAddr(address)}</span>
          </span>
          <button
            onClick={() => setRefresh((x) => x + 1)}
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

      {/* Stat strip */}
      <Panel>
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-line">
          <div className="px-5 py-4">
            <Stat
              label="NATIVE"
              value={
                nativeBal
                  ? formatNumber(nativeBal.value, nativeBal.decimals, 4)
                  : "—"
              }
              unit={nativeBal?.symbol ?? "zkLTC"}
            />
          </div>
          <div className="px-5 py-4">
            <Stat
              label="TOKENS HELD"
              value={heldRows.length}
              unit={`/ ${rows.length}`}
              accent
            />
          </div>
          <div className="px-5 py-4">
            <Stat
              label="EST. VALUE"
              value={totalUsd > 0 ? `$${totalUsd.toFixed(2)}` : "—"}
              accent
            />
          </div>
          <div className="px-5 py-4">
            <Stat label="REGISTERED" value={rows.length} unit="tokens" />
          </div>
        </div>
      </Panel>

      {/* Two-column: holdings on the left, full registered list on the right */}
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        {/* HELD TOKENS */}
        <Panel
          title={`▸ TOKEN HOLDINGS · ${heldRows.length} HELD`}
          glow={heldRows.length > 0}
        >
          {loading && rows.length === 0 && (
            <div className="px-5 py-10 text-center font-mono text-xs text-dim">
              ▸ scanning chain for token list…
            </div>
          )}
          {!loading && heldRows.length === 0 && (
            <div className="px-5 py-10 text-center font-mono text-xs text-dim">
              ▸ no tokens held yet · try a SWAP to acquire some
            </div>
          )}
          <div className="divide-y divide-line">
            {heldRows.map((r) => {
              const human = Number(r.balance) / 10 ** r.decimals;
              const usd =
                r.price != null ? (Number(r.price) / 1e8) * human : null;
              return (
                <div
                  key={r.address}
                  className="grid grid-cols-[110px_1fr_auto] gap-3 items-center px-5 py-4 bg-ember/[0.02]"
                >
                  <div>
                    <div className="font-mono font-bold text-sm text-ember">
                      {r.symbol}
                    </div>
                    <div className="font-mono text-[10px] text-dim truncate">
                      {r.name}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] text-dim flex items-center gap-1.5 mb-0.5">
                      <span className="num text-dim2 truncate">
                        {shortAddr(r.address)}
                      </span>
                      <CopyBtn text={r.address} />
                    </div>
                    <div className="num font-bold text-lg text-ink">
                      {formatNumber(r.balance, r.decimals, 4)}{" "}
                      <span className="font-mono text-xs text-dim ml-1">
                        {r.symbol}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    {usd != null && (
                      <div className="num text-ember font-bold text-sm">
                        ${usd.toFixed(2)}
                      </div>
                  )}
                    {r.price != null && (
                      <div className="font-mono text-[10px] text-dim num">
                        @ ${(Number(r.price) / 1e8).toFixed(4)}
                      </div>
                    )}
                    {r.price == null && (
                      <div className="font-mono text-[10px] text-dim">
                        no feed
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* ALL REGISTERED TOKENS — discovery / catalog */}
        <Panel title={`▸ REGISTERED TOKENS · ${rows.length} ON-CHAIN`}>
          {loading && rows.length === 0 && (
            <div className="px-5 py-10 text-center font-mono text-xs text-dim">
              ▸ loading…
            </div>
          )}
          {!loading && rows.length === 0 && (
            <div className="px-5 py-10 text-center font-mono text-xs text-dim">
              ▸ no tokens registered yet
            </div>
          )}
          <div className="divide-y divide-line max-h-[640px] overflow-y-auto">
            {rows.map((r) => {
              const owned = r.balance > 0n;
              return (
                <div
                  key={r.address}
                  className={cls(
                    "px-4 py-3 transition-colors hover:bg-ember/[0.02]",
                    !owned && "opacity-70"
                  )}
                >
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <div className="flex items-baseline gap-2 min-w-0">
                      <span className="font-mono font-bold text-xs text-ember shrink-0">
                        {r.symbol}
                      </span>
                      <span className="font-mono text-[10px] text-dim2 truncate">
                        {r.name}
                      </span>
                    </div>
                    {owned ? (
                      <span className="font-mono text-[9px] tracking-[0.18em] text-ember border border-ember/40 px-1.5 py-0.5 shrink-0">
                        HELD
                      </span>
                    ) : (
                      <span className="font-mono text-[9px] tracking-[0.18em] text-dim shrink-0">
                        —
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[10px] text-dim flex items-center gap-1.5">
                    <span className="num text-dim2 truncate">
                      {shortAddr(r.address)}
                    </span>
                    <CopyBtn text={r.address} />
                  </div>
                  <div className="flex justify-between font-mono text-[10px] text-dim mt-1">
                    <span>
                      supply{" "}
                      <span className="num text-dim2">
                        {formatNumber(r.totalSupply, 36, 0)}
                      </span>
                    </span>
                    {r.price != null ? (
                      <span className="num text-emberDim">
                        ${(Number(r.price) / 1e8).toFixed(4)}
                      </span>
                    ) : (
                      <span className="text-dim">no feed</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}
