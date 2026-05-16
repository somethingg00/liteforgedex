import type { PublicClient } from "viem";

// Auto-detect the contract's deploy block on whichever chain the wallet is on.
// Strategy:
//   1. If localStorage has a cached value for { chainId, address } → use it.
//   2. Otherwise, binary-search eth_getCode from block 0 → head:
//      first block where code(address) != "0x" is the deploy block.
//      ~log2(head) RPC calls (e.g. 24 for Sepolia ~10.8M blocks).
//   3. Cache result. On any RPC failure, return null so the caller can fall
//      back to a bounded lookback window.

const CACHE_PREFIX = "litvm:deployBlock:";

function cacheKey(chainId: number, address: string) {
  return `${CACHE_PREFIX}${chainId}:${address.toLowerCase()}`;
}

function readCache(chainId: number, address: string): bigint | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(cacheKey(chainId, address));
    if (v && /^\d+$/.test(v)) return BigInt(v);
  } catch {
    /* ignore */
  }
  return null;
}

function writeCache(chainId: number, address: string, block: bigint) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(cacheKey(chainId, address), block.toString());
  } catch {
    /* ignore */
  }
}

export async function findDeployBlock(
  client: PublicClient,
  address: `0x${string}`,
  chainId: number
): Promise<bigint | null> {
  const cached = readCache(chainId, address);
  if (cached !== null) return cached;

  let hi: bigint;
  try {
    hi = await client.getBlockNumber();
  } catch {
    return null;
  }

  // Is the contract deployed at the head? If not, nothing to find.
  let headCode: string | undefined;
  try {
    headCode = await client.getCode({ address, blockNumber: hi });
  } catch {
    return null;
  }
  if (!headCode || headCode === "0x") return hi;

  // Binary search: find smallest block where code exists.
  let lo = 0n;
  let failures = 0;
  while (lo + 1n < hi) {
    const mid = (lo + hi) >> 1n;
    try {
      const code = await client.getCode({ address, blockNumber: mid });
      if (code && code !== "0x") {
        hi = mid;
      } else {
        lo = mid;
      }
    } catch {
      failures++;
      // If archive lookups keep failing, give up — caller falls back.
      if (failures > 3) return null;
      lo = mid;
    }
  }

  writeCache(chainId, address, hi);
  return hi;
}
