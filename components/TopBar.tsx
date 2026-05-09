"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";
import type { ThemeMode } from "@/hooks/use-theme";

type Props = {
  theme: ThemeMode;
  onToggleTheme: () => void;
};

const NAV_LINKS = [
  { href: "/", label: "新規", icon: "plus" as const, match: (p: string) => p === "/" },
  {
    href: "/history",
    label: "履歴",
    icon: "history" as const,
    match: (p: string) => p.startsWith("/history") || p.startsWith("/meetings"),
  },
];

export default function TopBar({ theme, onToggleTheme }: Props) {
  const pathname = usePathname() ?? "/";
  return (
    <header className="topbar">
      <div className="brand">
        <Link href="/" className="brand-link">
          <div className="brand-mark">m</div>
          <span>minuet</span>
        </Link>
        <span className="brand-jp">AI 議事録ジェネレーター</span>
      </div>
      <nav className="topnav">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="topnav-link"
            data-active={link.match(pathname) ? "" : undefined}
          >
            <Icon name={link.icon} size={13} />
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>
      <div className="topbar-right">
        <button
          className="btn btn-icon btn-sm"
          onClick={onToggleTheme}
          title={theme === "light" ? "ダークモード" : "ライトモード"}
          aria-label="テーマ切り替え"
          type="button"
        >
          <Icon name={theme === "light" ? "moon" : "sun"} size={13} />
        </button>
      </div>
    </header>
  );
}
