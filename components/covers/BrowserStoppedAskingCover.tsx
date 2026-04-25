"use client";

/**
 * BrowserStoppedAskingCover — placeholder stub.
 *
 * Real concept (pending user approval): long horizontal line + breathing dots, ~6s.
 * Renders static initials until the concept gate clears.
 */
export function BrowserStoppedAskingCover() {
  return <PlaceholderInitials letters="BS" />;
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
