"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FullBleed } from "@/components/prose";
import { SPRING } from "@/lib/motion";

type Props = {
  /** Widget title (left of the metadata row, sans, muted). */
  title: string;
  /** Optional measurements (right of metadata row, mono tabular-nums). */
  measurements?: string;

  /* --- Strict slot API (Phase 1+) --- */

  /**
   * The interactive surface (SVG / HTML viz). Renders inside an opaque
   * `--color-surface` canvas with a 1 px `--color-rule` border.
   *
   * Min-height contract: the shell does NOT impose a min-height on the
   * post-hydration canvas — per-widget tuning is the widget's job (Phase 2
   * sets each widget's tallest reachable state). The pre-hydration SSR-dot
   * fallback retains its `min-h-[120px]` floor so the pre-hydration size
   * is stable across all widgets.
   */
  canvas?: ReactNode;
  /**
   * The teacher-voice line that names what just happened. Renders in the
   * body-strong register (Plex Serif 500 / lh 1.7) with a 10 × 10 rotated
   * terracotta square as the leading marker.
   *
   * Min-height contract: shell sets `min-height: 5.25em` so the state line
   * never causes a layout jump when copy changes.
   */
  state?: ReactNode;
  /**
   * Step / mode controls (typically `<WidgetNav />`, sometimes custom).
   *
   * Min-height contract: shell sets `min-height: var(--widget-controls-min,
   * 44px)` so single-button vs full WidgetNav rows don't change frame
   * height between widgets.
   */
  controls?: ReactNode;

  /* --- Compat shim (Phase 1 → Phase 2) ---
   * The 23+ existing widget callsites pass `children` (canvas) and
   * `caption` (state) under the old API. Both forms continue to render
   * correctly: if `canvas` is omitted we render `children`; if `state` is
   * omitted we render `caption`. `captionTone` is preserved for completeness
   * but the new contract treats every state line as `prominent` — the
   * `muted` tone is no longer applied to new shells. Removed at the end of
   * Phase 2 once every widget has migrated.
   */
  /** @deprecated Use `canvas`. */
  children?: ReactNode;
  /** @deprecated Use `state`. */
  caption?: ReactNode;
  /** @deprecated The new contract is always prominent. */
  captionTone?: "muted" | "prominent";
};

/**
 * WidgetShell — the canonical skeleton for every lainlog widget. DESIGN.md
 * §7 + `docs/interactive-components.md` §0 layout contract:
 *
 *     Title metadata row  →  Canvas  →  State caption  →  Controls
 *
 * The outer wrapper declares `container-type: inline-size` so nested widgets
 * can drive orientation flips via `@container` queries against the two
 * canonical breakpoints in globals.css (--flip-narrow, --flip-wide).
 *
 * SSR renders a single 6×6 terracotta dot centred in the canvas area inside
 * a `min-h-[120px]` floor. On hydration the dot fades out and the real
 * interactive canvas fades in with SPRING.smooth — consistent brand grammar
 * across all 13+ widgets, in place of ad-hoc spinners or skeleton shimmer.
 *
 * Visual weight (Phase 1 lift):
 * - Canvas surface is opaque `--color-surface` with a 1 px `--color-rule`
 *   border (was 40% alpha-mixed surface, no border).
 * - State caption renders in the body-strong register with a leading 10×10
 *   rotated terracotta square. DESIGN.md §12 compliant — the marker is a
 *   small standalone glyph, not a left stripe.
 * - Controls slot owns its own min-height so single-button widgets line up
 *   with full WidgetNav rows.
 */
export function WidgetShell({
  title,
  measurements,
  canvas,
  state,
  controls,
  children,
  caption,
  // captionTone is intentionally unused — the new contract is always
  // prominent. Kept in the prop signature for API compat.
}: Props) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  // Compat resolution: prefer the strict slots, fall back to the legacy props.
  const canvasNode = canvas ?? children;
  const stateNode = state ?? caption;

  return (
    <FullBleed>
      <div className="bs-widget-container bs-widget-shell">
        <figcaption className="sr-only">{title}</figcaption>

        {/* 1. Title metadata row. */}
        <div
          className="flex items-baseline justify-between gap-[var(--spacing-sm)] pb-[var(--spacing-sm)]"
          style={{ fontSize: "var(--text-ui)" }}
        >
          <span
            className="font-sans"
            style={{ color: "var(--color-text-muted)", letterSpacing: "-0.005em" }}
          >
            {title}
          </span>
          {measurements ? (
            <span
              className="font-mono tabular-nums text-right shrink-0"
              style={{
                fontSize: "var(--text-small)",
                color: "var(--color-text-muted)",
                minWidth: "8ch",
              }}
            >
              {measurements}
            </span>
          ) : null}
        </div>

        {/* 2. Canvas — opaque surface, 1 px rule border. */}
        <div className="bs-widget-canvas">
          <AnimatePresence initial={false} mode="wait">
            {hydrated ? (
              <motion.div
                key="canvas"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={SPRING.smooth}
              >
                {canvasNode}
              </motion.div>
            ) : (
              <motion.div
                key="dot"
                className="flex min-h-[120px] items-center justify-center"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={SPRING.smooth}
                aria-hidden
              >
                <span
                  className="block h-[6px] w-[6px]"
                  style={{ background: "var(--color-accent)" }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3. State caption — body-strong register + rotated terracotta
            square marker. Always-on in the new contract. */}
        {stateNode ? (
          <div className="bs-widget-state">
            <span aria-hidden className="bs-widget-state-marker" />
            <div>{stateNode}</div>
          </div>
        ) : null}

        {/* 4. Controls — bottom of the widget, always. */}
        {controls ? (
          <div className="bs-widget-controls">{controls}</div>
        ) : null}
      </div>
    </FullBleed>
  );
}
