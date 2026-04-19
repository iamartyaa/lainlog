import type { ReactNode } from "react";

export function Term({ children }: { children: ReactNode }) {
  return <dfn className="italic">{children}</dfn>;
}
