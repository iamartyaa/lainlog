import type { ReactNode } from "react";

export function Code({ children }: { children: ReactNode }) {
  return (
    <code
      className="font-mono"
      style={{
        fontSize: "0.92em",
        background: "var(--color-surface)",
        padding: "2px 6px",
        borderRadius: "var(--radius-sm)",
      }}
    >
      {children}
    </code>
  );
}
