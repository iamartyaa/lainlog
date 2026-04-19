"use client";

import { motion } from "motion/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { PRESS } from "@/lib/motion";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className="inline-block h-6 w-6 -m-[10px] p-[10px]" aria-hidden="true" />;
  }

  const next = resolvedTheme === "dark" ? "light" : "dark";

  const handleToggle = () => {
    // Set the attribute synchronously before flipping the theme, so the
    // accent-bridge keyframe in globals.css fires in the same frame as the
    // color-variable swap. A useEffect watching `resolvedTheme` would arrive
    // one render late and miss the desaturation bridge.
    document.documentElement.setAttribute("data-theme-transitioning", "");
    setTheme(next);
    window.setTimeout(() => {
      document.documentElement.removeAttribute("data-theme-transitioning");
    }, 260);
  };

  return (
    <motion.button
      type="button"
      onClick={handleToggle}
      aria-label={`Switch to ${next} theme`}
      className="inline-flex h-[44px] w-[44px] -m-[10px] items-center justify-center text-[color:var(--color-text-muted)] transition-colors hover:text-[color:var(--color-text)]"
      {...PRESS}
    >
      {resolvedTheme === "dark" ? (
        <SunIcon className="h-[14px] w-[14px]" />
      ) : (
        <MoonIcon className="h-[14px] w-[14px]" />
      )}
    </motion.button>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 14" fill="none" className={className} aria-hidden="true">
      <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.25" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <line
          key={deg}
          x1="7"
          y1="1"
          x2="7"
          y2="2.75"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          transform={`rotate(${deg} 7 7)`}
        />
      ))}
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 14" fill="none" className={className} aria-hidden="true">
      <path
        d="M11.5 8.5A5 5 0 0 1 5.5 2.5a.5.5 0 0 0-.7-.45A5.5 5.5 0 1 0 11.95 9.2a.5.5 0 0 0-.45-.7Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
