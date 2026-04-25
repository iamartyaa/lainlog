"use client";

/**
 * WebpageReadsAgentCover — placeholder stub.
 *
 * Real concept (pending user approval): magnifier sweeps over text revealing a
 * hidden glyph, ~9s. Renders static initials until the concept gate clears.
 */
export function WebpageReadsAgentCover() {
  return <PlaceholderInitials letters="WA" />;
}

function PlaceholderInitials({ letters }: { letters: string }) {
  return (
    <g>
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="var(--font-sans), system-ui, sans-serif"
        fontWeight={600}
        fontSize="34"
        fill="var(--color-accent)"
        style={{ letterSpacing: "-0.04em" }}
      >
        {letters}
      </text>
    </g>
  );
}
