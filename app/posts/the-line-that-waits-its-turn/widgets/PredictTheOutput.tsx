"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { TextHighlighter } from "@/components/fancy";
import { SPRING, PRESS } from "@/lib/motion";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { Quiz } from "@/components/widgets/Quiz";
import { playSound } from "@/lib/audio";

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
 *
 * As of PR #58 the predict-and-reveal interaction is delegated to the shared
 * <Quiz> wrapper. Each variant feeds <Quiz> its own option set + correct id,
 * and the wrapper's verdict slot renders the queue-source-annotated reveal
 * strip (replacing the bespoke verdict text we used to render here).
 * --------------------------------------------------------------------------*/

type Source = "sync" | "task" | "micro";

type Variant = {
  id: "alpha" | "beta" | "gamma";
  label: string;
  /** Human one-liner shown in the row above the variant tabs. */
  blurb: string;
  /** Four candidate orderings shown to the reader. Each id matches `tokens`. */
  options: { id: string; tokens: string[] }[];
  /** Which option.id is correct. */
  correctId: string;
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
    options: [
      { id: "abcd", tokens: ["A", "B", "C", "D"] },
      { id: "adbc", tokens: ["A", "D", "B", "C"] },
      { id: "adcb", tokens: ["A", "D", "C", "B"] },
      { id: "acdb", tokens: ["A", "C", "D", "B"] },
    ],
    correctId: "adcb",
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
    options: [
      { id: "tp1p2", tokens: ["T", "P1", "P2"] },
      { id: "p1tp2", tokens: ["P1", "T", "P2"] },
      { id: "p1p2t", tokens: ["P1", "P2", "T"] },
      { id: "tp2p1", tokens: ["T", "P2", "P1"] },
    ],
    correctId: "p1p2t",
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
    options: [
      { id: "first-second", tokens: [`"first?"`, `"second?"`] },
      { id: "second-first", tokens: [`"second?"`, `"first?"`] },
      { id: "nondet", tokens: ["nondeterministic"] },
      { id: "only-one", tokens: ["only one prints"] },
    ],
    correctId: "second-first",
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

function RevealStrip({ reveal }: { reveal: Variant["reveal"] }) {
  return (
    <div className="flex flex-wrap items-center gap-[var(--spacing-xs)]">
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

const SEP = "·";
function tokensToLine(tokens: string[]) {
  return tokens.join(` ${SEP} `);
}

/**
 * PredictTheOutput (W2) — three selectable variants. Reader picks an
 * ordering, and the shared <Quiz> wrapper handles the pulse / nod / sparkle
 * + verdict reveal. The verdict slot itself renders our queue-source-annotated
 * reveal strip plus the per-variant revealNote.
 *
 * One verb: predict (predict → reveal). Variant chooser is parameter
 * selection, not a competing verb (carve-out documented in widgets.md).
 *
 * Frame stability (R6): variant chooser, code pane, and <Quiz> share a
 * single shell. <Quiz>'s verdict-slot min-height keeps the canvas stable.
 *
 * Code rendering: Shiki-highlighted code panes (one per variant) are
 * pre-rendered by the article's RSC `page.tsx` and passed in as
 * `codeSlots`, keyed by variant id.
 */
type Props = {
  /** One pre-rendered Shiki block per variant. */
  codeSlots: Record<Variant["id"], React.ReactNode>;
};

export function PredictTheOutput({ codeSlots }: Props) {
  const [variantId, setVariantId] = useState<Variant["id"]>("alpha");
  // Caption-state mirror — driven by Quiz.onAnswered. Resets on variant
  // change (the Quiz remounts via `key={variantId}`, so it self-resets).
  const [answered, setAnswered] = useState<null | { correct: boolean }>(null);
  const variant = VARIANTS.find((v) => v.id === variantId)!;

  function selectVariant(id: Variant["id"]) {
    if (id !== variantId) playSound("Toggle-On");
    setVariantId(id);
    setAnswered(null);
  }

  return (
    <WidgetShell
      title="predict the output"
      measurements={variant.label}
      caption={
        answered ? (
          <>
            <CaptionCue>Revealed.</CaptionCue> {variant.revealNote}
          </>
        ) : (
          <>
            <CaptionCue>Predict.</CaptionCue> Tap the ordering you think the
            runtime will produce. {variant.blurb}
          </>
        )
      }
      captionTone="prominent"
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

        {codeSlots[variantId]}

        {/* The shared Quiz wrapper. Keyed by variantId so swapping variant
            cleanly remounts the wrapper (= resets shuffle / chosen / revealed
            in one go). The verdict slot renders the queue-source-annotated
            reveal strip — same data the bespoke implementation rendered. */}
        <Quiz
          key={variantId}
          question={null}
          options={variant.options.map((opt) => ({
            id: opt.id,
            label: (
              <span
                className="font-mono"
                style={{
                  fontSize: 12,
                  letterSpacing: "0.02em",
                }}
              >
                {tokensToLine(opt.tokens)}
              </span>
            ),
          }))}
          correctId={variant.correctId}
          onAnswered={(correct) => setAnswered({ correct })}
          rightVerdict={<RevealStrip reveal={variant.reveal} />}
          wrongVerdict={<RevealStrip reveal={variant.reveal} />}
          randomize
        />
      </div>
    </WidgetShell>
  );
}
