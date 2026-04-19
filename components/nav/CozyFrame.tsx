import type { ReactNode } from "react";

/**
 * CozyFrame — the centred content container. Paints a solid --color-bg
 * rectangle over the body's diagonal-hatch background, producing a
 * nan.fyi-style "content floats on a textured page" effect. No border,
 * no shadow, no fill — the texture contrast IS the frame.
 *
 * Max-width 1360px: wider than a prose column, narrow enough to keep
 * long content from feeling unmoored on 4K monitors.
 */
export function CozyFrame({ children }: { children: ReactNode }) {
  return (
    <div
      className="mx-auto w-full max-w-[1360px]"
      style={{ background: "var(--color-bg)" }}
    >
      <div className="relative flex min-h-screen flex-col">{children}</div>
    </div>
  );
}
