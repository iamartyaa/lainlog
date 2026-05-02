"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, useReducedMotion } from "motion/react";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { TextHighlighter } from "@/components/fancy";
import { SPRING, PRESS } from "@/lib/motion";
import { playSound } from "@/lib/audio";

/**
 * W5 — N10Trap.
 *
 * Reader picks 10 of 30 prompts that "look like the kind a real customer
 * would send." After committing, the widget reveals 1,000 real production
 * prompts as a dot field. The picked 10 get a terracotta ring. The actual
 * failure-mode prompts (which the reader almost certainly didn't pick)
 * are highlighted in a contrasting tone.
 *
 * The picked sample is biased toward "easy-looking" prompts. The failure
 * modes cluster in the long tail — a region the reader's intuition didn't
 * sample. Caption announces how many failure-mode prompts the reader
 * missed.
 */

// 30 candidate prompts. We tag each with its "shape" — the reader's
// intuition will gravitate toward the conventional ones. Failure modes
// cluster in the unconventional ones.
type CandidateShape = "conventional" | "edge" | "out-of-scope";

type Candidate = {
  id: number;
  text: string;
  shape: CandidateShape;
};

const CANDIDATES: Candidate[] = [
  // 18 conventional-looking — the bait
  { id: 1, text: "draft a listing for a 2-bed in Logan Square", shape: "conventional" },
  { id: 2, text: "summarise comps for 1843 Damen", shape: "conventional" },
  { id: 3, text: "rewrite this draft to be warmer", shape: "conventional" },
  { id: 4, text: "what's the median price in Wicker Park?", shape: "conventional" },
  { id: 5, text: "respond to a buyer asking about parking", shape: "conventional" },
  { id: 6, text: "draft an open-house invite", shape: "conventional" },
  { id: 7, text: "shorten this listing under 80 words", shape: "conventional" },
  { id: 8, text: "what schools are nearby?", shape: "conventional" },
  { id: 9, text: "draft a follow-up to a tour visitor", shape: "conventional" },
  { id: 10, text: "describe this loft in two sentences", shape: "conventional" },
  { id: 11, text: "translate this listing to Spanish", shape: "conventional" },
  { id: 12, text: "list pros of this corner unit", shape: "conventional" },
  { id: 13, text: "summarise the inspection report", shape: "conventional" },
  { id: 14, text: "draft a price-drop email", shape: "conventional" },
  { id: 15, text: "rewrite for a Gen-Z audience", shape: "conventional" },
  { id: 16, text: "explain the HOA fees clearly", shape: "conventional" },
  { id: 17, text: "compare two listings side by side", shape: "conventional" },
  { id: 18, text: "draft a reply to a low-ball offer", shape: "conventional" },
  // 8 edge — failure modes
  { id: 19, text: "is the school district good?", shape: "edge" },
  { id: 20, text: "respond to 'is this a good investment?'", shape: "edge" },
  { id: 21, text: "draft a listing with no input data", shape: "edge" },
  { id: 22, text: "user types in all caps and emoji 🏡🔥", shape: "edge" },
  { id: 23, text: "user asks 'is this priced too high?'", shape: "edge" },
  { id: 24, text: "user pastes a 4,000-word inspection PDF", shape: "edge" },
  { id: 25, text: "user uses 'they/them' and last name only", shape: "edge" },
  { id: 26, text: "input lat/lon is wrong by half a mile", shape: "edge" },
  // 4 out-of-scope — also failure modes
  { id: 27, text: "should I refinance my mortgage?", shape: "out-of-scope" },
  { id: 28, text: "is now a good time to buy?", shape: "out-of-scope" },
  { id: 29, text: "what's my home worth?", shape: "out-of-scope" },
  { id: 30, text: "draft a legal disclaimer for the listing", shape: "out-of-scope" },
];

const PICK_LIMIT = 10;

