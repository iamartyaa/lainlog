"use client";

/**
 * <CourseStop> — a single milestone card rendered along the serpentine path
 * inside <CourseOutline>. Two visual modes share this component:
 *
 *   1. "scattered" — desktop, polaroid-tilt card absolutely positioned over
 *      the SVG canvas. Owned by <CourseOutline>'s anchor table.
 *   2. "stacked"   — mobile fallback, vertical-timeline row sized to its
 *      container with the numbered marker pinned to a left rail.
 *
 * Type-badge palette obeys DESIGN.md §3 (one terracotta accent). Variation
 * across LESSON / INTERACTIVE / QUIZ / PROJECT / CHALLENGE comes from
 * opacity + saturation of the same accent token, plus border treatment —
 * no new hues introduced.
 *
 * Reduced-motion: parent passes `reduced` and gates entrance animation. The
 * card itself does not own a useReducedMotion hook to avoid duplicate gates.
 */

import { motion } from "motion/react";
import { SPRING } from "@/lib/motion";
import type { CourseSectionType } from "@/content/courses-manifest";

const BADGE_LABEL: Record<CourseSectionType, string> = {
  lesson: "LESSON",
  interactive: "INTERACTIVE",
  quiz: "QUIZ",
  project: "PROJECT",
  challenge: "CHALLENGE",
};

/**
 * Type-badge styling. All variants stay inside the one-accent rule (§3) —
 * variation is driven by `color-mix` percentages, fill vs outline, and
 * background opacity. No new hues introduced.
 */
function badgeStyle(type: CourseSectionType): React.CSSProperties {
  const base: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: "0.6875rem",
    letterSpacing: "0.08em",
    padding: "2px 6px",
    borderRadius: "var(--radius-sm)",
    display: "inline-block",
    lineHeight: 1.4,
  };
  switch (type) {
    case "lesson":
      // Quiet wash — terracotta tinted surface, accent text.
      return {
        ...base,
        background:
          "color-mix(in oklab, var(--color-accent) 12%, transparent)",
        color: "var(--color-accent)",
      };
    case "interactive":
      // Muted variant — accent mixed with text-muted, on neutral surface.
      return {
        ...base,
        background: "var(--color-surface)",
        color:
          "color-mix(in oklab, var(--color-accent) 70%, var(--color-text-muted))",
        border: "1px solid var(--color-rule)",
      };
    case "quiz":
      // Solid terracotta — the loud one (used sparingly).
      return {
        ...base,
        background: "var(--color-accent)",
        color: "var(--color-bg)",
      };
    case "project":
      // Dark text on a deeper accent wash — reads as substantial.
      return {
        ...base,
        background:
          "color-mix(in oklab, var(--color-accent) 22%, transparent)",
        color: "var(--color-text)",
      };
    case "challenge":
      // Outline-only — the quietest variant.
      return {
        ...base,
        background: "transparent",
        color: "var(--color-accent)",
        border: "1px solid var(--color-accent)",
      };
  }
}

type Props = {
  number: number;
  title: string;
  type: CourseSectionType;
  description?: string;
  /** Tilt in degrees (signed). Ignored in stacked mode. */
  tilt?: number;
  /** Stagger delay (seconds) — parent computes from stop index. */
  delay?: number;
  /** Reduced motion → render final state. */
  reduced?: boolean;
  /**
   * Stacked = mobile/vertical-timeline mode. The card spans full width and
   * the parent owns the left rail. Default false (= scattered/desktop).
   */
  stacked?: boolean;
};

export function CourseStop({
  number,
  title,
  type,
  description,
  tilt = 0,
  delay = 0,
  reduced = false,
  stacked = false,
}: Props) {
  const initial = reduced
    ? { opacity: 1, y: 0 }
    : { opacity: 0, y: 8 };
  const animate = { opacity: 1, y: 0 };

  return (
    <motion.div
      initial={initial}
      animate={animate}
      transition={
        reduced
          ? { duration: 0.001 }
          : { ...SPRING.smooth, delay }
      }
      className="relative"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-rule)",
        borderRadius: "var(--radius-md)",
        padding: "var(--spacing-sm) var(--spacing-md)",
        // Polaroid-tilt only in scattered mode. Stacked rows stay flat.
        transform: stacked ? undefined : `rotate(${tilt}deg)`,
        // Constrain card width on desktop so titles don't sprawl across the canvas.
        maxWidth: stacked ? undefined : "260px",
      }}
    >
      <div
        className="flex items-baseline gap-[var(--spacing-2xs)]"
        style={{ marginBottom: "var(--spacing-3xs)" }}
      >
        <span style={badgeStyle(type)}>{BADGE_LABEL[type]}</span>
        <span
          className="font-mono tabular-nums"
          style={{
            fontSize: "var(--text-small)",
            color: "var(--color-text-muted)",
            marginLeft: "auto",
          }}
        >
          {String(number).padStart(2, "0")}
        </span>
      </div>
      <h3
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-h3)",
          lineHeight: 1.2,
          letterSpacing: "-0.01em",
          margin: 0,
          color: "var(--color-text)",
        }}
      >
        {title}
      </h3>
      {description ? (
        <p
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "var(--text-small)",
            lineHeight: 1.45,
            color: "var(--color-text-muted)",
            marginTop: "var(--spacing-3xs)",
            marginBottom: 0,
          }}
        >
          {description}
        </p>
      ) : null}
    </motion.div>
  );
}
