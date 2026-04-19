import type { ReactNode } from "react";
import { CozyFrameAccent } from "./CozyFrameAccent";

/**
 * CozyFrame — the centred bordered container that wraps the whole site.
 * A window frame, not a card: 1px rule-colour border, no fill, no shadow,
 * generous interior padding. Max-width 1040px so the frame has margins on
 * large viewports; collapses to edge-to-edge minus gutter on mobile.
 *
 * Placed between <body> and the header/main/footer stack so everything
 * visually sits inside one coherent shape. The top-right terracotta corner
 * swatch pulses once on first paint (purely decorative).
 */
export function CozyFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1040px] px-[var(--spacing-md)] md:px-[var(--spacing-xl)] py-[var(--spacing-lg)] md:py-[var(--spacing-xl)]">
      <div
        className="relative flex min-h-[calc(100vh-var(--spacing-2xl))] flex-col rounded-[var(--radius-md)]"
        style={{
          border: "1px solid var(--color-rule)",
        }}
      >
        <CozyFrameAccent />
        {children}
      </div>
    </div>
  );
}
