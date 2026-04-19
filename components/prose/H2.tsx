import type { ReactNode } from "react";
import { slugify } from "@/lib/utils/slug";

export function H2({ children, id }: { children: ReactNode; id?: string }) {
  const slug = id ?? slugify(children);

  return (
    <h2
      id={slug}
      className="group relative mt-[2.75em] mb-[0.8em] font-sans font-semibold"
      style={{
        fontSize: "var(--text-h2)",
        letterSpacing: "-0.01em",
        lineHeight: 1.15,
      }}
    >
      <a
        href={`#${slug}`}
        aria-label={`Link to section: ${typeof children === "string" ? children : slug}`}
        className="absolute -left-6 top-1/2 -translate-x-3 -translate-y-1/2 opacity-0 transition-[transform,opacity] duration-[160ms] ease-[var(--ease-out)] group-hover:translate-x-0 group-hover:opacity-100 focus-visible:translate-x-0 focus-visible:opacity-100"
        style={{ color: "var(--color-accent)" }}
      >
        #
      </a>
      {children}
    </h2>
  );
}
