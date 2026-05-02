"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/**
 * <Term> — emphasises a term-of-art with optional one-tap tooltip.
 *
 * Two modes:
 *
 *   1. Plain (no `define` prop) — renders as a <dfn> with subtle italic
 *      emphasis, identical to the pre-tooltip API. Backwards-compatible
 *      with every existing call site.
 *
 *   2. Tooltip (with `define` prop) — wraps the term in a button that
 *      surfaces a short definition on hover (desktop) and tap (touch).
 *      Tap-elsewhere or Esc dismisses. Underlined with a dotted terracotta
 *      rule so readers know the term is interrogable.
 *
 * Use sparingly — first appearance only of any given term. The tooltip
 * is a glossary helper, not a typographic flourish; subsequent mentions
 * should be plain text.
 *
 * Accessibility:
 *   - The trigger is a real <button>; `aria-describedby` points at the
 *     popover so screen readers surface the definition.
 *   - Esc dismisses; click-outside dismisses.
 *
 * Reduced motion: the popover skips the fade/lift transition and snaps
 * in/out (visibility still toggles, just without motion).
 *
 * Why no Radix? The repo doesn't ship Radix as a dependency and one
 * tooltip site doesn't justify the bundle. A controlled `useState` +
 * pointer/click handlers covers desktop hover, touch tap, and keyboard.
 */

type TermProps = {
  children: ReactNode;
  /** If provided, renders as an interrogable term with a tooltip popover. */
  define?: string;
};

export function Term({ children, define }: TermProps) {
  if (!define) {
    return <dfn className="italic">{children}</dfn>;
  }
  return <TermWithTooltip define={define}>{children}</TermWithTooltip>;
}

function TermWithTooltip({
  children,
  define,
}: {
  children: ReactNode;
  define: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const popId = `term-pop-${id}`;
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // Close on outside click + Esc.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const node = containerRef.current;
      if (node && !node.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <span ref={containerRef} className="bs-term-wrap">
      <style>{`
        .bs-term-wrap {
          position: relative;
          display: inline-block;
        }
        .bs-term-trigger {
          background: none;
          border: 0;
          padding: 0;
          margin: 0;
          font: inherit;
          color: inherit;
          cursor: help;
          font-style: italic;
          text-decoration: underline dotted color-mix(in oklab, var(--color-accent) 70%, transparent);
          text-decoration-thickness: 1px;
          text-underline-offset: 3px;
          transition: color 180ms;
        }
        .bs-term-trigger:hover,
        .bs-term-trigger[aria-expanded="true"] {
          color: var(--color-accent);
        }
        .bs-term-trigger:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
          border-radius: 2px;
        }
        .bs-term-popover {
          position: absolute;
          left: 50%;
          top: calc(100% + 8px);
          transform: translateX(-50%);
          z-index: 30;
          width: max-content;
          max-width: min(280px, 90vw);
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--color-bg);
          border: 1px solid var(--color-rule);
          border-radius: var(--radius-md);
          box-shadow: 0 6px 20px -8px color-mix(in oklab, var(--color-text) 18%, transparent);
          font-family: var(--font-serif);
          font-style: normal;
          font-size: var(--text-small);
          line-height: 1.5;
          color: var(--color-text);
          text-align: left;
        }
        .bs-term-popover::before {
          content: "";
          position: absolute;
          left: 50%;
          top: -5px;
          transform: translateX(-50%) rotate(45deg);
          width: 8px;
          height: 8px;
          background: var(--color-bg);
          border-left: 1px solid var(--color-rule);
          border-top: 1px solid var(--color-rule);
        }
      `}</style>

      <button
        type="button"
        className="bs-term-trigger"
        aria-expanded={open}
        aria-describedby={open ? popId : undefined}
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {children}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.span
            key="pop"
            id={popId}
            role="tooltip"
            className="bs-term-popover"
            initial={
              prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: 0, y: -4 }
            }
            animate={{ opacity: 1, y: 0 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -4 }
            }
            transition={
              prefersReducedMotion ? { duration: 0 } : { duration: 0.18 }
            }
          >
            {define}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}
