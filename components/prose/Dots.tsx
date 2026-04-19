/**
 * The section ornament. Replaces <hr> between major sections.
 * Distinctive move #1 from DESIGN.md — 20 Plex Mono "·" at 40% opacity, centered.
 */
export function Dots() {
  return (
    <div
      role="separator"
      aria-hidden="true"
      className="select-none text-center font-mono"
      style={{
        margin: "var(--spacing-2xl) 0",
        letterSpacing: "0.5em",
        fontSize: "var(--text-mono)",
        color: "color-mix(in oklab, var(--color-text) 40%, transparent)",
      }}
    >
      · · · · · · · · · · · · · · · · · · · ·
    </div>
  );
}
