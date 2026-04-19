import type { ReactNode } from "react";

export function Prose({ children }: { children: ReactNode }) {
  return (
    <article
      className="mx-auto w-full max-w-[65ch] px-5 font-serif leading-[1.7]"
      style={{ fontSize: "var(--text-body)" }}
    >
      {children}
    </article>
  );
}
