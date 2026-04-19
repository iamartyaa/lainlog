import type { ReactNode } from "react";

export function H3({ children }: { children: ReactNode }) {
  return (
    <h3
      className="mt-[2em] mb-[0.6em] font-sans font-semibold"
      style={{ fontSize: "var(--text-h3)", lineHeight: 1.25 }}
    >
      {children}
    </h3>
  );
}
