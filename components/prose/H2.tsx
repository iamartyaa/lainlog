import type { ReactNode } from "react";
import { slugify } from "@/lib/utils/slug";

export function H2({ children, id }: { children: ReactNode; id?: string }) {
  const slug = id ?? slugify(children);

  return (
    <h2
      id={slug}
      className="bs-h2 group relative mt-[2.75em] mb-[0.8em] font-sans font-semibold"
      style={{
        fontSize: "var(--text-h2)",
        letterSpacing: "-0.01em",
        lineHeight: 1.15,
      }}
    >
      {children}
      <a
        href={`#${slug}`}
        aria-label={`Link to section: ${typeof children === "string" ? children : slug}`}
        className="bs-h2-anchor ml-[0.4em] opacity-0 transition-opacity duration-[160ms] ease-[var(--ease-out)] focus-visible:opacity-100 lg:absolute lg:-left-6 lg:top-1/2 lg:ml-0 lg:-translate-x-3 lg:-translate-y-1/2 lg:transition-[transform,opacity] lg:group-hover:translate-x-0 lg:group-hover:opacity-100 lg:focus-visible:translate-x-0"
        style={{ color: "var(--color-accent)" }}
      >
        #
      </a>
    </h2>
  );
}
