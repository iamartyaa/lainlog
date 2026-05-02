"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { TextHighlighter } from "@/components/fancy";
import { SPRING, PRESS } from "@/lib/motion";
import { playSound } from "@/lib/audio";

/**
 * W2 — EvalSetBuilder.
 *
 * Reader is shown 12 borderline Cassidy outputs. They tap each card to
 * cycle through 4 bins (Regression, Hallucination, Out-of-scope, Looks
 * fine). After all 12 are placed, a summary appears: 12 prompts in, you
 * have an eval set.
 *
 * Note on interaction: the outline calls for drag, but for an inline
 * widget on a long-scroll post page, "tap to cycle through bins" is
 * frame-stable, mobile-friendly, and keyboard-accessible without
 * inventing a custom drag pattern. The bins are unordered so the
 * teaching is the same — you decide where these go.
 */

type Bin = "regression" | "hallucination" | "out-of-scope" | "looks-fine";

const BINS: { id: Bin; label: string; sub: string }[] = [
  { id: "regression", label: "regression", sub: "used to work" },
  { id: "hallucination", label: "hallucination", sub: "made it up" },
  { id: "out-of-scope", label: "out of scope", sub: "not Cassidy's job" },
  { id: "looks-fine", label: "looks fine", sub: "ship it" },
];

const ORDER: (Bin | null)[] = [null, "regression", "hallucination", "out-of-scope", "looks-fine"];

type Card = {
  id: number;
  text: string;
  /** The "correct" bin per a careful grader — used only for the summary count. */
  truth: Bin;
};

const CARDS: Card[] = [
  { id: 1, text: "claims the 2-bed has hardwood (input: laminate)", truth: "regression" },
  { id: 2, text: "lists Lincoln Elementary district (input: unknown)", truth: "hallucination" },
  { id: 3, text: "answers 'is this a good investment?'", truth: "out-of-scope" },
  { id: 4, text: "draft is on-voice, on-spec, factual", truth: "looks-fine" },
  { id: 5, text: "rent quoted as $4,200 (input: $1,800)", truth: "regression" },
  { id: 6, text: "invents a 'recently renovated kitchen' line", truth: "hallucination" },
  { id: 7, text: "drafts a response in legal-disclaimer voice", truth: "regression" },
  { id: 8, text: "advises buyer on offer timing", truth: "out-of-scope" },
  { id: 9, text: "says 'four cafés walkable' (input: two)", truth: "hallucination" },
  { id: 10, text: "mirrors agent voice and the listing data", truth: "looks-fine" },
  { id: 11, text: "answers a mortgage-rate question directly", truth: "out-of-scope" },
  { id: 12, text: "drops the customer-name token entirely", truth: "regression" },
];

