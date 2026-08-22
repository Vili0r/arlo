"use client";

import * as React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-8 w-8 rounded-md border border-border bg-card p-1.5 opacity-50" />
    );
  }

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-card/60 p-0.5">
      <button
        onClick={() => setTheme("light")}
        title="Light Mode"
        className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition-colors ${
          theme === "light"
            ? "bg-accent text-accent-foreground shadow-xs"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <Sun className="h-3.5 w-3.5" />
        <span className="sr-only">Light</span>
      </button>
      <button
        onClick={() => setTheme("dark")}
        title="Dark Mode"
        className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition-colors ${
          theme === "dark"
            ? "bg-accent text-accent-foreground shadow-xs"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <Moon className="h-3.5 w-3.5" />
        <span className="sr-only">Dark</span>
      </button>
      <button
        onClick={() => setTheme("system")}
        title="System Preference"
        className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition-colors ${
          theme === "system"
            ? "bg-accent text-accent-foreground shadow-xs"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <Monitor className="h-3.5 w-3.5" />
        <span className="sr-only">System</span>
      </button>
    </div>
  );
}
