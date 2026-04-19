import type { ReactNode } from "react";

type Tone = "note" | "warn";

const LABELS: Record<Tone, string> = {
  note: "Note —",
  warn: "Watch out —",
};

export function Callout({
  tone = "note",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <aside
      role="note"
      className="my-[2em] font-serif"
      style={{
        background: "var(--color-surface)",
        padding: "var(--spacing-md)",
        borderRadius: "var(--radius-md)",
        fontSize: "var(--text-body)",
        lineHeight: 1.6,
      }}
    >
      <span
        className="mr-2 font-sans font-semibold uppercase tracking-wider"
        style={{
          fontSize: "0.7rem",
          letterSpacing: "0.08em",
          color: "var(--color-accent)",
        }}
      >
        {LABELS[tone]}
      </span>
      {children}
    </aside>
  );
}
