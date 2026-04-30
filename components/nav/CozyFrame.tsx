import type { ReactNode } from "react";

/**
 * CozyFrame — the centred content container. Paints a solid --color-bg
 * rectangle over the body's diagonal-hatch background, producing a
 * nan.fyi-style "content floats on a textured page" effect.
 *
 * Polish-r2 ITEM-2: drafting-paper frame.
 *   The container now carries a 1-px --color-rule border plus four corner
 *   tick marks (CSS-only, via two ::before / ::after pseudo-elements + the
 *   wrapper's border). The aesthetic rhymes with nan.fyi's drafting-paper
 *   ruler-tick framing without overpowering the content. Layered OUTSIDE
 *   the existing solid-bg rectangle so the hatch-on-bg illusion is
 *   preserved unchanged. Mobile: same border, slightly tighter ticks.
 *
 * Max-width 1360px: wider than a prose column, narrow enough to keep
 * long content from feeling unmoored on 4K monitors.
 */
export function CozyFrame({ children }: { children: ReactNode }) {
  return (
    <div
      className="bs-cozy-frame relative mx-auto w-full max-w-[1360px]"
      style={{ background: "var(--color-bg)" }}
    >
      <div className="relative flex min-h-screen flex-col">{children}</div>
    </div>
  );
}
