"use client";

/**
 * HowGmailCover — placeholder stub.
 *
 * Real concept (pending user approval): mock email input + checkmark, pulse ~7s.
 * Until the concept gate clears, this renders a static initials tile so the
 * registry round-trips and the wire phase has a stable target.
 */
export function HowGmailCover() {
  return <PlaceholderInitials letters="HG" />;
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
