"use client";

import { useMemo, useState } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { swapAbi, erc20Abi } from "@/lib/abi";
import { CONTRACT_ADDRESS } from "@/lib/chain";
import { GhostBtn, Stat, TokenGlyph } from "@/components/lf";
import { shortAddr } from "@/lib/format";
import { ICON_LIBRARY } from "@/lib/tokenIcons";

function formatSupply(supply: bigint, decimals: number | undefined): string {
  const d =
    typeof decimals === "number" && Number.isFinite(decimals) && decimals > 0
      ? decimals
      : 18;
  const divisor = 10n ** BigInt(d);
  const whole = supply / divisor;
  const frac = supply % divisor;
  const wholeStr = whole.toLocaleString("en-US");
  if (frac === 0n) return wholeStr;
  const fracStr = frac
    .toString()
    .padStart(d, "0")
    .slice(0, 6)
    .replace(/0+$/, "");
  return fracStr ? `${wholeStr}.${fracStr}` : wholeStr;
}

type Filter = "all" | "registered" | "unregistered";

export default function TokensPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const { data: deployed } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: swapAbi,
    functionName: "check_all_deploy_tokens",
  });

  const { data: registered } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: swapAbi,
    functionName: "getRegisteredTokens",
  });

  const { data: testEthAddr } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: swapAbi,
    functionName: "testEthAddress",
  });

  const tokenList = (deployed as `0x${string}`[] | undefined) ?? [];
  const registeredSet = useMemo(
    () =>
      new Set(
        ((registered as `0x${string}`[] | undefined) ?? []).map((a) =>
          a.toLowerCase()
        )
      ),
    [registered]
  );

  const metaContracts = useMemo(
    () =>
      tokenList.flatMap((t) => [
        { address: t, abi: erc20Abi, functionName: "name" } as const,
        { address: t, abi: erc20Abi, functionName: "symbol" } as const,
        { address: t, abi: erc20Abi, functionName: "decimals" } as const,
        { address: t, abi: erc20Abi, functionName: "totalSupply" } as const,
      ]),
    [tokenList]
  );

  const { data: metas } = useReadContracts({
    contracts: metaContracts,
    query: { enabled: tokenList.length > 0 },
  });

  const enriched = tokenList.map((addr, i) => {
    const name = metas?.[i * 4]?.result as string | undefined;
    const symbol = metas?.[i * 4 + 1]?.result as string | undefined;
    const decimals = metas?.[i * 4 + 2]?.result as number | undefined;
    const supply = metas?.[i * 4 + 3]?.result as bigint | undefined;
    return {
      address: addr,
      name: name ?? "—",
      symbol: symbol ?? "?",
      decimals,
      supply,
      registered: registeredSet.has(addr.toLowerCase()),
      isTestEth:
        !!testEthAddr &&
        (testEthAddr as string).toLowerCase() === addr.toLowerCase(),
    };
  });

  const list = enriched
    .filter((t) =>
      filter === "all" ? true : filter === "registered" ? t.registered : !t.registered
    )
    .filter((t) => {
      if (!q) return true;
      const lc = q.toLowerCase();
      return (
        t.symbol.toLowerCase().includes(lc) ||
        t.name.toLowerCase().includes(lc) ||
        t.address.toLowerCase().includes(lc)
      );
    });

  const copy = (a: string) => {
    navigator.clipboard?.writeText(a);
    setCopied(a);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="pt-10 space-y-6">
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <h1 className="font-mono font-extrabold text-2xl tracking-tight text-ink">
          <span className="text-ember">▲</span> TOKENS
        </h1>
        <span className="font-mono text-[10px] tracking-[0.2em] text-dim">
          {tokenList.length} DEPLOYED · {registeredSet.size} REGISTERED
        </span>
      </div>

      {/* Filter + search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {(["all", "registered", "unregistered"] as Filter[]).map((id) => (
            <GhostBtn
              key={id}
              onClick={() => setFilter(id)}
              active={filter === id}
            >
              {id.toUpperCase()}
            </GhostBtn>
          ))}
        </div>
        <input
          className="lf-input flex-1 min-w-[220px] max-w-md"
          placeholder="search by symbol / name / 0x…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Token grid */}
      <div className="grid md:grid-cols-2 gap-3">
        {list.map((t) => (
          <div
            key={t.address}
            className="border border-line bg-panel hover:border-ember/30 transition-colors p-5 rounded-xl"
          >
            <div className="flex items-start gap-4">
              <TokenGlyph
                symbol={t.symbol}
                size={42}
                iconUrl={
                  ICON_LIBRARY[`${t.symbol.toLowerCase()}.png`] ||
                  ICON_LIBRARY[`${t.symbol.toLowerCase()}.jpg`] ||
                  ICON_LIBRARY[`${t.symbol.toLowerCase()}.svg`]
                }
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-ink">{t.symbol}</span>
                  {t.registered ? (
                    <span className="font-mono text-[9px] tracking-wider text-ember border border-ember/40 px-1.5 py-0.5">
                      REGISTERED
                    </span>
                  ) : (
                    <span className="font-mono text-[9px] tracking-wider text-dim border border-line2 px-1.5 py-0.5">
                      UNREGISTERED
                    </span>
                  )}
                  {t.isTestEth && (
                    <span className="font-mono text-[9px] tracking-wider text-spark border border-spark/40 px-1.5 py-0.5">
                      GAS · zkLTC
                    </span>
                  )}
                </div>
                <div className="text-dim2 text-[12px] mt-0.5">{t.name}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-mono text-[10px] text-dim num">
                    {shortAddr(t.address)}
                  </span>
                  <button
                    onClick={() => copy(t.address)}
                    className="font-mono text-[10px] text-dim2 hover:text-ember"
                  >
                    {copied === t.address ? "✓ COPIED" : "COPY"}
                  </button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-line">
              <Stat label="DECIMALS" value={t.decimals ?? "—"} size="sm" />
              <Stat
                label="SUPPLY"
                value={
                  t.supply !== undefined
                    ? formatSupply(t.supply, t.decimals)
                    : "—"
                }
                size="sm"
                accent
              />
            </div>
          </div>
        ))}
      </div>
      {list.length === 0 && (
        <div className="text-center py-16 font-mono text-sm text-dim">
          ▸ no tokens match
        </div>
      )}
    </div>
  );
}