export function N10Trap() {
  const prefersReducedMotion = useReducedMotion();
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [revealed, setRevealed] = useState(false);

  const togglePick = useCallback((id: number) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < PICK_LIMIT) {
        next.add(id);
      } else {
        return prev;
      }
      return next;
    });
    playSound("Radio");
  }, []);

  const reveal = () => {
    if (picked.size !== PICK_LIMIT) return;
    playSound("Click");
    setRevealed(true);
  };

  const reset = () => {
    playSound("Progress-Tick");
    setPicked(new Set());
    setRevealed(false);
  };

  // Failure-mode count missed: how many "edge" + "out-of-scope" the reader
  // did NOT pick. (Almost always close to 12 — the count of all
  // non-conventional candidates.)
  const failureModesTotal = CANDIDATES.filter(
    (c) => c.shape !== "conventional",
  ).length;
  const failureModesMissed = useMemo(() => {
    return CANDIDATES.filter(
      (c) => c.shape !== "conventional" && !picked.has(c.id),
    ).length;
  }, [picked]);

  // Production "1000" dot field — we draw 1000 dots, and tag a handful as
  // failure-mode shapes. We deterministically place them with a hash of i.
  const dots = useMemo(() => {
    const out: { x: number; y: number; failure: boolean; key: number }[] = [];
    const N = 280; // visual density — 280 looks like "lots", performant
    const cols = 28;
    const rows = 10;
    for (let i = 0; i < N; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      // Pseudo-random failure tag — every ~14th dot is a failure mode
      const failure = (i * 13 + 7) % 14 === 0;
      out.push({
        x: 8 + c * 12,
        y: 8 + r * 14,
        failure,
        key: i,
      });
    }
    return { dots: out, total: N, rows, cols };
  }, []);

  return (
    <WidgetShell
      title="n=10 · trap"
      measurements={
        revealed
          ? `${failureModesMissed}/${failureModesTotal} failure modes missed`
          : `${picked.size}/${PICK_LIMIT} picked`
      }
      canvas={
        <div className="bs-n10-canvas">
          <style>{`
            .bs-n10-canvas {
              padding: var(--spacing-md);
              min-height: 460px;
              display: flex;
              flex-direction: column;
              gap: var(--spacing-md);
            }
            .bs-n10-grid {
              display: grid;
              grid-template-columns: 1fr;
              gap: var(--spacing-2xs);
            }
            @container widget (min-width: 560px) {
              .bs-n10-grid {
                grid-template-columns: 1fr 1fr;
              }
            }
            .bs-n10-pick {
              display: flex;
              align-items: center;
              gap: var(--spacing-sm);
              padding: var(--spacing-2xs) var(--spacing-sm);
              border: 1px solid var(--color-rule);
              border-radius: var(--radius-md);
              background: var(--color-surface);
              text-align: left;
              font-family: var(--font-serif);
              font-size: var(--text-small);
              line-height: 1.4;
              color: var(--color-text);
              cursor: pointer;
              transition: border-color 200ms, background 200ms, opacity 200ms;
            }
            .bs-n10-pick:hover:not(:disabled) {
              border-color: color-mix(in oklab, var(--color-accent) 60%, var(--color-rule));
            }
            .bs-n10-pick[data-picked="true"] {
              background: color-mix(in oklab, var(--color-accent) 14%, var(--color-surface));
              border-color: var(--color-accent);
            }
            .bs-n10-pick:disabled {
              opacity: 0.45;
              cursor: not-allowed;
            }
            .bs-n10-check {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 16px;
              height: 16px;
              border-radius: 4px;
              border: 1px solid var(--color-rule);
              flex-shrink: 0;
              font-family: var(--font-mono);
              font-size: 10px;
              color: transparent;
            }
            .bs-n10-pick[data-picked="true"] .bs-n10-check {
              background: var(--color-accent);
              border-color: var(--color-accent);
              color: var(--color-bg);
            }
            .bs-n10-revealed {
              display: flex;
              flex-direction: column;
              gap: var(--spacing-sm);
              align-items: center;
            }
            .bs-n10-svg {
              width: 100%;
              max-width: 360px;
              height: auto;
              display: block;
            }
            .bs-n10-legend {
              display: flex;
              gap: var(--spacing-md);
              font-family: var(--font-mono);
              font-size: 11px;
              color: var(--color-text-muted);
              flex-wrap: wrap;
              justify-content: center;
            }
            .bs-n10-legend-item {
              display: inline-flex;
              align-items: center;
              gap: 6px;
            }
            .bs-n10-legend-dot {
              width: 8px;
              height: 8px;
              border-radius: 50%;
            }
          `}</style>

          {!revealed ? (
            <>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-small)",
                  color: "var(--color-text-muted)",
                }}
              >
                pick {PICK_LIMIT} prompts you&apos;d test Cassidy on
              </div>
              <div className="bs-n10-grid">
                {CANDIDATES.map((c) => {
                  const isPicked = picked.has(c.id);
                  const disabled =
                    !isPicked && picked.size >= PICK_LIMIT;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className="bs-n10-pick"
                      data-picked={isPicked}
                      disabled={disabled}
                      onClick={() => togglePick(c.id)}
                      aria-pressed={isPicked}
                    >
                      <span className="bs-n10-check" aria-hidden>
                        ✓
                      </span>
                      <span>{c.text}</span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="bs-n10-revealed">
              <svg
                className="bs-n10-svg"
                viewBox={`0 0 ${dots.cols * 12 + 8} ${dots.rows * 14 + 8}`}
                role="img"
                aria-label={`Of ${dots.total} production prompts shown, the failure-mode dots are highlighted in terracotta.`}
              >
                {dots.dots.map((d, i) => (
                  <motion.circle
                    key={d.key}
                    cx={d.x}
                    cy={d.y}
                    r={d.failure ? 3 : 2.5}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : { ...SPRING.smooth, delay: Math.min(i * 0.002, 0.6) }
                    }
                    style={{
                      fill: d.failure
                        ? "var(--color-accent)"
                        : "var(--color-rule)",
                    }}
                  />
                ))}
              </svg>
              <div className="bs-n10-legend">
                <span className="bs-n10-legend-item">
                  <span
                    className="bs-n10-legend-dot"
                    style={{ background: "var(--color-rule)" }}
                  />
                  ordinary prompts
                </span>
                <span className="bs-n10-legend-item">
                  <span
                    className="bs-n10-legend-dot"
                    style={{ background: "var(--color-accent)" }}
                  />
                  failure-mode prompts
                </span>
              </div>
            </div>
          )}
        </div>
      }
      state={
        revealed ? (
          <span>
            You picked ten prompts that looked like the ones customers send.{" "}
            <TextHighlighter
              transition={{ type: "spring", duration: 0.9, bounce: 0 }}
              highlightColor="color-mix(in oklab, var(--color-accent) 28%, transparent)"
              useInViewOptions={{ once: true, amount: 0.55 }}
              className="rounded-[0.2em] px-[1px]"
            >
              The terracotta dots are the ones that broke.
            </TextHighlighter>{" "}
            Eval sets sampled by intuition miss the prompts intuition
            doesn&apos;t have words for.
          </span>
        ) : (
          <span>
            Thirty candidate prompts.{" "}
            <TextHighlighter
              transition={{ type: "spring", duration: 0.9, bounce: 0 }}
              highlightColor="color-mix(in oklab, var(--color-accent) 28%, transparent)"
              useInViewOptions={{ once: true, amount: 0.55 }}
              className="rounded-[0.2em] px-[1px]"
            >
              Pick the ten you&apos;d test on.
            </TextHighlighter>{" "}
            Then we&apos;ll show you what the customers actually sent.
          </span>
        )
      }
      controls={
        <div className="flex items-center gap-[var(--spacing-sm)]">
          {!revealed ? (
            <motion.button
              type="button"
              onClick={reveal}
              disabled={picked.size !== PICK_LIMIT}
              className="bs-vvr-commit"
              {...PRESS}
            >
              {picked.size === PICK_LIMIT
                ? "reveal production →"
                : `${PICK_LIMIT - picked.size} left to pick`}
            </motion.button>
          ) : (
            <motion.button
              type="button"
              onClick={reset}
              className="bs-vvr-commit"
              {...PRESS}
            >
              ↺ pick again
            </motion.button>
          )}
        </div>
      }
    />
  );
}
