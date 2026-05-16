"use client";

import { useState } from "react";
import { TokenGlyph } from "./Glyphs";

export type PickerToken = {
  address: string;
  symbol: string;
  name: string;
  registered?: boolean;
};

export function TokenPicker({
  open,
  onClose,
  onPick,
  tokens,
  exclude,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (t: PickerToken) => void;
  tokens: PickerToken[];
  exclude?: string;
}) {
  const [q, setQ] = useState("");
  if (!open) return null;
  const lc = q.toLowerCase();
  const filtered = tokens
    .filter((t) => !exclude || t.address.toLowerCase() !== exclude.toLowerCase())
    .filter(
      (t) =>
        !q ||
        t.symbol.toLowerCase().includes(lc) ||
        t.name.toLowerCase().includes(lc) ||
        t.address.toLowerCase().includes(lc)
    );
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-bg/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md lf-panel"
      >
        <div className="flex items-center justify-between px-5 h-12 border-b border-line">
          <h3 className="font-mono text-[11px] tracking-[0.2em] text-dim2">
            SELECT TOKEN
          </h3>
          <button
            onClick={onClose}
            className="text-dim hover:text-ink font-mono"
          >
            ✕
          </button>
        </div>
        <div className="p-4 border-b border-line">
          <input
            className="lf-input"
            placeholder="search by name / symbol / 0x…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="max-h-80 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="p-6 text-center font-mono text-xs text-dim">
              no matches
            </div>
          )}
          {filtered.map((t) => (
            <button
              key={t.address}
              onClick={() => {
                onPick(t);
                onClose();
              }}
              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-ember/5 border-b border-line text-left transition-colors"
            >
              <TokenGlyph symbol={t.symbol} size={32} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-ink text-sm">
                    {t.symbol}
                  </span>
                  <span className="text-dim text-xs">{t.name}</span>
                </div>
                <div className="font-mono text-[10px] text-dim num truncate">
                  {t.address}
                </div>
              </div>
              {t.registered && (
                <span className="font-mono text-[9px] tracking-wider text-ember border border-ember/40 px-1.5 py-0.5">
                  REG
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
