import { ReactNode } from "react";

const cls = (...xs: Array<string | false | undefined | null>) =>
  xs.filter(Boolean).join(" ");

export function Stat({
  label,
  value,
  unit,
  accent = false,
  size = "md",
}: {
  label: ReactNode;
  value: ReactNode;
  unit?: string;
  accent?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const sz = size === "lg" ? "text-3xl" : size === "sm" ? "text-base" : "text-xl";
  return (
    <div>
      <div className="font-mono text-[10px] tracking-[0.2em] text-dim mb-1">
        {label}
      </div>
      <div className={cls("num font-bold", sz, accent ? "text-ember" : "text-ink")}>
        {value}
        {unit && (
          <span className="text-dim text-sm ml-1 font-normal">{unit}</span>
        )}
      </div>
    </div>
  );
}

export function Row({
  label,
  value,
  unit = "",
}: {
  label: ReactNode;
  value: ReactNode;
  unit?: string;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="font-mono text-[10px] tracking-wider text-dim">
        {label}
      </span>
      <span className="font-mono text-xs text-ink num">
        {value}
        {unit && <span className="text-dim ml-1">{unit}</span>}
      </span>
    </div>
  );
}
