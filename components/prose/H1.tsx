import type { CSSProperties, ReactNode } from "react";

export function H1({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <h1
      className="mt-0 font-sans font-semibold"
      style={{
        fontSize: "var(--text-h1)",
        letterSpacing: "-0.02em",
        lineHeight: 1.05,
        ...style,
      }}
    >
      {children}
    </h1>
  );
}
