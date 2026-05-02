"use client";

import { useState, useMemo } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { TextHighlighter } from "@/components/fancy";
import { SPRING } from "@/lib/motion";
import { playSound } from "@/lib/audio";

/**
 * W4 — JudgeCalibrate.
 *
 * One LLM output. A rubric-strictness slider (loose ↔ strict) and a
 * judge-model toggle (model-A / model-B / human panel). The verdict pill
 * (ship / cut) flips as the inputs change. Same output, different
 * verdicts — because the verdict is a property of the (judge, rubric)
 * tuple, not the output.
 *
 * Threshold model: each judge has a "leniency" offset; the output has a
 * fixed quality score (62/100); strictness slider sets the cutoff. Verdict
 * is `score - leniency >= cutoff ? ship : cut`.
 */

type Judge = "model-a" | "model-b" | "human";

const JUDGES: { id: Judge; label: string; sub: string; leniency: number }[] = [
  // Higher leniency = scores the output higher (more likely to ship).
  { id: "model-a", label: "GPT-shape", sub: "verbose-loving", leniency: 14 },
  { id: "model-b", label: "Claude-shape", sub: "family-aware", leniency: 6 },
  { id: "human", label: "human panel", sub: "the calibration target", leniency: 0 },
];

const OUTPUT_SCORE = 62; // The "true" quality of the output

export function JudgeCalibrate() {
  const prefersReducedMotion = useReducedMotion();
  const [strictness, setStrictness] = useState(50); // cutoff 0..100
  const [judge, setJudge] = useState<Judge>("human");

  const judgeMeta = useMemo(
    () => JUDGES.find((j) => j.id === judge)!,
    [judge],
  );

  const adjustedScore = OUTPUT_SCORE + judgeMeta.leniency;
  const verdict: "ship" | "cut" = adjustedScore >= strictness ? "ship" : "cut";

  const onJudge = (j: Judge) => {
    if (j === judge) return;
    playSound("Radio");
    setJudge(j);
  };

  return (
    <WidgetShell
      title="judge · calibrate"
      measurements={`score ${adjustedScore} · cutoff ${strictness}`}
      canvas={
        <div className="bs-jc-canvas">
          <style>{`
            .bs-jc-canvas {
              padding: var(--spacing-md);
              min-height: 380px;
              display: flex;
              flex-direction: column;
              gap: var(--spacing-md);
            }
            .bs-jc-output {
              padding: var(--spacing-sm) var(--spacing-md);
              border: 1px solid var(--color-rule);
              border-radius: var(--radius-md);
              background: var(--color-surface);
              font-family: var(--font-serif);
              font-size: var(--text-body);
              line-height: 1.55;
              color: var(--color-text);
            }
            .bs-jc-output-label {
              display: block;
              font-family: var(--font-mono);
              font-size: 11px;
              color: var(--color-text-muted);
              margin-bottom: var(--spacing-2xs);
              letter-spacing: 0.04em;
              text-transform: uppercase;
            }
            .bs-jc-row {
              display: flex;
              align-items: center;
              gap: var(--spacing-md);
              flex-wrap: wrap;
            }
            .bs-jc-verdict {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              padding: 8px 16px;
              min-width: 120px;
              border-radius: 999px;
              font-family: var(--font-mono);
              font-size: var(--text-ui);
              border: 1px solid;
              font-weight: 500;
            }
            .bs-jc-verdict[data-v="ship"] {
              background: color-mix(in oklab, var(--color-accent) 18%, transparent);
              border-color: var(--color-accent);
              color: var(--color-text);
            }
            .bs-jc-verdict[data-v="cut"] {
              background: var(--color-surface);
              border-color: var(--color-rule);
              color: var(--color-text-muted);
            }
            .bs-jc-judges {
              display: flex;
              gap: var(--spacing-2xs);
              flex-wrap: wrap;
            }
            .bs-jc-judge {
              padding: var(--spacing-2xs) var(--spacing-sm);
              border: 1px solid var(--color-rule);
              border-radius: var(--radius-md);
              background: var(--color-surface);
              font-family: var(--font-mono);
              font-size: var(--text-small);
              color: var(--color-text-muted);
              cursor: pointer;
              transition: color 200ms, border-color 200ms, background 200ms;
              min-height: 44px;
              text-align: left;
            }
            .bs-jc-judge[data-active="true"] {
              color: var(--color-text);
              background: color-mix(in oklab, var(--color-accent) 12%, transparent);
              border-color: color-mix(in oklab, var(--color-accent) 50%, var(--color-rule));
            }
            .bs-jc-judge-sub {
              display: block;
              font-size: 10px;
              color: var(--color-text-muted);
              margin-top: 2px;
            }
            .bs-jc-strictness {
              width: 100%;
            }
            .bs-jc-strictness-row {
              display: grid;
              grid-template-columns: auto 1fr auto;
              align-items: center;
              gap: var(--spacing-sm);
              font-family: var(--font-mono);
              font-size: var(--text-small);
              color: var(--color-text-muted);
            }
          `}</style>

          <div>
            <span className="bs-jc-output-label">model · output #042</span>
            <div className="bs-jc-output">
              &ldquo;Hi Sarah — thanks for reaching out. I&rsquo;ve
              checked the import logs and the failure was caused by
              a malformed CSV header on row 1. I&rsquo;ve attached a
              fixed file. Let me know if you have any other issues!&rdquo;
              <span style={{ display: "block", marginTop: 6, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-muted)" }}>
                (input ticket: customer name was Sara, not Sarah; the
                root cause was a permissions issue, not a malformed CSV.)
              </span>
            </div>
          </div>

          <div className="bs-jc-row">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-small)", color: "var(--color-text-muted)" }}>
              verdict:
            </span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={`${verdict}-${judge}`}
                className="bs-jc-verdict"
                data-v={verdict}
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                transition={
                  prefersReducedMotion ? { duration: 0 } : SPRING.snappy
                }
              >
                {verdict === "ship" ? "▶ ship" : "× cut"}
              </motion.span>
            </AnimatePresence>
          </div>

          <div>
            <span className="bs-jc-output-label">judge model</span>
            <div className="bs-jc-judges">
              {JUDGES.map((j) => (
                <button
                  key={j.id}
                  type="button"
                  className="bs-jc-judge"
                  data-active={judge === j.id}
                  onClick={() => onJudge(j.id)}
                  aria-pressed={judge === j.id}
                >
                  {j.label}
                  <span className="bs-jc-judge-sub">{j.sub}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="bs-jc-strictness-row">
              <span>loose</span>
              <input
                type="range"
                className="bs-jc-strictness"
                min={0}
                max={100}
                value={strictness}
                onChange={(e) => setStrictness(Number(e.target.value))}
                aria-label="Rubric strictness"
              />
              <span>strict</span>
            </div>
          </div>
        </div>
      }
      state={
        <span>
          Same output, three judges, one slider.{" "}
          <TextHighlighter
            transition={{ type: "spring", duration: 0.9, bounce: 0 }}
            highlightColor="color-mix(in oklab, var(--color-accent) 28%, transparent)"
            useInViewOptions={{ once: true, amount: 0.55 }}
            className="rounded-[0.2em] px-[1px]"
          >
            The verdict isn&apos;t a property of the output.
          </TextHighlighter>{" "}
          It&apos;s a property of the (judge, rubric) pair — and the only
          fix is calibration, not a fancier model.
        </span>
      }
      controls={null}
    />
  );
}
