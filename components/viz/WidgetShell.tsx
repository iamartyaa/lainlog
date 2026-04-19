"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FullBleed } from "@/components/prose";
import { SPRING } from "@/lib/motion";

type Props = {
  title: string;
  measurements?: string;
  caption?: ReactNode;
  controls?: ReactNode;
  children: ReactNode;
};

/**
 * WidgetShell — the canonical skeleton for every bytesize widget. DESIGN.md §7:
 * <FullBleed><Figure><Header><Canvas><Controls></Figure></FullBleed>.
 *
 * The outer wrapper declares `container-type: inline-size` so nested widgets
 * can drive orientation flips via `@container` queries against the two
 * canonical breakpoints in globals.css (--flip-narrow, --flip-wide).
 *
 * SSR renders a single 6×6 terracotta dot centred in the canvas area. On
 * hydration the dot fades out and the real interactive canvas fades in with
 * SPRING.smooth — consistent brand grammar across all 13 widgets, in place
 * of ad-hoc spinners or skeleton shimmer.
 */
export function WidgetShell({ title, measurements, caption, controls, children }: Props) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  return (
    <FullBleed>
      <div className="bs-widget-container">
        <figcaption className="sr-only">{title}</figcaption>
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
              className="font-mono tabular-nums text-right"
              style={{ fontSize: "var(--text-small)", color: "var(--color-text-muted)" }}
            >
              {measurements}
            </span>
          ) : null}
        </div>

        <div
          className="relative rounded-[var(--radius-md)] px-[var(--spacing-sm)] py-[var(--spacing-md)]"
          style={{
            background: "color-mix(in oklab, var(--color-surface) 40%, transparent)",
          }}
        >
          <AnimatePresence initial={false} mode="wait">
            {hydrated ? (
              <motion.div
                key="canvas"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={SPRING.smooth}
              >
                {children}
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

        {controls ? <div className="pt-[var(--spacing-sm)]">{controls}</div> : null}

        {caption ? (
          <div
            className="pt-[var(--spacing-sm)] font-sans"
            style={{
              fontSize: "var(--text-small)",
              color: "var(--color-text-muted)",
              lineHeight: 1.5,
            }}
          >
            {caption}
          </div>
        ) : null}
      </div>
    </FullBleed>
  );
}
