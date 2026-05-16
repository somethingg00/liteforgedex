import { NextResponse } from "next/server";
import csvText from "@data/airdrop.csv";

// Server-only. The CSV is bundled into the Worker at build time and never
// shipped to the browser — only the queried row is returned in responses.
// Runs on the Cloudflare Pages edge runtime.

export const runtime = "edge";
export const dynamic = "force-dynamic";

type Row = { address: string; amount: string; tier: string; reason: string };

let cache: Map<string, Row> | null = null;

function parseCsv(text: string): Map<string, Row> {
  const rows = new Map<string, Row>();
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return rows;
  const header = lines[0].split(",").map((s) => s.trim().toLowerCase());
  const idx = (k: string) => header.indexOf(k);
  const iAddr = idx("address");
  const iAmt = idx("amount");
  const iTier = idx("tier");
  const iReason = idx("reason");
  if (iAddr < 0) return rows;
  for (let i = 1; i < lines.length; i++) {
    const parts = splitCsvLine(lines[i], header.length);
    const address = (parts[iAddr] ?? "").trim().toLowerCase();
    if (!address.startsWith("0x") || address.length !== 42) continue;
    rows.set(address, {
      address,
      amount: (parts[iAmt] ?? "0").trim(),
      tier: (parts[iTier] ?? "").trim(),
      reason: (parts[iReason] ?? "").trim(),
    });
  }
  return rows;
}

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

function loadRows(): Map<string, Row> {
  if (cache) return cache;
  cache = parseCsv(csvText);
  return cache;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = (searchParams.get("address") ?? "").trim().toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(raw)) {
    return NextResponse.json(
      { ok: false, error: "invalid address" },
      { status: 400 }
    );
  }
  try {
    const rows = loadRows();
    const row = rows.get(raw);
    if (!row) {
      return NextResponse.json({
        ok: true,
        eligible: false,
        amount: "0",
        tier: "—",
        reason: "Address not on the airdrop list for this epoch",
      });
    }
    return NextResponse.json({
      ok: true,
      eligible: true,
      amount: row.amount,
      tier: row.tier,
      reason: row.reason,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { ok: false, error: `failed to read list · ${msg}` },
      { status: 500 }
    );
  }
}
