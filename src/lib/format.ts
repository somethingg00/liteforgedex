export function shortAddr(addr?: string | null) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function formatNumber(value: bigint, decimals = 18, maxFrac = 6): string {
  const dec = Number(decimals) || 18;
  const neg = value < 0n;
  const v = neg ? -value : value;
  const base = 10n ** BigInt(dec);
  const whole = v / base;
  const frac = v % base;
  const wholeStr = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (frac === 0n) return `${neg ? "-" : ""}${wholeStr}`;
  let fracStr = frac.toString().padStart(dec, "0");
  fracStr = fracStr.slice(0, maxFrac).replace(/0+$/, "");
  return `${neg ? "-" : ""}${wholeStr}${fracStr ? "." + fracStr : ""}`;
}

export function formatCompact(value: bigint, decimals = 18): string {
  const dec = Number(decimals) || 18;
  const neg = value < 0n;
  const v = neg ? -value : value;
  const base = 10n ** BigInt(dec);
  const whole = v / base;
  const frac = v % base;
  let num: number;
  if (whole < 1_000_000_000_000_000n) {
    num = Number(whole) + Number(frac) / Number(base);
  } else {
    num = Number(whole);
  }
  const formatted = new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(num);
  return `${neg ? "-" : ""}${formatted}`;
}
