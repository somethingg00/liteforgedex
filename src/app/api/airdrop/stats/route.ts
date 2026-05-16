import { NextResponse } from "next/server";
import csvText from "@data/airdrop.csv";

// Aggregate stats only. Never returns individual addresses.
// CSV is bundled at build time; stats are computed once on first request
// and reused for the lifetime of the Worker isolate.

export const runtime = "edge";

type Stats = { eligibleWallets: number; totalAllocation: string };

let cache: Stats | null = null;

function splitCsvLine(line: string, cols: number): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cur += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === "," && out.length < cols - 1) {
        out.push(cur);
        cur = "";
      } else {
        cur += c;
      }
    }
  }
  out.push(cur);
  return out;
}

function computeStats(): Stats {
  if (cache) return cache;
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) {
    cache = { eligibleWallets: 0, totalAllocation: "0" };
    return cache;
  }
  const header = lines[0].split(",").map((s) => s.trim().toLowerCase());
  const iAddr = header.indexOf("address");
  const iAmt = header.indexOf("amount");
  let count = 0;
  let total = 0;
  for (let i = 1; i < lines.length; i++) {
    const parts = splitCsvLine(lines[i], header.length);
    const addr = (parts[iAddr] ?? "").trim().toLowerCase();
    if (!/^0x[0-9a-f]{40}$/.test(addr)) continue;
    count++;
    const amt = parseFloat((parts[iAmt] ?? "0").trim());
    if (Number.isFinite(amt) && amt > 0) total += amt;
  }
  cache = { eligibleWallets: count, totalAllocation: total.toFixed(2) };
  return cache;
}

export async function GET() {
  try {
    const stats = computeStats();
    return NextResponse.json(
      { ok: true, ...stats },
      {
        headers: {
          "Cache-Control":
            "public, max-age=10, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
