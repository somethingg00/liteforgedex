import Link from "next/link";
import { ForgeMark } from "@/components/lf";

const PRODUCT_LINKS = [
  { href: "/", label: "Home" },
  { href: "/swap", label: "Swap" },
  { href: "/liquidity", label: "Liquidity" },
  { href: "/profile", label: "Portfolio" },
  { href: "/about", label: "About" },
];

export function Footer() {
  return (
    <footer className="border-t border-line/60 bg-bg">
      <div className="max-w-[1480px] mx-auto px-4 md:px-8 lg:px-12 pt-12 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4 group">
              <div className="w-9 h-9 rounded-full border border-ember/30 flex items-center justify-center bg-panel2/60 group-hover:border-ember/60 transition-colors">
                <ForgeMark size={18} />
              </div>
              <span className="font-mono font-extrabold text-[15px] tracking-[0.08em] text-ink">
                LiteForge<span className="text-ember"> DEX</span>
              </span>
            </Link>
            <p className="font-mono text-[12px] text-dim leading-relaxed mb-5 max-w-[280px]">
              LiteForge DEX — built to dominate DeFi on LitVM with advanced
              swaps, powerful liquidity tools, live analytics, and seamless
              portfolio control.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-2.5">
              <a
                href="https://twitter.com/LitecoinVM"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X / Twitter — @LitecoinVM"
                title="@LitecoinVM (Project)"
                className="w-9 h-9 rounded-full border border-line2 flex items-center justify-center text-dim hover:text-ink hover:border-ember/50 bg-panel2/40 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://x.com/ssomethingg00"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Developer — @ssomethingg00"
                title="@ssomethingg00 (Developer)"
                className="w-9 h-9 rounded-full border border-line2 flex items-center justify-center text-dim hover:text-ink hover:border-ember/50 bg-panel2/40 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 18l6-6-6-6" />
                  <path d="M8 6l-6 6 6 6" />
                </svg>
              </a>
              <span
                aria-label="Telegram — coming soon"
                title="Telegram — Coming Soon"
                className="w-9 h-9 rounded-full border border-line2/60 flex items-center justify-center text-dim/40 bg-panel2/30 cursor-not-allowed relative"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              </span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-mono text-[10px] tracking-[0.28em] text-ink font-bold mb-5">
              PRODUCT
            </h4>
            <ul className="space-y-3.5">
              {PRODUCT_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="font-mono text-[13px] text-dim hover:text-ember transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-mono text-[10px] tracking-[0.28em] text-ink font-bold mb-5">
              RESOURCES
            </h4>
            <ul className="space-y-3.5">
              <li>
                <a
                  href="https://docs.litvm.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[13px] text-dim hover:text-ember transition-colors inline-flex items-center gap-1.5"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  Documentation{" "}
                  <span className="text-dim2 text-[11px]">(Partial)</span>
                </a>
              </li>
              <li>
                <span className="font-mono text-[13px] text-dim/40 cursor-not-allowed inline-flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                  Dev Resources{" "}
                  <span className="text-[11px]">(Soon)</span>
                </span>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-mono text-[10px] tracking-[0.28em] text-ink font-bold mb-5">
              SUPPORT
            </h4>
            <ul className="space-y-3.5">
              <li>
                <a
                  href="#"
                  className="font-mono text-[13px] text-dim hover:text-ember transition-colors inline-flex items-center gap-1.5"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  Help Center
                </a>
              </li>
              <li>
                <span className="font-mono text-[13px] text-dim/40 cursor-not-allowed inline-flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                  Telegram{" "}
                  <span className="text-[11px]">(Soon)</span>
                </span>
              </li>
              <li>
                <span className="font-mono text-[13px] text-dim/40 cursor-not-allowed inline-flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  Email{" "}
                  <span className="text-[11px]">(Soon)</span>
                </span>
              </li>
              <li>
                <a
                  href="#"
                  className="font-mono text-[13px] text-dim hover:text-ember transition-colors inline-flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-ember pulse-dot shrink-0" />
                  Status
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-5 border-t border-line/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-mono text-[11px] text-dim">
            © 2026 LiteForge DEX. All rights reserved.
          </span>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((label) => (
              <a
                key={label}
                href="#"
                className="font-mono text-[11px] text-dim hover:text-ember transition-colors"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
