import type { CSSProperties, ReactNode } from "react";

export function H1({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  // Token-driven type ramp. Size + weight + lh + tracking come from the
  // paired --text-h1-* vars via the `.bs-h1` utility class in globals.css.
  // `font-sans` stays for SSR-safe family fallback; `mt-0` zeroes the
  // browser's default top margin so the post hero sits flush.
  return (
    <h1 className="bs-h1 mt-0 font-sans" style={style}>
      {children}
    </h1>
  );
}
