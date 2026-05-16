import { ButtonHTMLAttributes, ReactNode } from "react";

const cls = (...xs: Array<string | false | undefined | null>) =>
  xs.filter(Boolean).join(" ");

export function PrimaryBtn({
  children,
  loading,
  className = "",
  disabled,
  ...rest
}: { children: ReactNode; loading?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cls(
        "relative w-full h-12 font-mono font-bold tracking-[0.18em] text-sm transition-all rounded-xl border",
        disabled
          ? "bg-panel2 border-line text-dim cursor-not-allowed"
          : "bg-ember text-bg border-ember hover:bg-ember/90 hover:shadow-ember active:translate-y-[1px]",
        className
      )}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-3 h-3 border-2 border-bg border-t-transparent rounded-full animate-spin" />
          MINING…
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export function GhostBtn({
  children,
  className = "",
  active = false,
  ...rest
}: { children: ReactNode; active?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={cls(
        "h-10 px-4 font-mono text-[11px] tracking-[0.18em] rounded-lg border transition-colors",
        active
          ? "border-ember text-ember bg-ember/5"
          : "border-line2 text-dim2 hover:text-ink hover:border-line2",
        className
      )}
    >
      {children}
    </button>
  );
}
