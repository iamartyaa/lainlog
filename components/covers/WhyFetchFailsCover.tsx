"use client";

/**
 * WhyFetchFailsCover — placeholder stub.
 *
 * Real concept (pending user approval): arrow advances → blocked at wall → fades, ~8s.
 * Renders static initials until the concept gate clears.
 */
export function WhyFetchFailsCover() {
  return <PlaceholderInitials letters="WF" />;
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
