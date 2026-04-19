"use client";

import { motion } from "motion/react";
import { SPRING } from "@/lib/motion";

export type BlockState = "empty" | "set" | "active";

type Props = {
  /** Position on parent SVG */
  x: number;
  y: number;
  /** Size in SVG units. Default 32. */
  size?: number;
  state?: BlockState;
  /** Optional label (e.g. index) rendered centered. */
  label?: string | number;
  /** Ignored if `state` changes drive animation; keeps the block stable. */
  as?: "motion" | "static";
};

/**
 * Block — the canonical "cell" shape. The same component teaches a bit,
 * a tensor cell, a stack frame, a token. One shape across every post.
 * Terracotta fill = "state = set" (DESIGN.md §7 teaching signal).
 */
export function Block({ x, y, size = 32, state = "empty", label, as = "motion" }: Props) {
  const fill =
    state === "set"
      ? "var(--color-accent)"
      : state === "active"
        ? "var(--color-accent-pressed)"
        : "transparent";

  const stroke = state === "empty" ? "var(--color-rule)" : "transparent";

  return (
    <g>
      {as === "motion" ? (
        <motion.rect
          x={x}
          y={y}
          width={size}
          height={size}
          rx={2}
          ry={2}
          strokeWidth={1}
          initial={false}
          animate={{ fill, stroke }}
          transition={SPRING.snappy}
        />
      ) : (
        <rect
          x={x}
          y={y}
          width={size}
          height={size}
          rx={2}
          ry={2}
          strokeWidth={1}
          fill={fill}
          stroke={stroke}
        />
      )}
      {label !== undefined ? (
        <text
          x={x + size / 2}
          y={y + size / 2}
          dominantBaseline="central"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize={size * 0.38}
          fill={
            state === "empty" ? "var(--color-text-muted)" : "var(--color-bg)"
          }
          style={{ userSelect: "none" }}
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}
