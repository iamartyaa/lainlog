import type { ReactNode } from "react";

export function Aside({ children }: { children: ReactNode }) {
  return (
    <aside
      className="my-[1.75em] font-sans"
      style={{
        fontSize: "var(--text-small)",
        color: "var(--color-text-muted)",
        lineHeight: 1.5,
      }}
    >
      {children}
    </aside>
  );
}
