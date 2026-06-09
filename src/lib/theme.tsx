import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export const CUSTOM_COLOURS = [
  { name: "Coral",  hex: "#ff6f61" },
  { name: "Yellow", hex: "#ffd23f" },
  { name: "Green",  hex: "#4ade80" },
  { name: "Blue",   hex: "#3b82f6" },
  { name: "Pink",   hex: "#ec4899" },
  { name: "Orange", hex: "#f97316" },
  { name: "Cyan",   hex: "#22d3ee" },
  { name: "Red",    hex: "#ef4444" },
] as const;

export const DEFAULT_HEX = "#ffffff";

type RouteKey = "home" | "search" | "library" | "settings" | "album" | "artist" | "player";

type ThemeState = {
  rainbow: boolean;
  aurora: boolean;           // animated multi-color aurora background
  paint: boolean;            // custom colour applied to whole app
  perScreen: boolean;        // each route gets a unique colour
  accent: string;            // currently active hex
  baseAccent: string;        // user-picked hex (custom-colour pref)
  setRainbow: (v: boolean) => void;
  setAurora: (v: boolean) => void;
  setPaint: (v: boolean) => void;
  setPerScreen: (v: boolean) => void;
  setAccent: (hex: string) => void;
  reset: () => void;
  registerRoute: (key: RouteKey) => void;
};

const ThemeCtx = createContext<ThemeState | null>(null);

const PER_SCREEN_MAP: Record<RouteKey, string> = {
  home:     "#ffd23f",
  search:   "#22d3ee",
  library:  "#4ade80",
  settings: "#ec4899",
  album:    "#f97316",
  artist:   "#3b82f6",
  player:   "#ff6f61",
};

const LS_KEY = "yvl.theme.v1";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [rainbow, setRainbow] = useState(false);
  const [aurora, setAurora] = useState(false);
  const [paint, setPaint] = useState(false);
  const [perScreen, setPerScreen] = useState(false);
  const [baseAccent, setBaseAccent] = useState(DEFAULT_HEX);
  const [routeKey, setRouteKey] = useState<RouteKey>("home");

  // Hydrate from storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      setRainbow(!!s.rainbow);
      setAurora(!!s.aurora);
      setPaint(!!s.paint);
      setPerScreen(!!s.perScreen);
      if (typeof s.baseAccent === "string") setBaseAccent(s.baseAccent);
    } catch {}
  }, []);

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ rainbow, aurora, paint, perScreen, baseAccent }));
    } catch {}
  }, [rainbow, aurora, paint, perScreen, baseAccent]);

  const accent = useMemo(() => {
    if (rainbow) return baseAccent;
    if (perScreen) return PER_SCREEN_MAP[routeKey];
    return baseAccent;
  }, [rainbow, perScreen, baseAccent, routeKey]);

  // Apply to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--accent-hex", accent);
    root.dataset.rainbow = rainbow ? "on" : "off";
    root.dataset.aurora = aurora ? "on" : "off";
    const painted = paint || perScreen || rainbow;
    root.dataset.paint = painted ? "on" : "off";
  }, [accent, rainbow, aurora, paint, perScreen]);

  const value: ThemeState = {
    rainbow, aurora, paint, perScreen,
    accent, baseAccent,
    setRainbow,
    setAurora,
    setPaint,
    setPerScreen,
    setAccent: setBaseAccent,
    reset: () => { setRainbow(false); setAurora(false); setPaint(false); setPerScreen(false); setBaseAccent(DEFAULT_HEX); },
    registerRoute: setRouteKey,
  };

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const v = useContext(ThemeCtx);
  if (!v) throw new Error("useTheme outside provider");
  return v;
}

export function useRouteAccent(key: RouteKey) {
  const { registerRoute } = useTheme();
  useEffect(() => { registerRoute(key); }, [key, registerRoute]);
}
