"use client";

import { useEffect } from "react";
import { useWaitForTransactionReceipt } from "wagmi";

type Props = {
  label: string;
  pendingLabel?: string;
  hash?: `0x${string}`;
  isPending: boolean;
  isError?: boolean;
  error?: Error | null;
  onClick: () => void;
  disabled?: boolean;
  onConfirmed?: () => void;
};

export function TxButton({
  label,
  pendingLabel = "Confirming...",
  hash,
  isPending,
  isError,
  error,
  onClick,
  disabled,
  onConfirmed,
}: Props) {
  const { isLoading: mining, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess && onConfirmed) onConfirmed();
  }, [isSuccess, onConfirmed]);

  const busy = isPending || mining;
  const text = isPending ? pendingLabel : mining ? "Mining..." : isSuccess ? "Confirmed ✓" : label;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClick}
        disabled={busy || disabled}
        className="btn-primary w-full"
      >
        {text}
      </button>
      {hash && (
        <p className="text-xs text-white/50 break-all">tx: {hash}</p>
      )}
      {isError && error && (
        <p className="text-xs text-red-400 break-words">{error.message.split("\n")[0]}</p>
      )}
    </div>
  );
}
