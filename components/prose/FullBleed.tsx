import type { ReactNode } from "react";

export function FullBleed({ children }: { children: ReactNode }) {
  return (
    <figure
      className="relative left-1/2 -translate-x-1/2 my-[var(--spacing-xl)]"
      style={{ width: "min(calc(100vw - var(--spacing-lg) * 2), 900px)" }}
    >
      {children}
    </figure>
  );
}
