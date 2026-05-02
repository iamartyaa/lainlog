"use client";

import { useId, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { playSound } from "@/lib/audio";
import { Glitter } from "@/components/fancy/Glitter";

/**
 * <Note> — a collapsed-by-default disclosure for "tactical aside" content.
 *
 * Sibling, not replacement, for <Callout>. Callout is always-visible;
 * Note is opt-in reveal. Use for content that's worth surfacing on demand
 * but would weigh down the article if rendered inline.
 *
 * Closed state: a one-line summary cue with a soft terracotta shimmer
 * around the trigger so eyes catch on it. On expand, the body grows
 * downward with a height + opacity transition. On collapse, no audio;
 * on expand, the existing `Pop` cue from the audio playbook fires.
 *
 * Accessibility:
 *   - Trigger is a real <button> with aria-expanded / aria-controls.
 *   - Body has the matching id.
 *   - Keyboard works for free via the button.
 *
 * Reduced-motion:
 *   - The shimmer dots disappear entirely under prefers-reduced-motion.
 *   - The reveal becomes an instant show/hide with no transition.
 *   - Honors the global MotionConfig reducedMotion="user" setting.
 *
 * Frame stability:
 *   - The Note grows downward; the closed-state height is the trigger
 *     row's height. Growing on user click is allowed (the playbook's
 *     "no size jumps mid-interaction" rule scopes to widget canvases).
 *
 * Why not <details>/<summary>?
 *   - Native <details> can't smoothly animate the open/close height
 *     across browsers without resorting to imperative DOM measuring.
 *     Rolling our own with motion + AnimatePresence keeps the behavior
 *     consistent and lets us own the glitter prompt.
 *
 * Banned animations: no <VerticalCutReveal> on the body. The reveal is
 * a clean height + opacity tween via Motion.
 */

type NoteProps = {
  /** The closed-state label (single line). Try to fit in ~6-9 words. */
  summary: string;
  /** Body content shown when expanded. */
  children: ReactNode;
  /** Optional default-open state (rare; exists for SSR-printable variants). */
  defaultOpen?: boolean;
};

export function Note({ summary, children, defaultOpen = false }: NoteProps) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const bodyId = `note-body-${id}`;
  const prefersReducedMotion = useReducedMotion();

  const toggle = () => {
    if (!open) {
      // Pop fires on expand only — collapse is silent (per audio playbook).
      playSound("Pop");
    }
    setOpen((o) => !o);
  };

  return (
    <aside
      className="bs-note"
      style={{
        margin: "var(--spacing-lg) 0",
      }}
    >
      <style>{`
        .bs-note-trigger {
          position: relative;
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          width: 100%;
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--color-surface);
          border: 1px solid var(--color-rule);
          border-radius: var(--radius-md);
          cursor: pointer;
          font-family: var(--font-mono);
          font-size: var(--text-small);
          color: var(--color-text);
          text-align: left;
          transition: border-color 200ms, background 200ms;
        }
        .bs-note-trigger:hover {
          border-color: color-mix(in oklab, var(--color-accent) 55%, var(--color-rule));
        }
        .bs-note-trigger:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }
        .bs-note-trigger[data-open="true"] {
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
          border-bottom-color: transparent;
        }
        .bs-note-eyebrow {
          font-family: var(--text-h4-family, var(--font-sans));
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--color-accent);
          flex-shrink: 0;
        }
        .bs-note-summary {
          flex: 1;
          color: var(--color-text);
          line-height: 1.4;
        }
        .bs-note-chevron {
          display: inline-block;
          flex-shrink: 0;
          width: 14px;
          height: 14px;
          color: var(--color-text-muted);
          transition: transform 220ms ease, color 200ms;
        }
        .bs-note-trigger[data-open="true"] .bs-note-chevron {
          transform: rotate(90deg);
          color: var(--color-accent);
        }
        .bs-note-body {
          overflow: hidden;
          background: color-mix(in oklab, var(--color-surface) 60%, transparent);
          border: 1px solid var(--color-rule);
          border-top: 0;
          border-radius: 0 0 var(--radius-md) var(--radius-md);
        }
        .bs-note-body-inner {
          padding: var(--spacing-md);
          font-family: var(--font-serif);
          font-size: var(--text-body);
          line-height: 1.65;
          color: var(--color-text);
        }
        @media (prefers-reduced-motion: reduce) {
          .bs-note-chevron { transition: none; }
        }
      `}</style>

      <button
        type="button"
        className="bs-note-trigger"
        data-open={open}
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={toggle}
      >
        <span className="bs-note-eyebrow">Note</span>
        <span className="bs-note-summary">{summary}</span>
        <svg
          className="bs-note-chevron"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M5 3 L9 7 L5 11" />
        </svg>

        {/* Glitter prompt — only shown when closed. The shared <Glitter>
            primitive handles reduced-motion internally (returns null), so
            we only gate on `!open` here. */}
        {!open ? <Glitter /> : null}
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="body"
            id={bodyId}
            className="bs-note-body"
            initial={
              prefersReducedMotion
                ? { height: "auto", opacity: 1 }
                : { height: 0, opacity: 0 }
            }
            animate={{ height: "auto", opacity: 1 }}
            exit={
              prefersReducedMotion
                ? { height: "auto", opacity: 0 }
                : { height: 0, opacity: 0 }
            }
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { height: { duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }, opacity: { duration: 0.22 } }
            }
          >
            <div className="bs-note-body-inner">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </aside>
  );
}
