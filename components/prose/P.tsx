import type { ReactNode } from "react";

export function P({ children }: { children: ReactNode }) {
  return (
    <p className="[margin-block-start:1.25em] first:mt-0">{children}</p>
  );
}
