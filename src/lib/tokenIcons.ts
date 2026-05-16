"use client";

import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Available icon library.
// Drop image files into  src/icons/  and register them here so the admin panel
// dropdown can offer them. Key = filename (shown in UI), value = bundled URL.
// ---------------------------------------------------------------------------
import eth from "@/icons/eth.png";
import bnb from "@/icons/bnb.ico";

import weth from "@/icons/weth.png";
import link from "@/icons/link.png";
import dai from "@/icons/dai.png";
import uni from "@/icons/uni.png";
import aave from "@/icons/aave.png";
import arb from "@/icons/arb.jpg";
import wbtc from "@/icons/wbtc.png";
import usdc from "@/icons/usdc.png";
import matic from "@/icons/matic.png";
import sol from "@/icons/sol.png";
export const ICON_LIBRARY: Record<string, string> = {
  "eth.png": eth.src,
  "bnb.ico": bnb.src,
  "weth.png": weth.src,
  "link.png": link.src,
  "dai.png": dai.src,
  "uni.png": uni.src,
  "aave.png": aave.src,
  "arb.jpg": arb.src,
  "wbtc.png": wbtc.src,
  "usdc.png": usdc.src,
  "matic.png": matic.src,
  "sol.png": sol.src,
};

export function getAvailableIcons(): string[] {
  return Object.keys(ICON_LIBRARY);
}

// ---------------------------------------------------------------------------
// Address -> iconKey mapping, persisted to localStorage (per browser).
// Cross-browser sharing requires a backend — see README/ADMIN notes.
// ---------------------------------------------------------------------------
const STORAGE_KEY = "litvm:tokenIconMap";
const CHANGE_EVENT = "litvm:tokenIconMap:changed";

type IconMap = Record<string, string>; // lowercased address -> iconKey

function readMap(): IconMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as IconMap) : {};
  } catch {
    return {};
  }
}

function writeMap(map: IconMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function getTokenIcon(address?: string | null): string | undefined {
  if (!address || typeof window === "undefined") return undefined;
  const map = readMap();
  const key = map[address.toLowerCase()];
  return key ? ICON_LIBRARY[key] : undefined;
}

export function setTokenIconMapping(address: string, iconKey: string) {
  if (!address || !iconKey) return;
  const map = readMap();
  map[address.toLowerCase()] = iconKey;
  writeMap(map);
}

export function removeTokenIconMapping(address: string) {
  if (!address) return;
  const map = readMap();
  delete map[address.toLowerCase()];
  writeMap(map);
}

export function getAllMappings(): IconMap {
  return readMap();
}

// ---------------------------------------------------------------------------
// React hooks — re-render when the mapping changes (in this tab or another).
// ---------------------------------------------------------------------------
export function useTokenIcon(address?: string | null): string | undefined {
  const [icon, setIcon] = useState<string | undefined>(undefined);
  useEffect(() => {
    const update = () => setIcon(getTokenIcon(address));
    update();
    window.addEventListener(CHANGE_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(CHANGE_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, [address]);
  return icon;
}

export function useAllTokenIconMappings(): IconMap {
  const [map, setMap] = useState<IconMap>({});
  useEffect(() => {
    const update = () => setMap(readMap());
    update();
    window.addEventListener(CHANGE_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(CHANGE_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return map;
}
