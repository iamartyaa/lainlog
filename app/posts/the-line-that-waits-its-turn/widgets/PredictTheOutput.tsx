"use client";

import { memo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
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
 * Three variants. None reproduces Archibald's `script start / promise1 /
 * promise2 / setTimeout / script end` example. Different identifiers,
 * different log strings, different microtask counts.
 * --------------------------------------------------------------------------*/

type Source = "sync" | "task" | "micro";

type Variant = {
  id: "alpha" | "beta" | "gamma";
  label: string;
  /** Human one-liner shown in the row above the variant tabs. */
  blurb: string;
  /** Code lines (mono). */
  code: string[];
  /** Four candidate orderings shown to the reader. */
  options: string[];
  /** The correct ordering (one of the options). */
  correctIndex: number;
  /** The reveal: list of (letter, source) pairs in actual run order. */
  reveal: { letter: string; source: Source }[];
  /** A one-line caption for the reveal panel. */
  revealNote: React.ReactNode;
};

const VARIANTS: Variant[] = [
  {
    id: "alpha",
    label: "α · baseline",
    blurb: "setTimeout vs Promise.then with two synchronous logs.",
    code: [
      `console.log("A");`,
      `setTimeout(() => console.log("B"), 0);`,
      `Promise.resolve().then(() => console.log("C"));`,
      `console.log("D");`,
    ],
    options: ["A B C D", "A D B C", "A D C B", "A C D B"],
    correctIndex: 2,
    reveal: [
      { letter: "A", source: "sync" },
      { letter: "D", source: "sync" },
      { letter: "C", source: "micro" },
      { letter: "B", source: "task" },
    ],
    revealNote: (
      <>
        Both <strong>sync</strong> logs print first inside <code className="font-mono">main</code>.
        After the stack drains, the loop drains the microtask queue → C. Only
        then does it run one task → B.
      </>
    ),
  },
  {
    id: "beta",
    label: "β · microtasks spawn microtasks",
    blurb: "A .then whose body schedules another .then.",
    code: [
      `setTimeout(() => console.log("T"), 0);`,
      `Promise.resolve().then(() => {`,
      `  console.log("P1");`,
      `  Promise.resolve().then(() => console.log("P2"));`,
      `});`,
    ],
    options: ["T P1 P2", "P1 T P2", "P1 P2 T", "T P2 P1"],
    correctIndex: 2,
    reveal: [
      { letter: "P1", source: "micro" },
      { letter: "P2", source: "micro" },
      { letter: "T", source: "task" },
    ],
    revealNote: (
      <>
        The microtask queue drains <em>completely</em> — including the new
        microtask added <em>during</em> the drain. P2 runs before T, even
        though T was scheduled first.
      </>
    ),
  },
  {
    id: "gamma",
    label: "γ · task scheduled first",
    blurb: "setTimeout(0) called before any Promise. Microtask still wins.",
    code: [
      `setTimeout(() => console.log("first?"), 0);`,
      `Promise.resolve().then(() => console.log("second?"));`,
    ],
    options: [
      `"first?" "second?"`,
      `"second?" "first?"`,
      `nondeterministic`,
      `only one prints`,
    ],
    correctIndex: 1,
    reveal: [
      { letter: '"second?"', source: "micro" },
      { letter: '"first?"', source: "task" },
    ],
    revealNote: (
      <>
        Source order doesn&apos;t decide queue order. The microtask wins
        because the loop drains microtasks <em>before</em> running any task —
        always.
      </>
    ),
  },
];

const SOURCE_LABEL: Record<Source, string> = {
  sync: "sync",
  task: "task queue",
  micro: "microtask queue",
};

const SOURCE_FILL: Record<Source, string> = {
  sync: "transparent",
  task: "transparent",
  micro: "var(--color-accent)",
};

const SOURCE_TEXT: Record<Source, string> = {
  sync: "var(--color-text-muted)",
  task: "var(--color-accent)",
  micro: "var(--color-bg)",
};

const SOURCE_STROKE: Record<Source, string> = {
  sync: "var(--color-text-muted)",
  task: "var(--color-accent)",
  micro: "transparent",
};

function CodePane({ code }: { code: string[] }) {
  return (
    <pre
      className="font-mono"
      style={{
        background: "color-mix(in oklab, var(--color-surface) 60%, transparent)",
        padding: "var(--spacing-sm)",
        borderRadius: "var(--radius-sm)",
        fontSize: 12,
        color: "var(--color-text)",
        lineHeight: 1.65,
        margin: 0,
        whiteSpace: "pre",
        overflowX: "auto",
        minHeight: "9em",
      }}
    >
      {code.join("\n")}
    </pre>
  );
}

function RevealStrip({ reveal }: { reveal: Variant["reveal"] }) {
  return (
    <div
      className="flex flex-wrap items-center gap-[var(--spacing-xs)]"
      style={{ minHeight: "5.5em" }}
    >
      {reveal.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING.snappy, delay: i * 0.18 }}
          className="flex flex-col items-center gap-[2px]"
        >
          <span
            className="font-mono inline-flex items-center justify-center"
            style={{
              padding: "4px 10px",
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 600,
              background: SOURCE_FILL[item.source],
              border: `1.5px solid ${SOURCE_STROKE[item.source]}`,
              color: SOURCE_TEXT[item.source],
              minWidth: "3ch",
              textAlign: "center",
            }}
          >
            {item.letter}
          </span>
          <span
            className="font-sans"
            style={{
              fontSize: 10,
              color: "var(--color-text-muted)",
              letterSpacing: "0.02em",
            }}
          >
            {SOURCE_LABEL[item.source]}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

const MemoCodePane = memo(CodePane);

/**
 * PredictTheOutput (W2) — three selectable variants. Reader picks an
 * ordering, then taps "reveal" to see the actual run with queue-source
 * annotations.
 *
 * One verb: predict (predict → reveal). Variant chooser is parameter
 * selection, not a competing verb (carve-out documented in widgets.md).
 *
 * Frame stability (R6): variant chooser, code pane, predict options, and
 * reveal strip share a single fixed-rectangle canvas. The reveal strip has
 * `min-height` so the card doesn't grow when it appears.
 */
export function PredictTheOutput() {
  const [variantId, setVariantId] = useState<Variant["id"]>("alpha");
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const variant = VARIANTS.find((v) => v.id === variantId)!;

  function selectVariant(id: Variant["id"]) {
    setVariantId(id);
    setPicked(null);
    setRevealed(false);
  }

  return (
    <WidgetShell
      title="predict the output"
      measurements={variant.label}
      caption={
        revealed ? (
          <>
            <CaptionCue>Revealed.</CaptionCue> {variant.revealNote}
          </>
        ) : picked !== null ? (
          <>
            <CaptionCue>Locked in.</CaptionCue> Tap{" "}
            <em>play it</em> to run the program with queue annotations.
          </>
        ) : (
          <>
            <CaptionCue>Predict.</CaptionCue> Tap the ordering you think the
            runtime will produce. {variant.blurb}
          </>
        )
      }
      captionTone="prominent"
      controls={
        <div className="flex items-center justify-center gap-[var(--spacing-sm)] w-full">
          {picked !== null && !revealed ? (
            <motion.button
              type="button"
              onClick={() => setRevealed(true)}
              className="font-sans rounded-[var(--radius-md)] px-[var(--spacing-md)] py-[var(--spacing-2xs)] min-h-[44px]"
              style={{
                fontSize: "var(--text-ui)",
                background: "var(--color-accent)",
                color: "var(--color-bg)",
              }}
              {...PRESS}
            >
              play it ▸
            </motion.button>
          ) : null}
          {revealed ? (
            <motion.button
              type="button"
              onClick={() => {
                setPicked(null);
                setRevealed(false);
              }}
              className="font-sans rounded-[var(--radius-md)] px-[var(--spacing-md)] py-[var(--spacing-2xs)] min-h-[44px]"
              style={{
                fontSize: "var(--text-ui)",
                color: "var(--color-text-muted)",
                border: "1px solid var(--color-rule)",
              }}
              {...PRESS}
            >
              try again
            </motion.button>
          ) : null}
        </div>
      }
    >
      <div className="flex flex-col gap-[var(--spacing-sm)]">
        {/* Variant chooser — segmented control above the canvas. */}
        <div
          role="tablist"
          aria-label="variant"
          className="flex flex-wrap items-center gap-[var(--spacing-2xs)]"
          style={{ fontSize: "var(--text-small)" }}
        >
          {VARIANTS.map((v) => {
            const active = v.id === variantId;
            return (
              <motion.button
                key={v.id}
                role="tab"
                aria-selected={active}
                onClick={() => selectVariant(v.id)}
                className="font-sans rounded-[var(--radius-sm)] min-h-[44px]"
                style={{
                  padding: "6px 12px",
                  background: active
                    ? "color-mix(in oklab, var(--color-accent) 14%, transparent)"
                    : "transparent",
                  color: active
                    ? "var(--color-text)"
                    : "var(--color-text-muted)",
                  border: `1px solid ${active ? "var(--color-accent)" : "var(--color-rule)"}`,
                }}
                {...PRESS}
              >
                {v.label}
              </motion.button>
            );
          })}
        </div>

        <MemoCodePane code={variant.code} />

        {/* Predict / reveal area — fixed-rectangle, shares min-height. */}
        <div style={{ minHeight: "9em" }}>
          <AnimatePresence mode="wait" initial={false}>
            {!revealed ? (
              <motion.div
                key="predict"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={SPRING.snappy}
                className="grid gap-[var(--spacing-2xs)]"
                style={{
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                }}
              >
                {variant.options.map((opt, i) => {
                  const isPicked = picked === i;
                  return (
                    <motion.button
                      key={i}
                      type="button"
                      onClick={() => setPicked(i)}
                      className="font-mono rounded-[var(--radius-sm)] min-h-[44px] text-left"
                      style={{
                        padding: "10px 12px",
                        fontSize: 12,
                        background: isPicked
                          ? "color-mix(in oklab, var(--color-accent) 18%, transparent)"
                          : "color-mix(in oklab, var(--color-surface) 60%, transparent)",
                        color: "var(--color-text)",
                        border: `1.5px solid ${
                          isPicked ? "var(--color-accent)" : "var(--color-rule)"
                        }`,
                      }}
                      {...PRESS}
                    >
                      {opt}
                    </motion.button>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="reveal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={SPRING.snappy}
                className="flex flex-col gap-[var(--spacing-xs)]"
              >
                <motion.div
                  className="font-sans"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={SPRING.snappy}
                  style={{
                    fontSize: "var(--text-small)",
                    color:
                      picked === variant.correctIndex
                        ? "var(--color-accent)"
                        : "var(--color-text-muted)",
                  }}
                >
                  {picked === variant.correctIndex
                    ? "Correct — here's why."
                    : `Actual run order (your pick: ${variant.options[picked ?? 0]}):`}
                </motion.div>
                <RevealStrip reveal={variant.reveal} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </WidgetShell>
  );
}
