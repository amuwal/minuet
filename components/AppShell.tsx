"use client";

import { useTheme } from "@/hooks/use-theme";
import TopBar from "./TopBar";

type Props = {
  children: React.ReactNode;
};

export default function AppShell({ children }: Props) {
  const theme = useTheme();
  return (
    <div className="app">
      <TopBar
        theme={theme.theme}
        onToggleTheme={() => theme.set("theme", theme.theme === "light" ? "dark" : "light")}
      />
      {children}
    </div>
  );
}
