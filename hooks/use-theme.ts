"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ThemeMode = "light" | "dark";
export type Density = "compact" | "regular" | "comfortable";
export type PreviewLayout = "single" | "split";

export type ThemeState = {
  theme: ThemeMode;
  density: Density;
  layout: PreviewLayout;
  accent: string;
};

const STORAGE_KEY = "minuet.theme";

const DEFAULT_THEME: ThemeState = {
  theme: "light",
  density: "regular",
  layout: "single",
  accent: "#2563eb",
};

function hexToRgb(hex: string) {
  const m = hex.replace("#", "");
  return {
    r: parseInt(m.slice(0, 2), 16),
    g: parseInt(m.slice(2, 4), 16),
    b: parseInt(m.slice(4, 6), 16),
  };
}

function hexToSoft(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, 0.10)`;
}

function hexShift(hex: string, delta: number): string {
  const { r, g, b } = hexToRgb(hex);
  const f = (v: number) => Math.max(0, Math.min(255, v + delta));
  return `rgb(${f(r)}, ${f(g)}, ${f(b)})`;
}

function applyToDocument(state: ThemeState) {
  const root = document.documentElement;
  root.dataset.theme = state.theme;
  root.dataset.density = state.density;
  root.style.setProperty("--accent", state.accent);
  root.style.setProperty("--accent-soft", hexToSoft(state.accent));
  root.style.setProperty("--accent-ink", hexShift(state.accent, -12));
}

function readStoredTheme(): ThemeState {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ThemeState>;
      return { ...DEFAULT_THEME, ...parsed };
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME;
}

export function useTheme() {
  const [state, setState] = useState<ThemeState>(readStoredTheme);
  const isFirstRun = useRef(true);

  useEffect(() => {
    applyToDocument(state);
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const set = useCallback(<K extends keyof ThemeState>(key: K, value: ThemeState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  return { ...state, set };
}
