"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { PRESS } from "@/lib/motion";
import { SITE_NAME } from "@/lib/site";
import { AudioToggle } from "./AudioToggle";
import { ThemeToggle } from "./theme-toggle";

const MotionLink = motion.create(Link);

export function Header() {
  return (
    <header
      className="flex h-[56px] sm:h-[64px] items-center justify-between px-[var(--spacing-md)] sm:px-[var(--spacing-lg)]"
      style={{ fontSize: "var(--text-ui)" }}
    >
      <MotionLink
        href="/"
        aria-label={`${SITE_NAME} — home`}
        className="group inline-flex items-center gap-[var(--spacing-2xs)] font-mono transition-colors hover:text-[color:var(--color-accent)]"
        style={{
          fontSize: "0.9375rem",
          letterSpacing: "0.02em",
        }}
        {...PRESS}
      >
        <span
          aria-hidden
          className="inline-block h-[12px] w-[12px] sm:h-[10px] sm:w-[10px] shrink-0 transition-transform group-hover:scale-110"
          style={{ background: "var(--color-accent)" }}
        />
        <span>{SITE_NAME}</span>
      </MotionLink>

      <nav className="flex items-center gap-[var(--spacing-md)]">
        <AudioToggle />
        <ThemeToggle />
      </nav>
    </header>
  );
}
