"use client";

import { useEffect, useMemo, useState } from "react";
import { formatUnits, parseUnits, isAddress, zeroAddress } from "viem";
import {
  useAccount,
  useBalance,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { Panel, PrimaryBtn, Stat, Toast, cls } from "@/components/lf";
import { shortAddr, formatNumber } from "@/lib/format";
import { CONTRACT_ADDRESS } from "@/lib/chain";
import { erc20Abi, swapAbi } from "@/lib/abi";

// Prefer env-provided addresses; fall back to on-chain getter results below.
const ENV_LITVM_TOKEN     = (process.env.NEXT_PUBLIC_LITVM_TOKEN     ?? "") as `0x${string}`;
const ENV_STAKING_ADDRESS = (process.env.NEXT_PUBLIC_STAKING_ADDRESS ?? "") as `0x${string}`;

const DEFAULT_APR = 20;

function getDisplayAPR(): number {
  if (typeof window === "undefined") return DEFAULT_APR;
  const stored = localStorage.getItem("staking_display_apr");
  const parsed = stored ? parseFloat(stored) : NaN;
  // Clamp to a sane range. A tampered localStorage value (e.g. Infinity,
  // -1, 1e308) must not break layout or mislead the user.
  if (Number.isFinite(parsed) && parsed > 0 && parsed <= 1000) return parsed;
  return DEFAULT_APR;
}

function formatCountdown(secs: number): string {
  if (secs <= 0) return "READY";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h.toString().padStart(2, "0")}:${m
    .toString()
    .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function StakePage() {
  const { address, isConnected } = useAccount();
  const [mode, setMode]     = useState<"stake" | "unstake">("stake");
  const [amount, setAmount] = useState("");
  const [toast, setToast]   = useState("");
  const [activeTx, setActiveTx] = useState<"stake" | "unstake" | "claim" | null>(null);

  const mainControlReady =
    isAddress(CONTRACT_ADDRESS) && CONTRACT_ADDRESS !== zeroAddress;

  const needOnChainAddrs =
    !isAddress(ENV_LITVM_TOKEN) || !isAddress(ENV_STAKING_ADDRESS);

  const { data: addrReads } = useReadContracts({
    contracts: [
      { address: CONTRACT_ADDRESS, abi: swapAbi, functionName: "litvmToken" },
      { address: CONTRACT_ADDRESS, abi: swapAbi, functionName: "staking" },
    ],
    query: { enabled: mainControlReady && needOnChainAddrs },
  });

  const LITVM_TOKEN: `0x${string}` = isAddress(ENV_LITVM_TOKEN)
    ? ENV_LITVM_TOKEN
    : ((addrReads?.[0]?.result as `0x${string}` | undefined) ?? zeroAddress);
  const STAKING_ADDRESS: `0x${string}` = isAddress(ENV_STAKING_ADDRESS)
    ? ENV_STAKING_ADDRESS
    : ((addrReads?.[1]?.result as `0x${string}` | undefined) ?? zeroAddress);

  const stakingDeployed = isAddress(STAKING_ADDRESS) && STAKING_ADDRESS !== zeroAddress;
  const tokenDeployed   = isAddress(LITVM_TOKEN)     && LITVM_TOKEN     !== zeroAddress;

  // ---- Pool reads ----------------------------------------------------------
  const { data: poolReads, refetch: refetchPool } = useReadContracts({
    contracts: [
      { address: CONTRACT_ADDRESS, abi: swapAbi, functionName: "totalStaked" },
      { address: CONTRACT_ADDRESS, abi: swapAbi, functionName: "rewardRatePerSecond" },
    ],
    query: { enabled: mainControlReady, refetchInterval: 8000 },
  });

  const totalStaked = (poolReads?.[0]?.result as bigint | undefined) ?? 0n;
  const rewardRate  = (poolReads?.[1]?.result as bigint | undefined) ?? 0n;

  // LITVM token metadata (symbol + decimals for reward display)
  const { data: tokenMeta } = useReadContracts({
    contracts: [
      { address: LITVM_TOKEN, abi: erc20Abi, functionName: "symbol" },
      { address: LITVM_TOKEN, abi: erc20Abi, functionName: "decimals" },
    ],
    query: { enabled: tokenDeployed },
  });

  const litvmSymbol   = (tokenMeta?.[0]?.result as string  | undefined) ?? "LITVM";
  const litvmDecimals = (tokenMeta?.[1]?.result as number  | undefined) ?? 18;

  // ---- User reads ----------------------------------------------------------
  // Staked amount + pending rewards + cooldown are read via main_control facade.
  // Wallet balance for native comes from useBalance (no ERC20 read needed).
  const { data: userReads, refetch: refetchUser } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESS,
        abi: swapAbi,
        functionName: "stakedOf",
        args: address ? [address] : undefined,
      },
      {
        address: CONTRACT_ADDRESS,
        abi: swapAbi,
        functionName: "pendingStakingRewards",
        args: address ? [address] : undefined,
      },
      {
        address: CONTRACT_ADDRESS,
        abi: swapAbi,
        functionName: "claimUnlocksIn",
        args: address ? [address] : undefined,
      },
    ],
    query: {
      enabled: !!address && mainControlReady,
      refetchInterval: 8000,
    },
  });

  const stakedRaw          = (userReads?.[0]?.result as bigint | undefined) ?? 0n;
  const pendingRewardsOnChain = (userReads?.[1]?.result as bigint | undefined) ?? 0n;
  const cooldownRemaining  = (userReads?.[2]?.result as bigint | undefined) ?? 0n;

  // Native zkLTC wallet balance
  const { data: nativeBal } = useBalance({ address });
  const walletNative = nativeBal?.value ?? 0n;

  // ---- Live tick -----------------------------------------------------------
  const [tickPending, setTickPending]     = useState<bigint>(0n);
  const [tickCountdown, setTickCountdown] = useState<number>(0);

  useEffect(() => {
    setTickPending(pendingRewardsOnChain);
    setTickCountdown(Number(cooldownRemaining));
  }, [pendingRewardsOnChain, cooldownRemaining]);

  useEffect(() => {
    if (!isConnected || !stakingDeployed) return;
    const id = setInterval(() => {
      if (stakedRaw > 0n && totalStaked > 0n && rewardRate > 0n) {
        setTickPending((p) => p + (rewardRate * stakedRaw) / totalStaked);
      }
      setTickCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [isConnected, stakingDeployed, stakedRaw, totalStaked, rewardRate]);

  // ---- APR (admin-configured display value, default 20%) ------------------
  const [apr, setApr] = useState<number>(DEFAULT_APR);
  useEffect(() => { setApr(getDisplayAPR()); }, []);

  // ---- Tx wiring -----------------------------------------------------------
  const {
    writeContract,
    data: hash,
    isPending,
    error,
    isError,
    reset,
  } = useWriteContract();
  const { isLoading: mining, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (!isSuccess || !activeTx) return;
    if (activeTx === "stake")   setToast("Staked into the furnace ✓");
    if (activeTx === "unstake") setToast("Unstaked from the furnace ✓");
    if (activeTx === "claim")   setToast("LITVM rewards claimed ✓");
    setActiveTx(null);
    setAmount("");
    refetchPool();
    refetchUser();
    const t = setTimeout(() => { refetchPool(); refetchUser(); }, 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  // parsedAmount is native wei (18 dec) — same as zkLTC
  const parsedAmount = (() => {
    if (!amount) return 0n;
    try { return parseUnits(amount, 18); }
    catch { return 0n; }
  })();

  const onAction = () => {
    if (parsedAmount === 0n) return;
    reset();
    if (mode === "stake") {
      if (parsedAmount > walletNative) {
        setToast("Insufficient wallet balance");
        return;
      }
      setActiveTx("stake");
      // stakeNative() is payable — send native as value, no args
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: swapAbi,
        functionName: "stakeNative",
        value: parsedAmount,
      });
    } else {
      if (parsedAmount > stakedRaw) {
        setToast("Insufficient staked balance");
        return;
      }
      setActiveTx("unstake");
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: swapAbi,
        functionName: "unstakeNative",
        args: [parsedAmount],
      });
    }
  };

  const onClaim = () => {
    if (tickCountdown > 0 || tickPending === 0n) return;
    reset();
    setActiveTx("claim");
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: swapAbi,
      functionName: "claimStakingRewards",
    });
  };

  const fillPct = useMemo(() => {
    if (totalStaked === 0n || stakedRaw === 0n) return 0;
    return Math.min(100, (Number(stakedRaw) / Number(totalStaked)) * 100);
  }, [stakedRaw, totalStaked]);

  const busy = isPending || mining;

  const ctaLabel = !isConnected
    ? "CONNECT WALLET"
    : !stakingDeployed
    ? "STAKING NOT DEPLOYED"
    : !amount
    ? "ENTER AN AMOUNT"
    : isPending
    ? "CONFIRMING…"
    : mining
    ? "MINING…"
    : mode === "stake"
    ? `▸ STAKE ${amount} zkLTC`
    : `▸ UNSTAKE ${amount} zkLTC`;

  const claimLabel = !isConnected
    ? "CONNECT WALLET"
    : !stakingDeployed
    ? "STAKING NOT DEPLOYED"
    : tickPending === 0n
    ? "NO REWARDS YET"
    : tickCountdown > 0
    ? `LOCKED · ${formatCountdown(tickCountdown)}`
    : isPending
    ? "CONFIRMING…"
    : mining
    ? "MINING…"
    : `▸ CLAIM ${formatNumber(tickPending, litvmDecimals, 4)} ${litvmSymbol}`;

  return (
    <div className="page-enter pt-10 max-w-5xl mx-auto space-y-6">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h1 className="font-mono font-extrabold text-2xl tracking-tight text-ink">
          <span className="text-ember">▲</span> STAKE · THE FURNACE
        </h1>
        <span className="font-mono text-[10px] tracking-[0.2em] text-dim">
          APR <span className="text-ember">{apr.toFixed(2)}%</span>
        </span>
      </div>

      {!stakingDeployed && (
        <div className="border border-danger/50 bg-danger/10 rounded-xl p-4">
          <div className="font-mono text-[11px] tracking-[0.2em] text-danger mb-1">
            ▸ STAKING CONTRACT NOT RESOLVED
          </div>
          <p className="font-mono text-[11px] text-dim2 leading-relaxed">
            Could not read <code className="text-ink">staking()</code> from{" "}
            <code className="text-ink">NEXT_PUBLIC_CONTRACT_ADDRESS</code>.
          </p>
        </div>
      )}

      {stakingDeployed && rewardRate === 0n && (
        <div className="border border-warn/40 bg-warn/5 rounded-xl px-4 py-3 font-mono text-[11px] text-warn leading-relaxed">
          ▸ REWARDS NOT CONFIGURED — Admin must call{" "}
          <code className="text-ink">setStakingRewardRate</code> and{" "}
          <code className="text-ink">fundStakingRewards</code>.
        </div>
      )}

      {/* Top stat strip */}
      <Panel>
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-line">
          <div className="px-5 py-4">
            <Stat
              label="TOTAL STAKED"
              value={formatNumber(totalStaked, 18, 2)}
              unit="zkLTC"
            />
          </div>
          <div className="px-5 py-4">
            <Stat
              label="YOUR STAKE"
              value={isConnected ? formatNumber(stakedRaw, 18, 4) : "—"}
              unit="zkLTC"
              accent
            />
          </div>
          <div className="px-5 py-4">
            <Stat
              label="PENDING"
              value={isConnected ? formatNumber(tickPending, litvmDecimals, 6) : "—"}
              unit={litvmSymbol}
              accent
            />
          </div>
          <div className="px-5 py-4">
            <Stat label="APR" value={apr.toFixed(2)} unit="%" />
          </div>
        </div>
      </Panel>

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-4">
        {/* THE FURNACE — staking card */}
        <Panel title="▸ THE FURNACE">
          <div className="p-5 space-y-5">
            {/* Mode toggle */}
            <div className="grid grid-cols-2 gap-0 border border-line rounded-xl overflow-hidden w-full max-w-xs">
              {(["stake", "unstake"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setAmount(""); }}
                  className={cls(
                    "py-2.5 font-mono text-[11px] tracking-[0.2em] transition-colors",
                    mode === m
                      ? "bg-ember text-bg"
                      : "bg-panel text-dim2 hover:text-ink",
                    m === "unstake" && "border-l border-line"
                  )}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Amount field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] tracking-[0.2em] text-dim">
                  ▸ AMOUNT · zkLTC
                </span>
                {isConnected && (
                  <button
                    onClick={() =>
                      setAmount(
                        formatUnits(mode === "stake" ? walletNative : stakedRaw, 18)
                      )
                    }
                    className="font-mono text-[10px] tracking-wider text-emberDim hover:text-ember"
                  >
                    {mode === "stake" ? "WALLET" : "STAKED"}:{" "}
                    <span className="num text-ink">
                      {formatNumber(mode === "stake" ? walletNative : stakedRaw, 18, 4)}
                    </span>{" "}
                    · MAX
                  </button>
                )}
              </div>
              <div className="border border-line2 focus-within:border-ember focus-within:shadow-ember rounded-xl flex items-center gap-3 px-4">
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="0.0"
                  inputMode="decimal"
                  className="bg-transparent text-3xl num font-bold text-ink placeholder-dim outline-none flex-1 min-w-0 py-3"
                />
                <span className="font-mono font-bold text-ember">zkLTC</span>
              </div>
              <div className="flex gap-2 mt-3">
                {[25, 50, 75, 100].map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      const base = mode === "stake" ? walletNative : stakedRaw;
                      setAmount(formatUnits((base * BigInt(p)) / 100n, 18));
                    }}
                    className="flex-1 py-1.5 border border-line text-dim2 hover:text-ember hover:border-ember/40 font-mono text-[10px] tracking-wider rounded-xl"
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>

            {/* Live forecast */}
            {amount && parsedAmount > 0n && (
              <div className="border border-line rounded-xl p-4 space-y-2 bg-panel2/40">
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-dim">EST. DAILY REWARD</span>
                  <span className="num text-ember">
                    +{((parseFloat(amount) * apr) / 100 / 365).toFixed(4)}{" "}
                    {litvmSymbol}
                  </span>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-dim">EST. ANNUAL REWARD</span>
                  <span className="num text-ember">
                    +{((parseFloat(amount) * apr) / 100).toFixed(2)}{" "}
                    {litvmSymbol}
                  </span>
                </div>
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-dim">CLAIM COOLDOWN</span>
                  <span className="text-ink">24h after each new stake</span>
                </div>
              </div>
            )}

            <PrimaryBtn
              loading={busy && (activeTx === "stake" || activeTx === "unstake")}
              onClick={onAction}
              disabled={!isConnected || !stakingDeployed || !amount || parsedAmount === 0n}
            >
              {ctaLabel}
            </PrimaryBtn>
          </div>
        </Panel>

        {/* REWARDS PANEL */}
        <div className="space-y-4">
          <Panel
            title={`▸ REWARDS · ${litvmSymbol}`}
            glow={isConnected && tickPending > 0n && tickCountdown === 0}
          >
            <div className="p-5 space-y-4">
              <div>
                <div className="font-mono text-[10px] tracking-[0.2em] text-dim mb-1">
                  PENDING (LIVE)
                </div>
                <div className="num font-bold text-3xl text-ember">
                  {isConnected
                    ? formatNumber(tickPending, litvmDecimals, 6)
                    : "—"}
                </div>
                <div className="font-mono text-[11px] text-dim mt-1">
                  {litvmSymbol}
                </div>
              </div>

              {isConnected && stakedRaw > 0n && (
                <div className="border border-line rounded-xl p-3 bg-panel2/40">
                  <div className="flex justify-between font-mono text-[10px] mb-1">
                    <span className="text-dim">CLAIM UNLOCKS IN</span>
                    <span className={cls("num", tickCountdown === 0 ? "text-ember" : "text-warn")}>
                      {formatCountdown(tickCountdown)}
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-dim2 leading-snug">
                    Each new stake restarts a 24h claim lock. Unstake is always allowed.
                  </p>
                </div>
              )}

              <div>
                <div className="flex justify-between font-mono text-[10px] text-dim mb-1.5">
                  <span>FURNACE FILL · YOUR SHARE</span>
                  <span className="num">{fillPct.toFixed(1)}%</span>
                </div>
                <div className="h-2 border border-line2 rounded-xl overflow-hidden bg-panel2 relative">
                  <div
                    className="h-full bg-ember transition-all duration-700"
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
              </div>

              <PrimaryBtn
                loading={busy && activeTx === "claim"}
                onClick={onClaim}
                disabled={
                  !isConnected ||
                  !stakingDeployed ||
                  tickPending === 0n ||
                  tickCountdown > 0
                }
              >
                {claimLabel}
              </PrimaryBtn>
            </div>
          </Panel>

          <Panel title="▸ POOL INFO">
            <div className="divide-y divide-line">
              <div className="flex justify-between px-5 py-3 font-mono text-[11px]">
                <span className="text-dim">STAKE TOKEN</span>
                <span className="text-ink">zkLTC (native)</span>
              </div>
              <div className="flex justify-between px-5 py-3 font-mono text-[11px]">
                <span className="text-dim">REWARD TOKEN</span>
                <span className="text-ember">{litvmSymbol} (ERC20)</span>
              </div>
              <div className="flex justify-between px-5 py-3 font-mono text-[11px]">
                <span className="text-dim">CLAIM COOLDOWN</span>
                <span className="text-ink">24h after each stake</span>
              </div>
              <div className="flex justify-between px-5 py-3 font-mono text-[11px]">
                <span className="text-dim">UNSTAKE LOCK</span>
                <span className="text-ember">none</span>
              </div>
              <div className="flex justify-between px-5 py-3 font-mono text-[11px]">
                <span className="text-dim">CONTRACT</span>
                <span className="num text-dim2">{shortAddr(CONTRACT_ADDRESS)}</span>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      {hash && (
        <p className="font-mono text-[10px] text-dim2 break-all num">tx: {hash}</p>
      )}
      {isError && error && (
        <p className="font-mono text-[10px] text-warn break-words">
          {error.message.split("\n")[0]}
        </p>
      )}

      <Toast msg={toast} onClose={() => setToast("")} />
    </div>
  );
}
