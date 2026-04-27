"use client";

/**
 * <CourseStop> — content for an "active" cell on the snake-and-ladders
 * course board. Rendered INSIDE a cell via <foreignObject> on desktop
 * and inside a stacked block on mobile.
 *
 * The cell IS the card — there's no separate card chrome here. This
 * component supplies:
 *   - a type-badge (LESSON / INTERACTIVE / QUIZ / PROJECT / CHALLENGE)
 *   - an inline-SVG icon
 *   - the title
 *   - a one-line description
 *
 * Visual variation is driven by `type` only. The cell's background is
 * owned by the parent (course-surface palette tinted by module).
 *
 * Reduced-motion is honoured by the parent — this component does not
 * own its own motion gating.
 */

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
 * Type-badge styling. Every variant uses --color-text for ink and
 * --color-bg for fill — the brutalist register reads as monochrome
 * stamps. The `quiz` and `project` types invert (black fill, white
 * text) for emphasis.
 */
function badgeStyle(type: CourseSectionType): React.CSSProperties {
  const base: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: "0.625rem",
    letterSpacing: "0.1em",
    padding: "1px 5px",
    display: "inline-block",
    lineHeight: 1.4,
    border: "1.5px solid var(--color-text)",
    fontWeight: 600,
  };
  switch (type) {
    case "quiz":
    case "project":
      return {
        ...base,
        background: "var(--color-text)",
        color: "var(--color-bg)",
      };
    case "challenge":
      return {
        ...base,
        background: "var(--color-accent)",
        color: "var(--color-bg)",
      };
    case "interactive":
    case "lesson":
    default:
      return {
        ...base,
        background: "var(--color-bg)",
        color: "var(--color-text)",
      };
  }
}

function StopIcon({ icon }: { icon: CourseSectionIcon }) {
  const ink = "var(--color-text)";
  const accent = "var(--color-accent)";
  switch (icon) {
    case "tokenization":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden focusable={false}>
          <line x1="3" y1="6" x2="3" y2="18" stroke={ink} strokeWidth={1.5} />
          <rect
            x="6"
            y="9"
            width="15"
            height="6"
            rx="1"
            stroke={ink}
            strokeWidth={1.5}
            fill={accent}
            fillOpacity={0.4}
          />
          <line x1="11" y1="9" x2="11" y2="15" stroke={ink} strokeWidth={1.5} />
          <line x1="16" y1="9" x2="16" y2="15" stroke={ink} strokeWidth={1.5} />
        </svg>
      );
    case "embedding-table":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden focusable={false}>
          <g stroke={ink} strokeWidth={1.5} fill="none">
            <rect x="3" y="4" width="18" height="4" />
            <rect x="3" y="10" width="18" height="4" />
            <rect x="3" y="16" width="18" height="4" />
          </g>
          <g fill={accent}>
            <rect x="3.5" y="4.5" width="5" height="3" />
            <rect x="9.5" y="10.5" width="5" height="3" />
            <rect x="15.5" y="16.5" width="5" height="3" />
          </g>
        </svg>
      );
    case "matrix":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden focusable={false}>
          {[6, 12, 18].map((y) =>
            [6, 12, 18].map((x) => (
              <rect
                key={`${x}-${y}`}
                x={x - 2}
                y={y - 2}
                width={4}
                height={4}
                fill={x + y === 24 ? accent : ink}
              />
            ))
          )}
        </svg>
      );
    case "attention":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden focusable={false}>
          <g stroke={ink} strokeWidth={1.5} strokeLinecap="round">
            <line x1="6" y1="18" x2="18" y2="18" />
            <line x1="6" y1="18" x2="12" y2="6" />
            <line x1="18" y1="18" x2="12" y2="6" />
          </g>
          <circle cx="12" cy="6" r="2.6" fill={accent} stroke={ink} strokeWidth={1.5} />
          <circle cx="6" cy="18" r="2.6" fill={ink} />
          <circle cx="18" cy="18" r="2.6" fill={ink} />
        </svg>
      );
    case "transformer":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden focusable={false}>
          <g stroke={ink} strokeWidth={1.5} fill="none">
            <rect x="4" y="16" width="16" height="4" />
            <rect x="4" y="10" width="16" height="4" fill={accent} fillOpacity={0.5} />
            <rect x="4" y="4" width="16" height="4" />
          </g>
          <g stroke={ink} strokeWidth={1.5} strokeLinecap="round">
            <line x1="12" y1="16" x2="12" y2="14" />
            <line x1="12" y1="10" x2="12" y2="8" />
          </g>
        </svg>
      );
    case "histogram":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden focusable={false}>
          <line x1="3" y1="20" x2="21" y2="20" stroke={ink} strokeWidth={1.5} />
          <g fill={ink}>
            <rect x="5" y="6" width="4" height="13" />
            <rect x="11" y="11" width="4" height="8" />
            <rect x="17" y="15" width="4" height="4" />
          </g>
          <rect x="5" y="6" width="4" height="3" fill={accent} />
        </svg>
      );
    case "server":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden focusable={false}>
          <g stroke={ink} strokeWidth={1.5} fill="none">
            <rect x="4" y="3" width="16" height="5" />
            <rect x="4" y="9.5" width="16" height="5" fill={accent} fillOpacity={0.4} />
            <rect x="4" y="16" width="16" height="5" />
          </g>
          <g fill={ink}>
            <circle cx="7" cy="5.5" r="1" />
            <circle cx="7" cy="12" r="1" />
            <circle cx="7" cy="18.5" r="1" />
          </g>
        </svg>
      );
  }
}

type Props = {
  title: string;
  type: CourseSectionType;
  description?: string;
  icon?: CourseSectionIcon;
  /** 1, 2, or 3 — drives the type badge accent if needed. */
  moduleIndex?: number;
  /** Stacked = mobile mode (no foreign-object framing constraints). */
  stacked?: boolean;
};

export function CourseStop({
  title,
  type,
  description,
  icon,
  stacked = false,
}: Props) {
  return (
    <div
      className="bs-stop-content"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        height: stacked ? "auto" : "100%",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 2,
        }}
      >
        <span style={badgeStyle(type)}>{BADGE_LABEL[type]}</span>
        {icon ? (
          <span style={{ marginLeft: "auto", display: "inline-flex" }}>
            <StopIcon icon={icon} />
          </span>
        ) : null}
      </div>
      <h3
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: stacked ? "var(--text-h3)" : "0.95rem",
          fontWeight: 700,
          lineHeight: 1.15,
          margin: 0,
          color: "var(--color-text)",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h3>
      {description ? (
        <p
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: stacked ? "0.875rem" : "0.75rem",
            lineHeight: 1.35,
            color: "var(--color-text)",
            margin: 0,
            opacity: 0.85,
            display: "-webkit-box",
            WebkitLineClamp: stacked ? 4 : 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
