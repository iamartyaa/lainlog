"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { TextHighlighter } from "@/components/fancy";
import { SPRING, PRESS } from "@/lib/motion";
import { playSound } from "@/lib/audio";

/**
 * W1 — VibesVsRubric.
 *
 * Reader rates 3 LLM outputs by gut (ship / cut); the rubric verdict
 * auto-reveals as soon as the first one is rated, so the reader sees the
 * gap on interaction one instead of grinding through five rounds.
 *
 * The teaching point: the gap is the lesson. You marked these by feel.
 * The rubric marked them too. Here's where they disagreed.
 *
 * Interaction budget: ≤5. One tap on any row reveals every rubric
 * verdict (1 interaction); the reader can correct or refine the other
 * two rows (up to 2 more) and reset (1) — capped at 4 meaningful actions.
 *
 * Frame-stable: canvas min-height matches the tallest reachable state
 * (3 rows + rubric strip) so row count never causes a vertical jump.
 */

type Verdict = "ship" | "cut" | null;

type Output = {
  /** Short label shown to the reader. */
  id: string;
  /** The output text. */
  text: string;
  /** Rubric truth — what a careful grader would actually decide. */
  rubric: "ship" | "cut";
  /** The four sub-scores. 1 = pass, 0 = fail. */
  scores: { factual: 0 | 1; scoped: 0 | 1; voice: 0 | 1; safe: 0 | 1 };
};

const OUTPUTS: Output[] = [
  {
    id: "a",
    text: 'Coding assistant: "Use react-query useMutation for the POST handler — pass mutationFn and onSuccess." (in a project that already imports useMutation in 12 files)',
    rubric: "ship",
    scores: { factual: 1, scoped: 1, voice: 1, safe: 1 },
  },
  {
    id: "b",
    text: 'Doc Q&A: "The contract\'s termination clause is on page 14, paragraph 2." (the clause is on page 27)',
    rubric: "cut",
    scores: { factual: 0, scoped: 1, voice: 1, safe: 0 },
  },
  {
    id: "c",
    text: 'Support summary: "User reports the import failed and the dashboard is loading slowly. Please retry both." (two different users; one had the import issue, the other had the dashboard issue)',
    rubric: "cut",
    scores: { factual: 0, scoped: 1, voice: 1, safe: 1 },
  },
];

type Phase = "rating" | "revealed";

