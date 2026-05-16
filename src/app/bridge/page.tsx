"use client";

import { useEffect, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import {
  useAccount,
  useBalance,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { swapAbi, erc20Abi } from "@/lib/abi";
import { CONTRACT_ADDRESS } from "@/lib/chain";
import { formatNumber, shortAddr } from "@/lib/format";
import { Panel, PrimaryBtn, Toast, cls } from "@/components/lf";

export default function BridgePage() {
  const { address, isConnected } = useAccount();
  const [direction, setDirection] = useState<"toTest" | "fromTest">("toTest");
  const [amount, setAmount] = useState("");
  const [toast, setToast] = useState("");

  const { data: nativeBal, refetch: refetchNative } = useBalance({ address });

  const { data: testEthAddr } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: swapAbi,
    functionName: "testEthAddress",
  });

  const testEthValid =
    !!testEthAddr &&
    testEthAddr !== "0x0000000000000000000000000000000000000000";

  const { data: testBal, refetch: refetchTestBal } = useReadContract({
    address: testEthAddr as `0x${string}` | undefined,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && testEthValid },
  });

  const { data: testDecimals } = useReadContract({
    address: testEthAddr as `0x${string}` | undefined,
    abi: erc20Abi,
    functionName: "decimals",
    query: { enabled: testEthValid },
  });

  const { data: testSymbol } = useReadContract({
    address: testEthAddr as `0x${string}` | undefined,
    abi: erc20Abi,
    functionName: "symbol",
    query: { enabled: testEthValid },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: testEthAddr as `0x${string}` | undefined,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, CONTRACT_ADDRESS] : undefined,
    query: { enabled: !!address && testEthValid },
  });

  const { data: contractNativeBal } = useBalance({ address: CONTRACT_ADDRESS });

  const { writeContract, data: hash, isPending, error, isError, reset } =
    useWriteContract();
  const { isLoading: mining, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) {
      refetchAllowance();
      refetchTestBal();
      refetchNative();
      setToast("Transaction confirmed ✓");
      setAmount("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  const dec = (testDecimals as number | undefined) ?? 18;
  const sym = (testSymbol as string | undefined) ?? "WETH";
  const nativeSym = nativeBal?.symbol ?? "zkLTC";

  const BRIDGE_RATIO = 5n; // 1 native zkLTC = 5 WETH

  const fromSym = direction === "toTest" ? nativeSym : sym;
  const toSym = direction === "toTest" ? sym : nativeSym;

  const parsed = (() => {
    if (!amount) return 0n;
    try {
      return parseUnits(amount, direction === "toTest" ? 18 : dec);
    } catch {
      return 0n;
    }
  })();

  // Calculate expected output amount for display
  const outputAmount = (() => {
    if (parsed === 0n) return 0n;
    if (direction === "toTest") {
      // native (18 dec) → WETH (dec decimals): multiply by BRIDGE_RATIO
      return (parsed * BRIDGE_RATIO * 10n ** BigInt(dec)) / 10n ** 18n;
    } else {
      // WETH (dec decimals) → native (18 dec): divide by BRIDGE_RATIO
      return (parsed * 10n ** 18n) / (BRIDGE_RATIO * 10n ** BigInt(dec));
    }
  })();

  const needsApproval =
    direction === "fromTest" &&
    parsed > 0n &&
    ((allowance as bigint | undefined) ?? 0n) < parsed;

  const onSubmit = () => {
    reset();
    if (parsed === 0n) return;
    if (direction === "toTest") {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: swapAbi,
        functionName: "bridgeToTestEth",
        value: parsed,
      });
    } else if (needsApproval) {
      writeContract({
        address: testEthAddr as `0x${string}`,
        abi: erc20Abi,
        functionName: "approve",
        args: [CONTRACT_ADDRESS, parsed],
      });
    } else {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: swapAbi,
        functionName: "bridgeFromTestEth",
        args: [parsed],
      });
    }
  };

  const fromBalStr =
    direction === "toTest"
      ? nativeBal
        ? formatNumber(nativeBal.value, nativeBal.decimals, 4)
        : "—"
      : testBal !== undefined
      ? formatNumber(testBal as bigint, dec, 4)
      : "—";
  const toBalStr =
    direction === "toTest"
      ? testBal !== undefined
        ? formatNumber(testBal as bigint, dec, 4)
        : "—"
      : nativeBal
      ? formatNumber(nativeBal.value, nativeBal.decimals, 4)
      : "—";

  const setMax = () => {
    if (direction === "toTest" && nativeBal) {
      setAmount(formatUnits(nativeBal.value, nativeBal.decimals));
    } else if (direction === "fromTest" && testBal !== undefined) {
      setAmount(formatUnits(testBal as bigint, dec));
    }
  };

  const ctaLabel = !isConnected
    ? "CONNECT WALLET"
    : parsed === 0n
    ? "ENTER AN AMOUNT"
    : isPending
    ? "CONFIRMING…"
    : mining
    ? "MINING…"
    : direction === "fromTest" && needsApproval
    ? `APPROVE · BRIDGE ${amount} ${fromSym}`
    : `BRIDGE ${amount} ${fromSym}`;

  return (
    <div className="max-w-xl mx-auto pt-10 space-y-5">
      <div className="flex items-baseline justify-between">
        <h1 className="font-mono font-extrabold text-2xl tracking-tight text-ink">
          <span className="text-ember">▲</span> BRIDGE
        </h1>
        <span className="font-mono text-[10px] tracking-[0.2em] text-dim">
          1:5 NATIVE ↔ WRAPPED
        </span>
      </div>

      {/* DIRECTION TOGGLE */}
      <div className="grid grid-cols-2 gap-0 border border-line rounded-xl overflow-hidden">
        <button
          onClick={() => setDirection("toTest")}
          className={cls(
            "py-3 font-mono text-[11px] tracking-[0.2em] transition-colors",
            direction === "toTest"
              ? "bg-ember text-bg"
              : "bg-panel text-dim2 hover:text-ink"
          )}
        >
          {nativeSym} → {sym}
        </button>
        <button
          onClick={() => setDirection("fromTest")}
          className={cls(
            "py-3 font-mono text-[11px] tracking-[0.2em] transition-colors border-l border-line",
            direction === "fromTest"
              ? "bg-ember text-bg"
              : "bg-panel text-dim2 hover:text-ink"
          )}
        >
          {sym} → {nativeSym}
        </button>
      </div>

      {/* AMOUNT INPUT */}
      <Panel className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] tracking-[0.2em] text-dim">
            ▸ AMOUNT · {fromSym}
          </span>
          {isConnected && (
            <button
              onClick={setMax}
              className="font-mono text-[10px] tracking-wider text-emberDim hover:text-ember"
            >
              BAL: <span className="num text-ink">{fromBalStr}</span> · MAX
            </button>
          )}
        </div>
        <div className="flex items-baseline gap-3">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0.0"
            inputMode="decimal"
            className="bg-transparent text-4xl num font-bold text-ink placeholder-dim outline-none flex-1 min-w-0"
          />
          <span className="font-mono font-bold text-ember text-lg">{fromSym}</span>
        </div>
      </Panel>

      {/* FLOW DIAGRAM */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Panel className="p-4 text-center">
          <div className="font-mono text-[10px] tracking-[0.2em] text-dim mb-1">FROM</div>
          <div className="font-mono font-bold text-xl text-ink">{fromSym}</div>
          <div className="num font-mono text-[11px] text-dim mt-1">bal {fromBalStr}</div>
        </Panel>
        <div className="font-mono text-2xl text-ember">→</div>
        <Panel className="p-4 text-center">
          <div className="font-mono text-[10px] tracking-[0.2em] text-dim mb-1">TO</div>
          <div className="font-mono font-bold text-xl text-ember">{toSym}</div>
          <div className="num font-mono text-[11px] text-dim mt-1">bal {toBalStr}</div>
        </Panel>
      </div>

      {/* DETAILS */}
      <Panel className="p-4">
        <div className="space-y-2">
          <div className="flex justify-between font-mono text-[11px]">
            <span className="text-dim">RATE</span>
            <span className="num text-ink">
              {direction === "toTest"
                ? `1 ${nativeSym} = 5 ${sym}`
                : `5 ${sym} = 1 ${nativeSym}`}
            </span>
          </div>
          {parsed > 0n && (
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-dim">YOU RECEIVE</span>
              <span className="num text-ember">
                {formatNumber(outputAmount, direction === "toTest" ? dec : 18, 6)} {toSym}
              </span>
            </div>
          )}
          <div className="flex justify-between font-mono text-[11px]">
            <span className="text-dim">BRIDGE FEE</span>
            <span className="num text-ember">0 {nativeSym}</span>
          </div>
          <div className="flex justify-between font-mono text-[11px]">
            <span className="text-dim">CONTRACT {nativeSym} BALANCE</span>
            <span className="num text-ink">
              {contractNativeBal
                ? formatNumber(contractNativeBal.value, contractNativeBal.decimals, 4)
                : "—"}{" "}
              {nativeSym}
            </span>
          </div>
          {direction === "fromTest" && (
            <div className="flex justify-between font-mono text-[11px] pt-2 border-t border-line">
              <span className="text-dim">ALLOWANCE · {sym}</span>
              <span
                className={cls(
                  "num",
                  needsApproval ? "text-warn" : "text-ember"
                )}
              >
                {allowance !== undefined ? formatNumber(allowance as bigint, dec, 4) : "—"}{" "}
                {needsApproval && "· APPROVAL NEEDED"}
              </span>
            </div>
          )}
        </div>
      </Panel>

      {!isConnected ? (
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <PrimaryBtn onClick={openConnectModal}>{ctaLabel}</PrimaryBtn>
          )}
        </ConnectButton.Custom>
      ) : (
        <PrimaryBtn
          loading={isPending || mining}
          onClick={onSubmit}
          disabled={parsed === 0n}
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

      <div className="font-mono text-[10px] text-dim space-y-1 pt-2">
        <div className="flex justify-between">
          <span>{sym} contract</span>
          <span className="num text-dim2">
            {testEthValid ? shortAddr(testEthAddr as string) : "not configured"}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Bridge</span>
          <span className="num text-dim2">{shortAddr(CONTRACT_ADDRESS)}</span>
        </div>
      </div>

      <Toast msg={toast} onClose={() => setToast("")} />
    </div>
  );
}
