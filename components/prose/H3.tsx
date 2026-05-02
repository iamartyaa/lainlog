import type { ReactNode } from "react";

export function H3({ children }: { children: ReactNode }) {
  return (
    <h3 className="bs-h3 mt-[2em] mb-[0.6em] font-sans">
      {children}
    </h3>
  );
}
