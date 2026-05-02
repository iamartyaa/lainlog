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
      {/* Label uses the new --text-h4 register: uppercase, sans, semibold,
          0.06em tracking. Weight + size + tracking all come from the paired
          --text-h4-* vars so the label rule lives in one place. */}
      <span
        className="mr-2 font-sans uppercase"
        style={{
          fontFamily: "var(--text-h4-family)",
          fontSize: "var(--text-h4)",
          fontWeight: "var(--text-h4-weight)",
          lineHeight: "var(--text-h4-lh)",
          letterSpacing: "var(--text-h4-tracking)",
          color: "var(--color-accent)",
        }}
      >
        {LABELS[tone]}
      </span>
      {children}
    </aside>
  );
}
