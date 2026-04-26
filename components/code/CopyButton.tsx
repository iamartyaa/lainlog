"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { PRESS } from "@/lib/motion";
import { playSound } from "@/lib/audio";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      // Audio fires AFTER the clipboard write resolves — the sound is the
      // success cue, paired with the visible "copied" label change.
      playSound("Copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard API may be unavailable in insecure contexts — fail silently.
    }
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={copied ? "Copied" : "Copy code"}
      data-copied={copied || undefined}
      className="bs-copy-btn absolute right-1 top-1 inline-flex min-h-[44px] min-w-[44px] select-none items-center justify-center font-sans transition-colors duration-[var(--dur-base,240ms)]"
      style={{ fontSize: "var(--text-small)" }}
      {...PRESS}
    >
      {copied ? "copied" : "copy"}
    </motion.button>
  );
}
