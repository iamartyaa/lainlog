import type { ReactNode } from "react";

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd
      className="font-mono"
      style={{
        fontSize: "0.88em",
        border: "1px solid var(--color-rule)",
        padding: "1px 5px",
        borderRadius: "var(--radius-sm)",
        color: "var(--color-text-muted)",
      }}
    >
      {children}
    </kbd>
  );
}
