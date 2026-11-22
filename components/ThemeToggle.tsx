
"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const subscribe = () => () => { };

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Change theme"
        disabled
        className="flex size-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-400 opacity-50 dark:border-white/10"
      >
        <Sun size={16} />
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
      className="flex size-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-950 dark:border-white/10 dark:text-neutral-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
