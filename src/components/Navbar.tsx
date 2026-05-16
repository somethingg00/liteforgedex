"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance } from "wagmi";
import { useEffect, useState } from "react";
import { ForgeMark, cls } from "@/components/lf";
import { shortAddr, formatNumber } from "@/lib/format";

const BASE_NAV = [
  { href: "/", label: "HOME" },
  { href: "/swap", label: "SWAP" },
  { href: "/bridge", label: "BRIDGE" },
  { href: "/tokens", label: "TOKENS" },
  { href: "/stake", label: "STAKE" },
  { href: "/airdrop", label: "AIRDROP" },
  { href: "/activity", label: "ACTIVITY" },
];

// Isolated so blockHeight ticks don't re-render the entire nav
function NetworkBadge() {
  const [blockHeight, setBlockHeight] = useState<number>(4_182_907);
  useEffect(() => {
    const id = setInterval(() => setBlockHeight((b) => b + 1), 4000);
    return () => clearInterval(id);
  }, []);
  return (
    <>
      <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 border border-line2 rounded-full bg-panel2/40 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-ember pulse-dot" />
        <span className="font-mono text-[11px] tracking-wider text-dim2">
          TESTNET · CHAIN <span className="text-ink">4441</span> · BLK{" "}
          <span className="text-ember num">#{blockHeight.toLocaleString()}</span>
        </span>
      </div>
      <div className="hidden md:flex xl:hidden items-center gap-1.5 px-2.5 py-1.5 border border-line2 rounded-full bg-panel2/40 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-ember pulse-dot" />
        <span className="font-mono text-[10px] tracking-wider text-ember num">
          #{blockHeight.toLocaleString()}
        </span>
      </div>
    </>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { address } = useAccount();
  const NAV = BASE_NAV;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 h-14 flex items-center gap-3 lg:gap-5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <ForgeMark size={20} />
          <span className="font-mono font-extrabold tracking-[0.18em] text-ink text-sm">
            LITE<span className="text-ember">FORGE</span>
            <span className="ml-1.5 text-[9px] tracking-[0.2em] text-dim2 font-bold align-middle border border-line2 px-1 py-0.5 rounded-sm">
              DEX
            </span>
          </span>
        </Link>

        <NetworkBadge />

        {/* Nav */}
        <nav className="flex gap-0 ml-auto overflow-x-auto no-scrollbar">
          {NAV.map((n) => {
            const active =
              n.href === "/" ? pathname === "/" : pathname?.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cls(
                  "shrink-0 px-2 lg:px-3 py-1.5 font-mono text-[10px] lg:text-[11px] tracking-[0.12em] lg:tracking-[0.15em] transition-colors border-b-2 whitespace-nowrap",
                  active
                    ? "text-ember border-ember"
                    : "text-dim hover:text-ink border-transparent"
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <ForgeConnectButton />
      </div>
    </header>
  );
}

function ForgeConnectButton() {
  const { address, isConnected } = useAccount();
  const { data: nativeBal } = useBalance({ address });
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close dropdown on route change (e.g. after clicking PROFILE)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <ConnectButton.Custom>
      {({ openConnectModal, openAccountModal, chain, mounted }) => {
        const ready = mounted;
        if (!ready || !isConnected || !address) {
          return (
            <button
              onClick={openConnectModal}
              className="bracket font-mono text-[11px] tracking-[0.2em] text-ember hover:text-ink hover:bg-ember/10 px-2 py-1.5 transition-colors"
            >
              CONNECT WALLET
            </button>
          );
        }
        const wrong = chain?.unsupported;
        return (
          <div className="relative">
            <button
              onClick={() => setOpen((o) => !o)}
              className={cls(
                "flex items-center gap-2 px-3 py-1.5 border rounded-full bg-panel2/40 transition-colors",
                wrong
                  ? "border-warn/60 hover:border-warn"
                  : "border-line2 hover:border-ember/50"
              )}
            >
              <span
                className={cls(
                  "w-1.5 h-1.5 rounded-full pulse-dot",
                  wrong ? "bg-warn" : "bg-ember"
                )}
              />
              <span className="font-mono text-[11px] text-ink num">
                {shortAddr(address)}
              </span>
              <span className="text-dim">▾</span>
            </button>
            {open && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-72 lf-panel shadow-2xl z-40">
                  <div className="px-4 py-3 border-b border-line">
                    <div className="font-mono text-[10px] tracking-wider text-dim mb-1">
                      ACCOUNT
                    </div>
                    <div className="font-mono text-xs text-ink num break-all">
                      {address}
                    </div>
                  </div>
                  <div className="px-4 py-3 border-b border-line space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-[10px] tracking-wider text-dim">
                        NATIVE
                      </span>
                      <span className="font-mono text-xs text-ink num">
                        {nativeBal
                          ? formatNumber(nativeBal.value, nativeBal.decimals, 4)
                          : "—"}{" "}
                        <span className="text-dim ml-1">
                          {nativeBal?.symbol ?? "zkLTC"}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-[10px] tracking-wider text-dim">
                        CHAIN
                      </span>
                      <span className="font-mono text-xs text-ink num">
                        {chain?.name ?? "—"}
                      </span>
                    </div>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2.5 font-mono text-[11px] tracking-wider text-ember hover:bg-ember/10 border-b border-line"
                  >
                    ▸ PROFILE / PORTFOLIO
                  </Link>
                  <Link
                    href="/activity"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2.5 font-mono text-[11px] tracking-wider text-dim2 hover:text-ink hover:bg-ember/5 border-b border-line"
                  >
                    ▸ ACTIVITY HISTORY
                  </Link>
                  <button
                    onClick={() => {
                      setOpen(false);
                      openAccountModal();
                    }}
                    className="w-full text-left px-4 py-2.5 font-mono text-[11px] tracking-wider text-warn hover:bg-warn/10"
                  >
                    ▸ MANAGE / DISCONNECT
                  </button>
                </div>
              </>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