export function EvalSetBuilder() {
  const prefersReducedMotion = useReducedMotion();
  const [bins, setBins] = useState<Record<number, Bin | null>>(() =>
    Object.fromEntries(CARDS.map((c) => [c.id, null])),
  );

  const placedCount = useMemo(
    () => Object.values(bins).filter(Boolean).length,
    [bins],
  );
  const complete = placedCount === CARDS.length;

  const counts = useMemo(() => {
    const out: Record<Bin, number> = {
      regression: 0,
      hallucination: 0,
      "out-of-scope": 0,
      "looks-fine": 0,
    };
    Object.values(bins).forEach((b) => {
      if (b) out[b] += 1;
    });
    return out;
  }, [bins]);

  const cycle = useCallback((id: number) => {
    setBins((prev) => {
      const current = prev[id];
      const idx = ORDER.indexOf(current);
      const next = ORDER[(idx + 1) % ORDER.length];
      return { ...prev, [id]: next };
    });
    playSound("Radio");
  }, []);

  const reset = () => {
    playSound("Progress-Tick");
    setBins(Object.fromEntries(CARDS.map((c) => [c.id, null])));
  };

  return (
    <WidgetShell
      title="eval-set · builder"
      measurements={`${placedCount}/${CARDS.length} placed`}
      canvas={
        <div className="bs-esb-canvas">
          <style>{`
            .bs-esb-canvas {
              padding: var(--spacing-md);
              min-height: 480px;
              display: flex;
              flex-direction: column;
              gap: var(--spacing-md);
            }
            .bs-esb-bins {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: var(--spacing-2xs);
            }
            @container widget (min-width: 560px) {
              .bs-esb-bins {
                grid-template-columns: repeat(4, 1fr);
              }
            }
            .bs-esb-bin {
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: var(--spacing-sm) var(--spacing-2xs);
              border: 1px dashed var(--color-rule);
              border-radius: var(--radius-md);
              font-family: var(--font-mono);
              font-size: var(--text-small);
              color: var(--color-text-muted);
              background: color-mix(in oklab, var(--color-surface) 60%, transparent);
              text-align: center;
            }
            .bs-esb-bin-label {
              color: var(--color-text);
              font-size: var(--text-ui);
            }
            .bs-esb-bin-count {
              margin-top: 4px;
              font-variant-numeric: tabular-nums;
              color: var(--color-accent);
              font-size: var(--text-h3);
              font-weight: 500;
            }
            .bs-esb-cards {
              display: grid;
              grid-template-columns: 1fr;
              gap: var(--spacing-2xs);
            }
            @container widget (min-width: 560px) {
              .bs-esb-cards {
                grid-template-columns: repeat(2, 1fr);
              }
            }
            .bs-esb-card {
              display: grid;
              grid-template-columns: 1fr auto;
              gap: var(--spacing-sm);
              align-items: center;
              padding: var(--spacing-2xs) var(--spacing-sm);
              border: 1px solid var(--color-rule);
              border-radius: var(--radius-md);
              background: var(--color-surface);
              text-align: left;
              font-family: var(--font-serif);
              font-size: var(--text-small);
              line-height: 1.45;
              color: var(--color-text);
              cursor: pointer;
              transition: border-color 200ms, background 200ms;
            }
            .bs-esb-card:hover {
              border-color: color-mix(in oklab, var(--color-accent) 60%, var(--color-rule));
            }
            .bs-esb-card[data-placed="true"] {
              background: color-mix(in oklab, var(--color-accent) 8%, var(--color-surface));
            }
            .bs-esb-pill {
              display: inline-flex;
              align-items: center;
              padding: 2px 8px;
              border: 1px solid var(--color-rule);
              border-radius: 999px;
              font-family: var(--font-mono);
              font-size: 11px;
              color: var(--color-text-muted);
              white-space: nowrap;
            }
            .bs-esb-card[data-placed="true"] .bs-esb-pill {
              border-color: color-mix(in oklab, var(--color-accent) 50%, var(--color-rule));
              color: var(--color-text);
            }
          `}</style>

          <div className="bs-esb-bins" aria-hidden>
            {BINS.map((b) => (
              <div className="bs-esb-bin" key={b.id}>
                <span className="bs-esb-bin-label">{b.label}</span>
                <span>{b.sub}</span>
                <motion.span
                  className="bs-esb-bin-count"
                  key={`${b.id}-${counts[b.id]}`}
                  initial={{ scale: 0.85, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={
                    prefersReducedMotion ? { duration: 0 } : SPRING.snappy
                  }
                >
                  {counts[b.id]}
                </motion.span>
              </div>
            ))}
          </div>

          <div className="bs-esb-cards">
            {CARDS.map((c) => {
              const placed = bins[c.id];
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => cycle(c.id)}
                  className="bs-esb-card"
                  data-placed={!!placed}
                  aria-label={`Output ${c.id}: ${c.text}. Currently ${placed ?? "unplaced"}.`}
                >
                  <span>{c.text}</span>
                  <span className="bs-esb-pill">
                    {placed ?? "tap to bin"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      }
      state={
        complete ? (
          <span>
            <TextHighlighter
              transition={{ type: "spring", duration: 0.9, bounce: 0 }}
              highlightColor="color-mix(in oklab, var(--color-accent) 28%, transparent)"
              useInViewOptions={{ once: true, amount: 0.55 }}
              className="rounded-[0.2em] px-[1px]"
            >
              Twelve prompts in, you have an eval set.
            </TextHighlighter>{" "}
            Team Evals had twelve by Friday. Team Vibes still has zero.
          </span>
        ) : (
          <span>
            Twelve borderline outputs from Cassidy.{" "}
            <TextHighlighter
              transition={{ type: "spring", duration: 0.9, bounce: 0 }}
              highlightColor="color-mix(in oklab, var(--color-accent) 28%, transparent)"
              useInViewOptions={{ once: true, amount: 0.55 }}
              className="rounded-[0.2em] px-[1px]"
            >
              Tap each one to drop it in a bin.
            </TextHighlighter>{" "}
            The bins are an eval set in disguise.
          </span>
        )
      }
      controls={
        <div className="flex items-center gap-[var(--spacing-sm)]">
          <motion.button
            type="button"
            onClick={reset}
            disabled={placedCount === 0}
            className="bs-vvr-commit"
            {...PRESS}
          >
            ↺ start over
          </motion.button>
        </div>
      }
    />
  );
}
