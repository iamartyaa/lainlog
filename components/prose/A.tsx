import type { AnchorHTMLAttributes, ReactNode } from "react";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> & {
  children: ReactNode;
};

export function A({ children, href, ...rest }: Props) {
  const isExternal = typeof href === "string" && /^https?:\/\//.test(href);
  return (
    <a
      href={href}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="underline decoration-from-font underline-offset-[0.2em] transition-[text-decoration-color] duration-[160ms] ease-[var(--ease-out)]"
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
