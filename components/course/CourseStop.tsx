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
 * Tier-coding (PR #67 enrichment):
 *   - lesson      → 1 px border, accent 6% wash background
 *   - interactive → 1 px border, no wash (quietest)
 *   - quiz        → 1.5 px terracotta border, accent 12% wash
 *   - project     → 2 px terracotta border, accent 16% wash, larger title
 *   - challenge   → 1 px border, no wash (kept aligned with interactive)
 *
 * Icons are inline SVG blocks rendered beside the title. They're all 24×24,
 * stroke-only, terracotta + muted neutrals. No external icon library.
 *
 * Reduced-motion: parent passes `reduced` and gates entrance animation. The
 * card itself does not own a useReducedMotion hook to avoid duplicate gates.
 */

import { motion } from "motion/react";
import { SPRING } from "@/lib/motion";
import type {
  CourseSectionIcon,
  CourseSectionType,
} from "@/content/courses-manifest";

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
      return {
        ...base,
        background:
          "color-mix(in oklab, var(--color-accent) 12%, transparent)",
        color: "var(--color-accent)",
      };
    case "interactive":
      return {
        ...base,
        background: "var(--color-surface)",
        color:
          "color-mix(in oklab, var(--color-accent) 70%, var(--color-text-muted))",
        border: "1px solid var(--color-rule)",
      };
    case "quiz":
      return {
        ...base,
        background: "var(--color-accent)",
        color: "var(--color-bg)",
      };
    case "project":
      return {
        ...base,
        background:
          "color-mix(in oklab, var(--color-accent) 22%, transparent)",
        color: "var(--color-text)",
      };
    case "challenge":
      return {
        ...base,
        background: "transparent",
        color: "var(--color-accent)",
        border: "1px solid var(--color-accent)",
      };
  }
}

/**
 * Tier coding — drives card border weight, background wash, and effective
 * width. Major lessons read as standard milestones; quizzes/projects read
 * as denser, weightier checkpoints. Interactives are quietest (no wash).
 *
 * Width values are emitted as CSS `min(Xpx, Y%)` so the cards still scale
 * with the responsive SVG canvas above 720 px. Below 720 px the stacked
 * mode ignores width entirely.
 */
type Tier = {
  borderWidth: number;
  borderColor: string;
  background: string;
  /** Polaroid mode max-width. */
  maxWidth: number;
  titleSize: string;
  /** Card padding. */
  padding: string;
};

function tierFor(type: CourseSectionType): Tier {
  switch (type) {
    case "project":
      // The destination — biggest card, deepest wash, heaviest border.
      return {
        borderWidth: 2,
        borderColor: "var(--color-accent)",
        background:
          "color-mix(in oklab, var(--color-accent) 16%, var(--color-surface))",
        maxWidth: 320,
        titleSize: "calc(var(--text-h3) * 1.05)",
        padding: "var(--spacing-md) var(--spacing-md)",
      };
    case "quiz":
      // Checkpoint — slightly denser. Heavier border, mid wash.
      return {
        borderWidth: 1.5,
        borderColor: "var(--color-accent)",
        background:
          "color-mix(in oklab, var(--color-accent) 12%, var(--color-surface))",
        maxWidth: 230,
        titleSize: "var(--text-h3)",
        padding: "var(--spacing-2xs) var(--spacing-sm)",
      };
    case "interactive":
      // Quietest tier — no wash, tighter padding, smallest card.
      return {
        borderWidth: 1,
        borderColor: "var(--color-rule)",
        background: "var(--color-surface)",
        maxWidth: 240,
        titleSize: "var(--text-h3)",
        padding: "var(--spacing-2xs) var(--spacing-sm)",
      };
    case "challenge":
      return {
        borderWidth: 1,
        borderColor: "var(--color-rule)",
        background: "var(--color-surface)",
        maxWidth: 260,
        titleSize: "var(--text-h3)",
        padding: "var(--spacing-sm) var(--spacing-md)",
      };
    case "lesson":
    default:
      // Standard — light wash, 1 px border.
      return {
        borderWidth: 1,
        borderColor: "var(--color-rule)",
        background:
          "color-mix(in oklab, var(--color-accent) 6%, var(--color-surface))",
        maxWidth: 260,
        titleSize: "var(--text-h3)",
        padding: "var(--spacing-sm) var(--spacing-md)",
      };
  }
}

/**
 * Inline-SVG icon blocks. All 24×24, stroke-only, terracotta accent + muted
 * neutrals. Built original — no external icon library, no copied glyphs from
 * the reference. Subtle by design: they're flavor, not focal points.
 */
