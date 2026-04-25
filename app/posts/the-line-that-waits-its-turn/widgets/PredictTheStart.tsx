"use client";

import { memo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { TextHighlighter } from "@/components/fancy";
import { SPRING, PRESS } from "@/lib/motion";
import { WidgetShell } from "@/components/viz/WidgetShell";

const HL_COLOR = "color-mix(in oklab, var(--color-accent) 28%, transparent)";
const HL_TX = { type: "spring" as const, duration: 0.9, bounce: 0 };

function CaptionCue({ children }: { children: React.ReactNode }) {
  return (
    <TextHighlighter
      triggerType="auto"
      transition={HL_TX}
      highlightColor={HL_COLOR}
      className="rounded-[0.2em] px-[1px]"
    >
      {children}
    </TextHighlighter>
  );
}

/* ---------------------------------------------------------------------------
 * The article's opening hook. The reader sees a deliberately hard snippet —
 * sync + macro + micro + chained-Promise + await — and must guess the output.
 * Most readers should fail. The verdict copy steers wrong-guessers into the
 * article ("now we'll learn how"); right-guessers get a "let's see why".
 *
 * The snippet stays visible after the answer reveals — it's the article's
 * anchor, referenced in §3, §5, and the closer.
 *
 * Correct trace (verified):
 *   sync:       A, F, H
 *   microtask:  C  (the .then prints C, then returns Promise.resolve("D")
 *                   — but adopting that thenable costs two extra microtask
 *                   hops, so D is delayed)
 *   microtask:  E  (queueMicrotask)
 *   microtask:  G  (await null continuation — one hop)
 *   microtask:  D  (the chained .then((d) => log(d)) finally fires)
 *   task:       B  (setTimeout drains last)
 *   →  A · F · H · C · E · G · D · B
 * --------------------------------------------------------------------------*/

const SNIPPET = [
  `console.log("A");`,
  `setTimeout(() => console.log("B"), 0);`,
  `Promise.resolve()`,
  `  .then(() => {`,
  `    console.log("C");`,
  `    return Promise.resolve("D");`,
  `  })`,
  `  .then((d) => console.log(d));`,
  `queueMicrotask(() => console.log("E"));`,
  `(async () => {`,
  `  console.log("F");`,
  `  await null;`,
  `  console.log("G");`,
  `})();`,
  `console.log("H");`,
];

type Option = {
  /** Tokens, joined with a tabular separator for display. */
  tokens: string[];
  /** Why a reader might pick this — for the post-answer "your model" hint. */
  rationale: string;
};

const OPTIONS: Option[] = [
  // 0 — correct
  {
    tokens: ["A", "F", "H", "C", "E", "G", "D", "B"],
    rationale: "spec-accurate: returning Promise.resolve(D) costs two extra microtask hops",
  },
  // 1 — most common wrong: forgets the chained-Promise extra hops
  {
    tokens: ["A", "F", "H", "C", "E", "D", "G", "B"],
    rationale: "thinks returning Promise.resolve(D) resolves immediately",
  },
  // 2 — forgot await is a microtask
  {
    tokens: ["A", "F", "G", "H", "C", "E", "D", "B"],
    rationale: "thinks await null continues synchronously",
  },
  // 3 — thinks setTimeout(0) outranks microtasks
  {
    tokens: ["A", "F", "H", "B", "C", "E", "G", "D"],
    rationale: "thinks setTimeout(0) wins because zero means now",
  },
];

const CORRECT_INDEX = 0;
const SEP = "·";

function tokensToLine(tokens: string[]) {
  return tokens.join(` ${SEP} `);
}

function CodePane() {
  return (
    <pre
      className="font-mono"
      style={{
        background: "color-mix(in oklab, var(--color-surface) 60%, transparent)",
        padding: "var(--spacing-sm)",
        borderRadius: "var(--radius-sm)",
        fontSize: 12,
        lineHeight: 1.55,
        color: "var(--color-text)",
        margin: 0,
        whiteSpace: "pre",
        overflowX: "auto",
        // Reserve enough rows that the pane doesn't shift when scrolling.
        // 15 lines × ~19px line-height + 24px padding ≈ 309px.
        minHeight: 280,
      }}
    >
      {SNIPPET.join("\n")}
    </pre>
  );
}

const MemoCodePane = memo(CodePane);

function OptionButton({
  option,
  index,
  picked,
  revealed,
  onPick,
}: {
  option: Option;
  index: number;
  picked: number | null;
  revealed: boolean;
  onPick: (i: number) => void;
}) {
  const reduce = useReducedMotion();
  const isPicked = picked === index;
  const isCorrect = index === CORRECT_INDEX;
  const isWrongPick = revealed && isPicked && !isCorrect;
  const showCorrect = revealed && isCorrect;

  // Frame-stability: the button geometry never changes; only fill/stroke/text
  // colour swap on reveal. The pulse is one-shot scale 1 → 1.04 → 1.
  const animate =
    showCorrect && !reduce
      ? { scale: [1, 1.04, 1] }
      : { scale: 1 };

  return (
    <motion.button
      type="button"
      onClick={() => !revealed && onPick(index)}
      disabled={revealed}
      aria-label={`option ${index + 1}: ${option.tokens.join(" ")}`}
      animate={animate}
      transition={
        showCorrect && !reduce
          ? { duration: 0.25, times: [0, 0.5, 1] }
          : SPRING.snappy
      }
      whileTap={revealed ? undefined : { scale: 0.97 }}
      className="font-mono rounded-[var(--radius-sm)] min-h-[44px] text-center"
      style={{
        padding: "10px 12px",
        fontSize: 13,
        letterSpacing: "0.02em",
        background: showCorrect
          ? "var(--color-accent)"
          : isWrongPick
            ? "transparent"
            : isPicked
              ? "color-mix(in oklab, var(--color-accent) 18%, transparent)"
              : "color-mix(in oklab, var(--color-surface) 60%, transparent)",
        color: showCorrect
          ? "var(--color-bg)"
          : isWrongPick
            ? "var(--color-text-muted)"
            : "var(--color-text)",
        border: `1.5px solid ${
          showCorrect
            ? "transparent"
            : isWrongPick
              ? "var(--color-rule)"
              : isPicked
                ? "var(--color-accent)"
                : "var(--color-rule)"
        }`,
        textDecoration: isWrongPick ? "line-through" : "none",
        opacity: revealed && !showCorrect && !isPicked ? 0.5 : 1,
        cursor: revealed ? "default" : "pointer",
        transition: "background 200ms, color 200ms, border-color 200ms, opacity 200ms",
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        {showCorrect ? (
          <span aria-hidden style={{ fontSize: 12 }}>✓</span>
        ) : null}
        <span style={{ whiteSpace: "nowrap" }}>{tokensToLine(option.tokens)}</span>
      </span>
    </motion.button>
  );
}

/**
 * PredictTheStart (W0) — the article's opening hook. A hard snippet the
 * reader is expected to fail; the verdict steers them into the rest of the
 * post.
 *
 * One verb: predict (predict → reveal). Reveal-answer link is a parameter
 * shortcut, not a competing verb.
 *
 * Frame stability (R6): code pane has `min-height`; verdict slot has
 * `min-height` reserved before any answer is given. No layout shift on
 * pick. Correct option pulses scale 1 → 1.04 → 1 once on reveal.
 *
 * Mobile-first: 360px target. Options stack vertically on <lg, 2×2 on lg+.
 * Snippet wraps to its own scroll container only as a last resort.
 */
export function PredictTheStart() {
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const isCorrect = picked === CORRECT_INDEX;

  function lockIn() {
    if (picked === null) return;
    setRevealed(true);
  }

  function revealUnguessed() {
    setPicked(null);
    setRevealed(true);
  }

  function reset() {
    setPicked(null);
    setRevealed(false);
  }

  return (
    <WidgetShell
      title="predict the output"
      measurements={revealed ? (isCorrect ? "got it" : "most miss this") : "8 logs · 4 queues"}
      caption={
        revealed ? (
          isCorrect ? (
            <>
              <CaptionCue>You&apos;ve seen this before.</CaptionCue> Let&apos;s
              see <em>why</em> it produces this output — the rest of the post is
              the trace, line by line.
            </>
          ) : (
            <>
              <CaptionCue>Most readers miss this.</CaptionCue> Now we&apos;ll
              learn <em>how</em> this output emerges. Keep this snippet open —
              every section below points back to a line of it.
            </>
          )
        ) : (
          <>
            <CaptionCue>Predict the output.</CaptionCue> Pick the order{" "}
            <code className="font-mono">console.log</code> will print. The
            snippet mixes sync code, a timer, two Promises, a microtask, and an{" "}
            <code className="font-mono">await</code>. Most readers get this
            wrong on the first try.
          </>
        )
      }
      captionTone="prominent"
      controls={
        <div className="flex flex-wrap items-center justify-center gap-[var(--spacing-sm)] w-full">
          {!revealed ? (
            <>
              <motion.button
                type="button"
                onClick={lockIn}
                disabled={picked === null}
                className="font-sans rounded-[var(--radius-md)] min-h-[44px]"
                style={{
                  padding: "8px 18px",
                  fontSize: "var(--text-ui)",
                  background:
                    picked === null
                      ? "color-mix(in oklab, var(--color-accent) 30%, transparent)"
                      : "var(--color-accent)",
                  color: "var(--color-bg)",
                  border: "none",
                  cursor: picked === null ? "not-allowed" : "pointer",
                  opacity: picked === null ? 0.6 : 1,
                  transition: "opacity 200ms, background 200ms",
                }}
                {...(picked === null ? {} : PRESS)}
              >
                lock in ▸
              </motion.button>
              <button
                type="button"
                onClick={revealUnguessed}
                className="font-sans min-h-[44px]"
                style={{
                  padding: "8px 12px",
                  fontSize: "var(--text-small)",
                  color: "var(--color-text-muted)",
                  background: "transparent",
                  border: "none",
                  textDecoration: "underline",
                  textDecorationStyle: "dotted",
                  textUnderlineOffset: 4,
                  cursor: "pointer",
                }}
              >
                reveal answer
              </button>
            </>
          ) : (
            <motion.button
              type="button"
              onClick={reset}
              className="font-sans rounded-[var(--radius-md)] min-h-[44px]"
              style={{
                padding: "8px 16px",
                fontSize: "var(--text-ui)",
                color: "var(--color-text-muted)",
                background: "transparent",
                border: "1px solid var(--color-rule)",
              }}
              {...PRESS}
            >
              try again
            </motion.button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-[var(--spacing-sm)]">
        <MemoCodePane />

        {/* Options — stacked on mobile, 2x2 on lg+. Frame-stable: container
            never resizes after pick or reveal. */}
        <div
          className="grid gap-[var(--spacing-2xs)]"
          style={{
            gridTemplateColumns: "1fr",
          }}
        >
          <style>{`
            @media (min-width: 640px) {
              .bs-predict-options {
                grid-template-columns: 1fr 1fr !important;
              }
            }
          `}</style>
          <div
            className="bs-predict-options grid gap-[var(--spacing-2xs)]"
            style={{ gridTemplateColumns: "1fr" }}
          >
            {OPTIONS.map((opt, i) => (
              <OptionButton
                key={i}
                option={opt}
                index={i}
                picked={picked}
                revealed={revealed}
                onPick={setPicked}
              />
            ))}
          </div>
        </div>

        {/* Verdict slot — fixed height so the layout doesn't jump on reveal. */}
        <div style={{ minHeight: "2.25em" }}>
          <AnimatePresence initial={false} mode="wait">
            {revealed ? (
              <motion.div
                key="verdict"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={SPRING.snappy}
                className="font-mono"
                style={{
                  fontSize: 12,
                  color: "var(--color-text-muted)",
                  lineHeight: 1.6,
                }}
              >
                <span style={{ color: "var(--color-accent)" }}>output</span>
                {"  "}
                <span style={{ color: "var(--color-text)" }}>
                  {tokensToLine(OPTIONS[CORRECT_INDEX].tokens)}
                </span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </WidgetShell>
  );
}