export function VibesVsRubric() {
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("rating");
  const [picks, setPicks] = useState<Record<string, Verdict>>({
    a: null,
    b: null,
    c: null,
  });

  const ratedCount = useMemo(
    () => OUTPUTS.filter((o) => picks[o.id]).length,
    [picks],
  );

  const mismatches = useMemo(
    () =>
      OUTPUTS.filter((o) => picks[o.id] && picks[o.id] !== o.rubric).length,
    [picks],
  );

  const measurements =
    phase === "revealed"
      ? `${mismatches}/${ratedCount || OUTPUTS.length} disagreements`
      : `${ratedCount}/${OUTPUTS.length} rated`;

  // The reveal trips on the first rating — show, then explain.
  const handlePick = (id: string, v: Verdict) => {
    playSound("Radio");
    setPicks((p) => ({ ...p, [id]: v }));
    if (phase === "rating") setPhase("revealed");
  };

  const handleReset = () => {
    playSound("Progress-Tick");
    setPhase("rating");
    setPicks({ a: null, b: null, c: null });
  };

  return (
    <WidgetShell
      title="vibes vs · rubric"
      measurements={measurements}
      canvas={
        <div className="bs-vvr-canvas">
          <style>{`
            .bs-vvr-canvas {
              padding: var(--spacing-md);
              min-height: 360px;
            }
            .bs-vvr-list {
              display: flex;
              flex-direction: column;
              gap: var(--spacing-md);
              list-style: none;
              padding: 0;
              margin: 0;
            }
            .bs-vvr-row {
              display: grid;
              grid-template-columns: 1fr;
              gap: var(--spacing-2xs);
              padding: var(--spacing-sm) var(--spacing-md);
              border: 1px solid var(--color-rule);
              border-radius: var(--radius-md);
              background: var(--color-surface);
              position: relative;
            }
            @container widget (min-width: 560px) {
              .bs-vvr-row {
                grid-template-columns: 1fr auto;
                align-items: center;
              }
            }
            .bs-vvr-text {
              font-family: var(--font-serif);
              font-size: var(--text-body);
              line-height: 1.55;
              color: var(--color-text);
              position: relative;
              padding-left: 14px;
            }
            .bs-vvr-mismatch-dot {
              position: absolute;
              left: 0;
              top: 0.55em;
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: var(--color-accent);
            }
            .bs-vvr-controls {
              display: flex;
              gap: var(--spacing-2xs);
              align-self: end;
              justify-self: start;
            }
            @container widget (min-width: 560px) {
              .bs-vvr-controls {
                justify-self: end;
              }
            }
            .bs-vvr-pick {
              min-height: 36px;
              min-width: 56px;
              padding: 0 var(--spacing-sm);
              border: 1px solid var(--color-rule);
              border-radius: var(--radius-md);
              background: var(--color-surface);
              color: var(--color-text-muted);
              font-family: var(--font-mono);
              font-size: var(--text-small);
              cursor: pointer;
              transition: color 200ms, border-color 200ms, background 200ms, opacity 200ms;
            }
            .bs-vvr-pick:hover:not(:disabled) {
              color: var(--color-accent);
              border-color: color-mix(in oklab, var(--color-accent) 60%, var(--color-rule));
            }
            .bs-vvr-pick[data-active="true"] {
              color: var(--color-text);
              background: color-mix(in oklab, var(--color-accent) 14%, transparent);
              border-color: color-mix(in oklab, var(--color-accent) 50%, var(--color-rule));
            }
            .bs-vvr-pick[data-correct="true"] {
              border-color: var(--color-accent);
              color: var(--color-text);
            }
            .bs-vvr-pick:disabled {
              cursor: default;
              opacity: 0.7;
            }
            .bs-vvr-rubric-row {
              grid-column: 1 / -1;
              display: flex;
              flex-wrap: wrap;
              gap: var(--spacing-sm);
              padding-top: var(--spacing-2xs);
              border-top: 1px dashed var(--color-rule);
              margin-top: var(--spacing-2xs);
              font-family: var(--font-mono);
              font-size: var(--text-small);
              color: var(--color-text-muted);
            }
            .bs-vvr-rubric-cell {
              display: inline-flex;
              align-items: center;
              gap: 6px;
            }
            .bs-vvr-rubric-cell[data-passed="true"] {
              color: var(--color-text);
            }
            .bs-vvr-rubric-dot {
              display: inline-block;
              width: 7px;
              height: 7px;
              border-radius: 50%;
              background: var(--color-rule);
            }
            .bs-vvr-rubric-cell[data-passed="true"] .bs-vvr-rubric-dot {
              background: var(--color-accent);
            }
            .bs-vvr-commit {
              min-height: 44px;
              padding: 0 var(--spacing-md);
              border: 1px solid var(--color-rule);
              border-radius: var(--radius-md);
              background: var(--color-surface);
              color: var(--color-text);
              font-family: var(--font-mono);
              font-size: var(--text-ui);
              cursor: pointer;
              transition: color 200ms, border-color 200ms;
            }
            .bs-vvr-commit:hover:not(:disabled) {
              color: var(--color-accent);
              border-color: color-mix(in oklab, var(--color-accent) 60%, var(--color-rule));
            }
            .bs-vvr-commit:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
          `}</style>
          <ul className="bs-vvr-list">
            {OUTPUTS.map((o) => {
              const pick = picks[o.id];
              const mismatched =
                phase === "revealed" && pick && pick !== o.rubric;
              return (
                <li key={o.id} className="bs-vvr-row">
                  <div className="bs-vvr-text">
                    <AnimatePresence mode="wait" initial={false}>
                      {phase === "revealed" && mismatched ? (
                        <motion.span
                          key="dot"
                          aria-hidden
                          className="bs-vvr-mismatch-dot"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={
                            prefersReducedMotion
                              ? { duration: 0 }
                              : SPRING.snappy
                          }
                        />
                      ) : null}
                    </AnimatePresence>
                    <span>{o.text}</span>
                  </div>
                  <div className="bs-vvr-controls">
                    <motion.button
                      type="button"
                      onClick={() => handlePick(o.id, "ship")}
                      disabled={false}
                      aria-pressed={pick === "ship"}
                      className="bs-vvr-pick"
                      data-active={pick === "ship"}
                      data-correct={
                        phase === "revealed" && o.rubric === "ship"
                      }
                      {...PRESS}
                    >
                      ship
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => handlePick(o.id, "cut")}
                      disabled={false}
                      aria-pressed={pick === "cut"}
                      className="bs-vvr-pick"
                      data-active={pick === "cut"}
                      data-correct={
                        phase === "revealed" && o.rubric === "cut"
                      }
                      {...PRESS}
                    >
                      cut
                    </motion.button>
                  </div>
                  {phase === "revealed" ? (
                    <motion.div
                      className="bs-vvr-rubric-row"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={
                        prefersReducedMotion
                          ? { duration: 0 }
                          : SPRING.smooth
                      }
                    >
                      {(["factual", "scoped", "voice", "safe"] as const).map(
                        (key) => {
                          const passed = o.scores[key] === 1;
                          return (
                            <span
                              key={key}
                              className="bs-vvr-rubric-cell"
                              data-passed={passed}
                            >
                              <span aria-hidden className="bs-vvr-rubric-dot" />
                              {key}
                            </span>
                          );
                        },
                      )}
                    </motion.div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      }
      state={
        phase === "rating" ? (
          <span>
            Three real LLM outputs.{" "}
            <TextHighlighter
              transition={{ type: "spring", duration: 0.9, bounce: 0 }}
              highlightColor="color-mix(in oklab, var(--color-accent) 28%, transparent)"
              useInViewOptions={{ once: true, amount: 0.55 }}
              className="rounded-[0.2em] px-[1px]"
            >
              Tap one by gut.
            </TextHighlighter>{" "}
            The rubric reveals on first rating.
          </span>
        ) : (
          <span>
            You marked these by feel. The rubric marked them too.{" "}
            <TextHighlighter
              transition={{ type: "spring", duration: 0.9, bounce: 0 }}
              highlightColor="color-mix(in oklab, var(--color-accent) 28%, transparent)"
              useInViewOptions={{ once: true, amount: 0.55 }}
              className="rounded-[0.2em] px-[1px]"
            >
              That gap is what vibes can&apos;t see.
            </TextHighlighter>
          </span>
        )
      }
      controls={
        <div className="flex items-center gap-[var(--spacing-sm)]">
          <motion.button
            type="button"
            onClick={handleReset}
            disabled={phase === "rating" && ratedCount === 0}
            className="bs-vvr-commit"
            {...PRESS}
          >
            ↺ rate again
          </motion.button>
        </div>
      }
    />
  );
}
