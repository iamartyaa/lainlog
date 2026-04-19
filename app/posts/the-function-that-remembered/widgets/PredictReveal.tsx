"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SPRING } from "@/lib/motion";

type Props = {
  answer: string;
  label?: string;
};

/**
 * Tiny inline beat: the reader guesses first, clicks to reveal. Used at §1 to
 * plant the scene before the full widget in §2. Keeps the reader's agency
 * ahead of the explanation.
 */
export function PredictReveal({ answer, label = "reveal" }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <span
      style={{ display: "inline-flex", alignItems: "baseline", gap: "0.5ch" }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {open ? (
          <motion.span
            key="answer"
            layout
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={SPRING.snappy}
            className="font-mono tabular-nums"
            style={{
              fontSize: "var(--text-mono)",
              color: "var(--color-accent)",
              background: "color-mix(in oklab, var(--color-accent) 10%, transparent)",
              padding: "0 6px",
              borderRadius: "var(--radius-sm)",
            }}
          >
            {answer}
          </motion.span>
        ) : (
          <motion.button
            key="trigger"
            type="button"
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(true)}
            className="font-mono rounded-[var(--radius-sm)] transition-colors hover:text-[color:var(--color-accent)]"
            style={{
              fontSize: "var(--text-mono)",
              background: "var(--color-surface)",
              color: "var(--color-text-muted)",
              padding: "0 8px",
              border: "none",
              cursor: "pointer",
            }}
          >
            {label} →
          </motion.button>
        )}
      </AnimatePresence>
    </span>
  );
}
