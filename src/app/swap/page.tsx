"use client";

import { useEffect, useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { swapAbi, erc20Abi } from "@/lib/abi";
import { CONTRACT_ADDRESS } from "@/lib/chain";
import { formatNumber } from "@/lib/format";
import {
  Panel,
  PrimaryBtn,
  GhostBtn,
  TokenGlyph,
  TokenPicker,
  Toast,
  cls,
  type PickerToken,
} from "@/components/lf";

type TokenMeta = { name: string; symbol: string; decimals: number };

export default function SwapPage() {
  const { address, isConnected } = useAccount();
  const [tab, setTab] = useState<"swap" | "buy">("swap");
  const [fromToken, setFromToken] = useState<string>("");
  const [toToken, setToToken] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [pickerSide, setPickerSide] = useState<"from" | "to" | null>(null);
  const [toast, setToast] = useState("");
  // Slippage tolerance in basis points (50 = 0.5 %). Audit fix C-02.
  const [slippageBps, setSlippageBps] = useState<number>(50);
  // Tx deadline in minutes from "now". Audit fix C-02.
  const [deadlineMin, setDeadlineMin] = useState<number>(20);

  const { data: tokens } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: swapAbi,
    functionName: "getRegisteredTokens",
  });

  const { data: testEthAddr } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: swapAbi,
    functionName: "testEthAddress",
  });

  const tokenList = (tokens as `0x${string}`[] | undefined) ?? [];

  const metaContracts = useMemo(
    () =>
      tokenList.flatMap((t) => [
        { address: t, abi: erc20Abi, functionName: "name" } as const,
        { address: t, abi: erc20Abi, functionName: "symbol" } as const,
        { address: t, abi: erc20Abi, functionName: "decimals" } as const,
      ]),
    [tokenList]
  );

  const { data: metaResults } = useReadContracts({
    contracts: metaContracts,
    query: { enabled: tokenList.length > 0 },
  });

  const tokenMeta = useMemo(() => {
    const out: Record<string, TokenMeta> = {};
    if (!metaResults) return out;
    tokenList.forEach((addr, i) => {
      const n = metaResults[i * 3]?.result as string | undefined;
      const sym = metaResults[i * 3 + 1]?.result as string | undefined;
      const dec = metaResults[i * 3 + 2]?.result as number | undefined;
      out[addr.toLowerCase()] = {
        name: n ?? "?",
        symbol: sym ?? "?",
        decimals: dec ?? 18,
      };
    });
    return out;
  }, [metaResults, tokenList]);

  // Default fromToken to WETH/zkLTC
  useEffect(() => {
    if (!fromToken && testEthAddr) setFromToken(testEthAddr as string);
  }, [fromToken, testEthAddr]);

  // Default toToken to first non-from token
  useEffect(() => {
    if (!toToken && tokenList.length > 0) {
      const first = tokenList.find(
        (t) => !fromToken || t.toLowerCase() !== fromToken.toLowerCase()
      );
      setToToken(first ?? tokenList[0]);
    }
  }, [tokenList, toToken, fromToken]);

  const sellMeta: TokenMeta = tokenMeta[fromToken.toLowerCase()] ?? {
    name: "zkLTC",
    symbol: "zkLTC",
    decimals: 18,
  };
  const buyMeta = tokenMeta[toToken.toLowerCase()];

  const parsedIn = (() => {
    if (!amount) return 0n;
    try {
      return parseUnits(amount, sellMeta.decimals);
    } catch {
      return 0n;
    }
  })();

  const { data: quote } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: swapAbi,
    functionName: "getSwapQuote",
    args:
      fromToken && toToken && parsedIn > 0n
        ? [fromToken as `0x${string}`, toToken as `0x${string}`, parsedIn]
        : undefined,
    query: { enabled: !!fromToken && !!toToken && parsedIn > 0n },
  });

  const { data: sellBalance, refetch: refetchSellBalance } = useReadContract({
    address: fromToken as `0x${string}` | undefined,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!fromToken },
  });

  const { data: buyBalance, refetch: refetchBuyBalance } = useReadContract({
    address: toToken as `0x${string}` | undefined,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address && toToken ? [address] : undefined,
    query: { enabled: !!address && !!toToken },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: fromToken as `0x${string}` | undefined,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, CONTRACT_ADDRESS] : undefined,
    query: {
      enabled:
        !!address &&
        !!fromToken &&
        fromToken !== "0x0000000000000000000000000000000000000000",
    },
  });

  const needsApproval =
    parsedIn > 0n && (allowance as bigint | undefined ?? 0n) < parsedIn;

  const { writeContract, data: hash, isPending, error, isError, reset } =
    useWriteContract();
  const { isLoading: mining, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) {
      refetchAllowance();
      refetchSellBalance();
      refetchBuyBalance();
      setToast(needsApproval ? "Approved · ready to swap" : "Swap confirmed ✓");
      if (!needsApproval) setAmount("");
    }
    // intentionally only run when isSuccess flips
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  const onSubmit = () => {
    reset();
    if (!fromToken || !toToken || parsedIn === 0n) return;
    if (needsApproval) {
      writeContract({
        address: fromToken as `0x${string}`,
        abi: erc20Abi,
        functionName: "approve",
        args: [CONTRACT_ADDRESS, parsedIn],
      });
    } else {
      // Slippage + deadline (audit fix C-02). amountOutMin = quote * (1 - bps/10000).
      const q = (quote as bigint | undefined) ?? 0n;
      const bps = BigInt(Math.max(0, Math.min(slippageBps, 10000)));
      const amountOutMin = (q * (10000n - bps)) / 10000n;
      const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineMin * 60);
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: swapAbi,
        functionName: "swap",
        args: [
          fromToken as `0x${string}`,
          toToken as `0x${string}`,
          parsedIn,
          amountOutMin,
          deadline,
        ],
      });
    }
  };

  const flip = () => {
    const f = fromToken;
    setFromToken(toToken);
    setToToken(f);
    setAmount("");
  };

  const formattedQuote =
    quote !== undefined && buyMeta ? formatNumber(quote as bigint, buyMeta.decimals) : "0";

  const sellBalanceStr =
    sellBalance !== undefined ? formatNumber(sellBalance as bigint, sellMeta.decimals, 4) : "0";
  const buyBalanceStr =
    buyBalance !== undefined && buyMeta
      ? formatNumber(buyBalance as bigint, buyMeta.decimals, 4)
      : "0";

  const trending = tokenList
    .filter((t) => !fromToken || t.toLowerCase() !== fromToken.toLowerCase())
    .slice(0, 6);

  const ctaLabel = !isConnected
    ? "CONNECT WALLET"
    : !amount || parsedIn === 0n
    ? "ENTER AN AMOUNT"
    : isPending
    ? "CONFIRMING…"
    : mining
    ? "MINING…"
    : needsApproval
    ? `APPROVE ${sellMeta.symbol}`
    : `SWAP ${sellMeta.symbol} → ${buyMeta?.symbol ?? ""}`;

  const pickerTokens: PickerToken[] = tokenList.map((t) => {
    const m = tokenMeta[t.toLowerCase()];
    return {
      address: t,
      symbol: m?.symbol ?? "?",
      name: m?.name ?? "Token",
      registered: true,
    };
  });

  return (
    <div className="max-w-xl mx-auto pt-10 space-y-4">
      {/* PAGE HEADER */}
      <div className="flex items-baseline justify-between">
        <h1 className="font-mono font-extrabold text-2xl tracking-tight text-ink">
          <span className="text-ember">▲</span> SWAP
        </h1>
        <span className="font-mono text-[10px] tracking-[0.2em] text-dim">/ROUTE 01</span>
      </div>

      {/* TRENDING */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <span className="shrink-0 font-mono text-[10px] tracking-[0.2em] text-emberDim mr-2">
          ▸ TRENDING
        </span>
        {trending.length === 0 && (
          <span className="font-mono text-[10px] text-dim">no tokens registered yet</span>
        )}
        {trending.map((t) => {
          const m = tokenMeta[t.toLowerCase()];
          return (
            <button
              key={t}
              onClick={() => setToToken(t)}
              className="shrink-0 flex items-center gap-2 px-3 py-2 border border-line hover:border-ember/50 transition-colors rounded-xl"
            >
              <TokenGlyph symbol={m?.symbol ?? "?"} size={20} />
              <span className="font-mono text-xs font-bold text-ink">
                {(m?.symbol ?? "?").toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>

      {/* TABS */}
      <div className="flex items-center gap-1 border-b border-line">
        {(["swap", "buy"] as const).map((id) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cls(
              "px-4 py-2.5 font-mono text-[11px] tracking-[0.2em] transition-colors border-b-2 -mb-px",
              tab === id
                ? "text-ember border-ember"
                : "text-dim hover:text-ink border-transparent"
            )}
          >
            {id.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === "swap" ? (
        <div className="space-y-2">
          {/* SELL CARD */}
          <Panel className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] tracking-[0.2em] text-dim">▸ SELL</span>
              {isConnected && fromToken && (
                <button
                  onClick={() =>
                    setAmount(
                      sellBalance ? formatUnits(sellBalance as bigint, sellMeta.decimals) : ""
                    )
                  }
                  className="font-mono text-[10px] tracking-wider text-emberDim hover:text-ember"
                >
                  BAL: <span className="num text-ink">{sellBalanceStr}</span> · MAX
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0"
                inputMode="decimal"
                className="bg-transparent text-4xl num font-bold text-ink placeholder-dim outline-none flex-1 min-w-0"
              />
              <TokenSelector
                symbol={sellMeta.symbol}
                onClick={() => setPickerSide("from")}
              />
            </div>
          </Panel>

          {/* FLIP HANDLE */}
          <div className="relative h-0">
            <div className="absolute left-1/2 -translate-x-1/2 -top-4 z-10">
              <button
                onClick={flip}
                className="w-9 h-9 border border-line2 bg-bg hover:border-ember hover:text-ember transition-colors flex items-center justify-center text-dim2 rounded-xl"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M7 10l5-5 5 5M7 14l5 5 5-5" />
                </svg>
              </button>
            </div>
          </div>

          {/* BUY CARD */}
          <Panel className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] tracking-[0.2em] text-dim">▸ RECEIVE</span>
              {isConnected && toToken && (
                <span className="font-mono text-[10px] text-dim">
                  BAL: <span className="num text-dim2">{buyBalanceStr}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-4xl num font-bold text-dim2 flex-1 truncate">
                {parsedIn === 0n ? "0" : formattedQuote}
              </div>
              {toToken && buyMeta ? (
                <TokenSelector symbol={buyMeta.symbol} onClick={() => setPickerSide("to")} />
              ) : (
                <button
                  onClick={() => setPickerSide("to")}
                  className="bracket font-mono text-[11px] tracking-[0.18em] text-ember border border-ember/40 px-3 py-2 hover:bg-ember/10 rounded-xl"
                >
                  SELECT
                </button>
              )}
            </div>
          </Panel>

          {/* QUOTE DETAILS */}
          {parsedIn > 0n && buyMeta && (
            <div className="border border-line rounded-xl p-4 space-y-2 bg-panel2/40">
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-dim">RATE</span>
                <span className="num text-ink">
                  1 {sellMeta.symbol} ={" "}
                  {(() => {
                    const out =
                      quote !== undefined && parsedIn > 0n
                        ? Number(formatUnits(quote as bigint, buyMeta.decimals)) /
                          Number(formatUnits(parsedIn, sellMeta.decimals))
                        : 0;
                    return out.toFixed(6);
                  })()}{" "}
                  {buyMeta.symbol}
                </span>
              </div>
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-dim">PRICE IMPACT</span>
                <span className="num text-ember">{"< 0.01%"}</span>
              </div>
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-dim">ROUTE</span>
                <span className="num text-ink">
                  {sellMeta.symbol} → {buyMeta.symbol}
                </span>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-dim">SLIPPAGE</span>
                <div className="flex items-center gap-1">
                  {[10, 50, 100].map((bps) => (
                    <button
                      key={bps}
                      onClick={() => setSlippageBps(bps)}
                      className={cls(
                        "px-2 py-0.5 border rounded-md num",
                        slippageBps === bps
                          ? "border-ember text-ember"
                          : "border-line text-dim2 hover:text-ink"
                      )}
                    >
                      {(bps / 100).toFixed(bps < 100 ? 2 : 1)}%
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-dim">MIN RECEIVED</span>
                <span className="num text-ink">
                  {(() => {
                    const q = (quote as bigint | undefined) ?? 0n;
                    const min = (q * BigInt(10000 - slippageBps)) / 10000n;
                    return formatUnits(min, buyMeta.decimals);
                  })()}{" "}
                  {buyMeta.symbol}
                </span>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-dim">DEADLINE</span>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={deadlineMin}
                  onChange={(e) =>
                    setDeadlineMin(
                      Math.max(1, Math.min(120, Number(e.target.value) || 20))
                    )
                  }
                  className="bg-transparent text-ink num w-12 text-right outline-none border-b border-line focus:border-ember"
                />
                <span className="text-dim">min</span>
              </div>
            </div>
          )}

          {/* CTA */}
          {!isConnected ? (
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <PrimaryBtn onClick={openConnectModal}>CONNECT WALLET</PrimaryBtn>
              )}
            </ConnectButton.Custom>
          ) : (
            <PrimaryBtn
              loading={isPending || mining}
              onClick={onSubmit}
              disabled={parsedIn === 0n || !fromToken || !toToken}
            >
              {ctaLabel}
            </PrimaryBtn>
          )}

          {hash && (
            <p className="font-mono text-[10px] text-dim2 break-all num">tx: {hash}</p>
          )}
          {isError && error && (
            <p className="font-mono text-[10px] text-warn break-words">
              {error.message.split("\n")[0]}
            </p>
          )}
        </div>
      ) : (
        <BuyTab isConnected={isConnected} />
      )}

      <TokenPicker
        open={!!pickerSide}
        onClose={() => setPickerSide(null)}
        onPick={(t) => {
          if (pickerSide === "from") setFromToken(t.address);
          else setToToken(t.address);
        }}
        tokens={pickerTokens}
        exclude={pickerSide === "from" ? toToken : fromToken}
      />
      <Toast msg={toast} onClose={() => setToast("")} />
    </div>
  );
}

function TokenSelector({
  symbol,
  onClick,
}: {
  symbol: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 flex items-center gap-2 px-2.5 py-2 border border-line2 hover:border-ember/50 transition-colors rounded-xl"
    >
      <TokenGlyph symbol={symbol} size={24} />
      <div className="flex flex-col items-start leading-tight">
        <span className="font-mono font-bold text-ink text-xs">{symbol}</span>
        <span className="font-mono text-[9px] text-dim">LitVM</span>
      </div>
      <span className="text-dim text-xs">▾</span>
    </button>
  );
}

function BuyTab({ isConnected }: { isConnected: boolean }) {
  const [usd, setUsd] = useState("100");
  const eth = (Number(usd) / 2365 || 0).toFixed(5);
  return (
    <div className="space-y-3">
      <Panel className="p-8 flex flex-col items-center">
        <span className="font-mono text-[10px] tracking-[0.2em] text-dim">
          ▸ ENTER AMOUNT
        </span>
        <div className="mt-4 flex items-baseline">
          <span className="text-4xl num font-bold text-ink">$</span>
          <input
            value={usd}
            onChange={(e) => setUsd(e.target.value.replace(/[^0-9.]/g, ""))}
            inputMode="decimal"
            className="bg-transparent text-5xl num font-bold text-ink outline-none w-44 text-center"
          />
        </div>
        <div className="mt-2 font-mono text-[11px] text-dim num">≈ {eth} ETH</div>
        <div className="mt-5 flex items-center gap-2">
          {[100, 300, 1000].map((v) => (
            <GhostBtn
              key={v}
              onClick={() => setUsd(String(v))}
              active={usd === String(v)}
            >
              ${v.toLocaleString()}
            </GhostBtn>
          ))}
        </div>
      </Panel>
      <Panel className="p-4">
        <div className="flex items-center justify-between font-mono text-[11px]">
          <span className="text-dim">▸ RECIPIENT</span>
          <span className="text-ink num">
            {isConnected ? "connected wallet" : "wallet not connected"}
          </span>
        </div>
      </Panel>
      <PrimaryBtn disabled onClick={() => {}}>
        {isConnected ? "BUY · COMING SOON" : "CONNECT WALLET"}
      </PrimaryBtn>
    </div>
  );
}
