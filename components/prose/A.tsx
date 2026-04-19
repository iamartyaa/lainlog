import type { AnchorHTMLAttributes, ReactNode } from "react";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> & {
  children: ReactNode;
};

/**
 * A — inline link. On touch the 40%-mixed underline is the resting state and
 * there's no hover saturation: `:hover` on touch fires after tap-release and
 * sticks, producing a stale "hovered" look until the next tap elsewhere. The
 * saturation is gated behind `@media (hover: hover)` in globals.css so only
 * true-hover devices opt in.
 */
export function A({ children, href, ...rest }: Props) {
  const isExternal = typeof href === "string" && /^https?:\/\//.test(href);
  return (
    <a
      href={href}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="bs-prose-link underline decoration-from-font underline-offset-[0.2em] transition-[text-decoration-color] duration-[160ms] ease-[var(--ease-out)]"
      style={{
        color: "var(--color-accent)",
        textDecorationColor: "color-mix(in oklab, var(--color-accent) 40%, transparent)",
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
