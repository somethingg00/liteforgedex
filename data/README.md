# Private data folder

Server-side only. Never imported by client code, never served by Next.js as a static asset.

Files in this folder are bundled into the API route Worker at build time (Cloudflare Pages edge runtime). The CSV is imported as a string via the `@data/*` path alias — see `src/app/api/airdrop/route.ts`.

Browser DevTools / Inspect cannot reach these files because:
- `data/` is **outside** `public/`, so Next.js never serves it as a static asset.
- The CSV lives only inside the compiled Worker bundle on the server.
- API responses only return the queried row, never dump the whole CSV.

## airdrop.csv

CSV header:
```
address,amount,tier,reason
```

- `address` — lowercase 0x… wallet
- `amount` — human number (e.g. `2500.00`) — UI displays as-is
- `tier` — display tier name (Spark / Ember / Forgemaster / etc.)
- `reason` — short description shown to user
