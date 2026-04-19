import type { ReactNode } from "react";

export function Em({ children }: { children: ReactNode }) {
  return <em className="italic">{children}</em>;
}
