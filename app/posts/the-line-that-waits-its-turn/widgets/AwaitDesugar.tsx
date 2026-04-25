"use client";

import { memo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { WidgetNav } from "@/components/viz/WidgetNav";
import { TextHighlighter } from "@/components/fancy";
import { SPRING } from "@/lib/motion";
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
 * Two equivalent code panes. The async/await form on the left, the .then
 * form on the right. The 4-step scrubber walks both in lock-step. Step 2 is
 * the load-bearing tick: both panes annotate "→ microtask queue"
 * simultaneously.
 * --------------------------------------------------------------------------*/

const ASYNC_LINES = [
  `async function f() {`,
  `  console.log("1");`,
  `  await Promise.resolve();`,
  `  console.log("2");`,
  `}`,
  `f();`,
];

const THEN_LINES = [
  `function f() {`,
  `  console.log("1");`,
  `  return Promise.resolve()`,
  `    .then(() => {`,
  `      console.log("2");`,
  `    });`,
  `}`,
  `f();`,
];

type Step = {
  /** 0-indexed lines highlighted on the async pane. */
  asyncActive: number[];
  /** 0-indexed lines highlighted on the .then pane. */
  thenActive: number[];
  /** Annotation chip beside async pane (or null). */
  asyncChip: string | null;
  /** Annotation chip beside .then pane (or null). */
  thenChip: string | null;
  /** Caption text for this tick. */
  caption: React.ReactNode;
};

const STEPS: Step[] = [
  {
    asyncActive: [1],
    thenActive: [1],
    asyncChip: "running",
    thenChip: "running",
    caption: (
      <>
        <CaptionCue>Tick 1.</CaptionCue> Both panes call{" "}
        <code className="font-mono">console.log(&quot;1&quot;)</code> synchronously
        inside the function body.
      </>
    ),
  },
  {
    asyncActive: [2],
    thenActive: [2, 3, 4, 5],
    asyncChip: "→ microtask queue",
    thenChip: "→ microtask queue",
    caption: (
      <>
        <CaptionCue>Tick 2 — the load-bearing one.</CaptionCue> On the left,{" "}
        <code className="font-mono">await</code> suspends the function. On the
        right, the explicit <code className="font-mono">.then</code> attaches
        its callback. <strong>Both lines park their continuation in the same
        microtask queue.</strong>
      </>
    ),
  },
  {
    asyncActive: [],
    thenActive: [],
    asyncChip: "queued",
    thenChip: "queued",
    caption: (
      <>
        <CaptionCue>Tick 3.</CaptionCue> The function frame pops. Stack empty
        → the loop reaches into the microtask queue and pulls the
        continuation back out.
      </>
    ),
  },
  {
    asyncActive: [3],
    thenActive: [4],
    asyncChip: "running (continuation)",
    thenChip: "running (callback)",
    caption: (
      <>
        <CaptionCue>Tick 4.</CaptionCue> Both panes log{" "}
        <code className="font-mono">&quot;2&quot;</code>. The continuation
        and the <code className="font-mono">.then</code> callback are the
        same kind of work — they ran on the same trip through the loop.
      </>
    ),
  },
];

function CodePane({
  title,
  lines,
  active,
  chip,
}: {
  title: string;
  lines: string[];
  active: number[];
  chip: string | null;
}) {
  const LINE_H = 22;
  const PADDING = 12;
  // Reserve the longest pane height so the card never grows. Both panes are
  // capped to 8 lines of reserved height; the .then form is the longer one
  // (8 lines) so we use that as the canonical reservation.
  const reservedLines = Math.max(ASYNC_LINES.length, THEN_LINES.length);
  const minH = reservedLines * LINE_H + PADDING * 2;
  return (
    <div className="flex flex-col gap-[var(--spacing-2xs)]">
      <div
        className="flex items-center justify-between"
        style={{
          fontSize: "var(--text-ui)",
          color: "var(--color-text-muted)",
        }}
      >
        <span className="font-sans">{title}</span>
        <AnimatePresence mode="wait" initial={false}>
          {chip ? (
            <motion.span
              key={chip}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={SPRING.snappy}
              className="font-mono"
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 3,
                background:
                  chip.includes("microtask")
                    ? "var(--color-accent)"
                    : "transparent",
                color:
                  chip.includes("microtask")
                    ? "var(--color-bg)"
                    : "var(--color-text-muted)",
                border:
                  chip.includes("microtask")
                    ? "none"
                    : "1px solid var(--color-rule)",
              }}
            >
              {chip}
            </motion.span>
          ) : (
            <span style={{ visibility: "hidden", fontSize: 11 }}>·</span>
          )}
        </AnimatePresence>
      </div>
      <div
        className="relative font-mono"
        style={{
          background:
            "color-mix(in oklab, var(--color-surface) 60%, transparent)",
          padding: PADDING,
          borderRadius: "var(--radius-sm)",
          minHeight: minH,
          fontSize: 12,
          lineHeight: `${LINE_H}px`,
          color: "var(--color-text)",
        }}
      >
        {lines.map((line, i) => {
          const isActive = active.includes(i);
          return (
            <div
              key={i}
              style={{
                position: "relative",
                paddingLeft: 4,
              }}
            >
              {isActive ? (
                <motion.span
                  layoutId={undefined}
                  initial={false}
                  animate={{ opacity: 1 }}
                  transition={SPRING.snappy}
                  style={{
                    position: "absolute",
                    inset: `0 -6px 0 -6px`,
                    background:
                      "color-mix(in oklab, var(--color-accent) 14%, transparent)",
                    borderLeft: `2px solid var(--color-accent)`,
                    borderRadius: 2,
                    pointerEvents: "none",
                  }}
                />
              ) : null}
              <span
                style={{
                  position: "relative",
                  color: isActive
                    ? "var(--color-text)"
                    : "var(--color-text-muted)",
                  whiteSpace: "pre",
                }}
              >
                {line || " "}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const MemoCodePane = memo(CodePane);

/**
 * AwaitDesugar (W3) — two synchronised code panes show that{" "}
 * `async/await` and `.then` produce the same scheduling. Step 2 — both
 * panes annotate "→ microtask queue" simultaneously — is the load-bearing
 * tick.
 *
 * One verb: step (via WidgetNav).
 *
 * Frame stability (R6): both panes have a fixed `min-height` set to the
 * longest variant. Line highlight is an absolutely-positioned overlay;
 * nothing reflows.
 */
export function AwaitDesugar() {
  const [step, setStep] = useState(0);
  const tick = STEPS[step];

  return (
    <WidgetShell
      title="await · the .then in disguise"
      measurements={`tick ${step + 1} / ${STEPS.length}`}
      caption={tick.caption}
      captionTone="prominent"
      controls={
        <div className="flex items-center justify-center w-full">
          <WidgetNav
            value={step}
            total={STEPS.length}
            onChange={setStep}
            counterNoun="tick"
          />
        </div>
      }
    >
      <div
        className="grid gap-[var(--spacing-md)]"
        style={{
          gridTemplateColumns: "1fr",
        }}
      >
        <div
          className="grid gap-[var(--spacing-md)]"
          style={{
            gridTemplateColumns: "minmax(0, 1fr)",
          }}
        >
          <div className="bs-await-grid">
            <MemoCodePane
              title="async/await form"
              lines={ASYNC_LINES}
              active={tick.asyncActive}
              chip={tick.asyncChip}
            />
            <MemoCodePane
              title=".then form (equivalent)"
              lines={THEN_LINES}
              active={tick.thenActive}
              chip={tick.thenChip}
            />
          </div>
          <style>{`
            .bs-await-grid {
              display: grid;
              grid-template-columns: 1fr;
              gap: var(--spacing-md);
            }
            @media (min-width: 640px) {
              .bs-await-grid {
                grid-template-columns: 1fr 1fr;
              }
            }
          `}</style>
        </div>
      </div>
    </WidgetShell>
  );
}