function StopIcon({ icon }: { icon: CourseSectionIcon }) {
  const accent = "var(--color-accent)";
  const muted = "var(--color-text-muted)";
  switch (icon) {
    case "tokenization":
      // A lozenge "token" with internal divisions + a cursor on the left.
      return (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          aria-hidden
          focusable={false}
        >
          <line x1="3" y1="6" x2="3" y2="18" stroke={muted} strokeWidth={1.25} />
          <rect
            x="6"
            y="9"
            width="15"
            height="6"
            rx="3"
            stroke={accent}
            strokeWidth={1.25}
            fill="none"
          />
          <line x1="11" y1="9" x2="11" y2="15" stroke={accent} strokeWidth={1.25} />
          <line x1="16" y1="9" x2="16" y2="15" stroke={accent} strokeWidth={1.25} />
        </svg>
      );
    case "embedding-table":
      // 3 stacked rectangles, each subdivided into a few cells.
      return (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          aria-hidden
          focusable={false}
        >
          <g stroke={accent} strokeWidth={1.25} fill="none">
            <rect x="3" y="4" width="18" height="4" rx="0.5" />
            <rect x="3" y="10" width="18" height="4" rx="0.5" />
            <rect x="3" y="16" width="18" height="4" rx="0.5" />
          </g>
          <g stroke={muted} strokeWidth={1}>
            <line x1="9" y1="4" x2="9" y2="8" />
            <line x1="15" y1="4" x2="15" y2="8" />
            <line x1="9" y1="10" x2="9" y2="14" />
            <line x1="15" y1="10" x2="15" y2="14" />
            <line x1="9" y1="16" x2="9" y2="20" />
            <line x1="15" y1="16" x2="15" y2="20" />
          </g>
        </svg>
      );
    case "matrix":
      // 3×3 grid of dots — a "matrix multiply" motif.
      return (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          aria-hidden
          focusable={false}
        >
          {[6, 12, 18].map((y) =>
            [6, 12, 18].map((x) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r={1.5} fill={accent} />
            ))
          )}
        </svg>
      );
    case "attention":
      // Q-K-V triangle with attention edges between three nodes.
      return (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          aria-hidden
          focusable={false}
        >
          <g stroke={muted} strokeWidth={1} strokeLinecap="round">
            <line x1="6" y1="18" x2="18" y2="18" />
            <line x1="6" y1="18" x2="12" y2="6" />
            <line x1="18" y1="18" x2="12" y2="6" />
          </g>
          <circle cx="12" cy="6" r="2.25" fill={accent} />
          <circle cx="6" cy="18" r="2.25" fill={accent} />
          <circle cx="18" cy="18" r="2.25" fill={accent} />
        </svg>
      );
    case "transformer":
      // Stack of 3 layers with arrows ascending between them.
      return (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          aria-hidden
          focusable={false}
        >
          <g stroke={accent} strokeWidth={1.25} fill="none">
            <rect x="4" y="16" width="16" height="4" rx="0.5" />
            <rect x="4" y="10" width="16" height="4" rx="0.5" />
            <rect x="4" y="4" width="16" height="4" rx="0.5" />
          </g>
          <g stroke={muted} strokeWidth={1} strokeLinecap="round">
            <line x1="12" y1="16" x2="12" y2="14" />
            <line x1="12" y1="10" x2="12" y2="8" />
          </g>
        </svg>
      );
    case "histogram":
      // Three bars at decreasing heights — a sampling distribution.
      return (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          aria-hidden
          focusable={false}
        >
          <line
            x1="3"
            y1="20"
            x2="21"
            y2="20"
            stroke={muted}
            strokeWidth={1}
          />
          <g fill={accent}>
            <rect x="5" y="6" width="4" height="13" />
            <rect x="11" y="11" width="4" height="8" />
            <rect x="17" y="15" width="4" height="4" />
          </g>
        </svg>
      );
    case "server":
      // Three stacked cylinders — a server stack.
      return (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          aria-hidden
          focusable={false}
        >
          <g stroke={accent} strokeWidth={1.25} fill="none">
            <ellipse cx="12" cy="5" rx="7" ry="2" />
            <path d="M5 5v4c0 1.1 3.13 2 7 2s7-.9 7-2V5" />
            <path d="M5 11v4c0 1.1 3.13 2 7 2s7-.9 7-2v-4" />
            <path d="M5 17v2c0 1.1 3.13 2 7 2s7-.9 7-2v-2" />
          </g>
          <circle cx="8" cy="8" r="0.75" fill={accent} />
          <circle cx="8" cy="14" r="0.75" fill={accent} />
          <circle cx="8" cy="20" r="0.75" fill={accent} />
        </svg>
      );
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
  /** Optional inline-SVG icon name. */
  icon?: CourseSectionIcon;
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
  icon,
  stacked = false,
}: Props) {
  const initial = reduced
    ? { opacity: 1, y: 0 }
    : { opacity: 0, y: 8 };
  const animate = { opacity: 1, y: 0 };

  const tier = tierFor(type);

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
        background: tier.background,
        border: `${tier.borderWidth}px solid ${tier.borderColor}`,
        borderRadius: "var(--radius-md)",
        padding: tier.padding,
        // Polaroid-tilt only in scattered mode. Stacked rows stay flat.
        transform: stacked ? undefined : `rotate(${tilt}deg)`,
        // Tier-coded width on desktop. Stacked mode uses full row width.
        maxWidth: stacked ? undefined : `${tier.maxWidth}px`,
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
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "var(--spacing-2xs)",
        }}
      >
        {icon ? (
          <span
            aria-hidden
            style={{
              flex: "0 0 auto",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 2,
            }}
          >
            <StopIcon icon={icon} />
          </span>
        ) : null}
        <h3
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: tier.titleSize,
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
            margin: 0,
            color: "var(--color-text)",
          }}
        >
          {title}
        </h3>
      </div>
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
