"use client";

import { useEffect } from "react";

export function Toast({
  msg,
  onClose,
}: {
  msg: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(onClose, 3500);
    return () => clearTimeout(id);
  }, [msg, onClose]);
  if (!msg) return null;
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-3 lf-panel lf-panel-glow rounded-xl">
      <span className="font-mono text-[11px] tracking-wider text-ember">▸ {msg}</span>
    </div>
  );
}
