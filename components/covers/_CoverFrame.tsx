"use client";

import { createContext, useContext, useRef, type ReactNode } from "react";
import { motion, useInView } from "motion/react";

/**
 * CoverContext — passes the in-view boolean from the frame to whichever
 * per-post cover component is rendered inside. Per-post covers read this
 * to gate their ambient animation: when off-screen we render the static
 * end-state and never schedule a rAF.
 *
 * Default `inView: true` keeps the static fallback meaningful (the cover
 * still renders correctly outside a frame, e.g. in a Storybook stub).
 */
type CoverContextValue = {
  inView: boolean;
};

const CoverContext = createContext<CoverContextValue>({ inView: true });

export function useCoverInView(): boolean {
  return useContext(CoverContext).inView;
}

type Size = "thumb" | "hero";

type Props = {
  /** Slug — used to derive the `view-transition-name` so home → post pairs morph. */
  slug: string;
  /** "thumb" = 64×64 (mobile) / 80×80 (lg+); "hero" = same dims, kept for future scaling. */
  size: Size;
  /**
   * Optional accessible label. When provided, the wrapper drops `aria-hidden`
   * and the label describes the cover. When omitted, the cover is decorative.
   */
  ariaLabel?: string;
  /** The per-post SVG content. Receives `inView` via context. */
  children: ReactNode;
};

/**
 * _CoverFrame — the shared chrome around every animated cover.
 *
 * - Owns sizing (64×64 base, 80×80 from lg) so per-post covers don't repeat it.
 * - Owns the `view-transition-name: cover-<slug>` pairing so home → post morphs work.
 * - Owns the inView gate via motion/react `useInView`; off-screen → static end-state.
 * - Provides a `<motion.svg viewBox="0 0 100 100">` child; per-post covers fill it.
 *
 * Frame-stability hard rule R6: the wrapper dimensions never animate. Per-post
 * covers must animate transform/opacity/pathLength only.
 */
export function CoverFrame({ slug, size, ariaLabel, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  // amount: 0.4 — start animating once 40% visible; once: false — re-pause when scrolled off.
  const inView = useInView(ref, { amount: 0.4 });

  // Both sizes currently share dimensions (64/80 responsive). Kept as a switch
  // so a future "hero" size can scale up without changing the contract.
  const sizeClass =
    size === "thumb" || size === "hero"
      ? "h-[64px] w-[64px] lg:h-[80px] lg:w-[80px]"
      : "";

  return (
    <div
      ref={ref}
      className={`relative aspect-square overflow-hidden rounded-[var(--radius-sm)] ${sizeClass}`}
      style={{
        background:
          "color-mix(in oklab, var(--color-surface) 60%, transparent)",
        border: "1px solid var(--color-rule)",
        viewTransitionName: `cover-${slug}`,
      }}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      role={ariaLabel ? "img" : undefined}
    >
      <CoverContext.Provider value={{ inView }}>
        <motion.svg
          viewBox="0 0 100 100"
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
          focusable={false}
        >
          {children}
        </motion.svg>
      </CoverContext.Provider>
    </div>
  );
}
