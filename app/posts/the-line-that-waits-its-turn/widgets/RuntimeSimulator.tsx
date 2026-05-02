"use client";

import { memo, useId, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
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
 * The simulated program.
 *
 *    console.log("A");
 *    setTimeout(() => console.log("B"), 0);
 *    Promise.resolve().then(() => console.log("C"));
 *    console.log("D");
 *
 * Output: A · D · C · B
 * --------------------------------------------------------------------------*/

type Tick = {
  /** Frames currently on the call stack, top last. */
  stack: string[];
  /** Web-API slots currently holding work. */
  webApi: string[];
  /** Microtask queue, head first. */
  micro: string[];
  /** Task (macrotask) queue, head first. */
  task: string[];
  /** Letters logged so far. */
  output: string[];
  /** Which line of the program is "executing" (1-indexed) — null when stack is empty. */
  activeLine: number | null;
  /** Caption for this tick. */
  caption: React.ReactNode;
};

const TICKS: Tick[] = [
  {
    stack: ["main"],
    webApi: [],
    micro: [],
    task: [],
    output: [],
    activeLine: null,
    caption: (
      <>
        <CaptionCue>Tick 0.</CaptionCue> The script starts. The{" "}
        <strong>main</strong> frame is on the call stack — every line of the
        program runs inside it. The two queues and the Web-API row are empty.
      </>
    ),
  },
  {
    stack: ["main", "console.log"],
    webApi: [],
    micro: [],
    task: [],
    output: ["A"],
    activeLine: 1,
    caption: (
      <>
        <CaptionCue>Tick 1.</CaptionCue> Line 1 runs synchronously inside the
        main frame. Output:{" "}
        <code className="font-mono">A</code>.
      </>
    ),
  },
  {
    stack: ["main"],
    webApi: ["timer 0 ms → B"],
    micro: [],
    task: [],
    output: ["A"],
    activeLine: 2,
    caption: (
      <>
        <CaptionCue>Tick 2.</CaptionCue> Line 2 calls{" "}
        <code className="font-mono">setTimeout(…, 0)</code>. The browser parks
        the timer in its <strong>Web APIs</strong> — outside JavaScript — and
        returns immediately. Nothing has been queued yet.
      </>
    ),
  },
  {
    stack: ["main"],
    webApi: ["timer 0 ms → B"],
    micro: ["thenC"],
    task: [],
    output: ["A"],
    activeLine: 3,
    caption: (
      <>
        <CaptionCue>Tick 3.</CaptionCue> Line 3 resolves a Promise and attaches{" "}
        <code className="font-mono">.then(C)</code>. The continuation lands{" "}
        directly in the <strong>microtask queue</strong> — no Web-API detour.
      </>
    ),
  },
  {
    stack: ["main", "console.log"],
    webApi: ["timer 0 ms → B"],
    micro: ["thenC"],
    task: [],
    output: ["A", "D"],
    activeLine: 4,
    caption: (
      <>
        <CaptionCue>Tick 4.</CaptionCue> Line 4 runs. Output:{" "}
        <code className="font-mono">A · D</code>. The script reached the end{" "}
        of <code className="font-mono">main</code> with two pieces of work
        still parked outside it.
      </>
    ),
  },
  {
    stack: [],
    webApi: ["timer fires → B"],
    micro: ["thenC"],
    task: [],
    output: ["A", "D"],
    activeLine: null,
    caption: (
      <>
        <CaptionCue>Tick 5.</CaptionCue> The <strong>main</strong> frame pops.
        The stack is empty. The 0 ms timer has elapsed; its callback is about
        to land in the task queue.
      </>
    ),
  },
  {
    stack: [],
    webApi: [],
    micro: ["thenC"],
    task: ["timerB"],
    output: ["A", "D"],
    activeLine: null,
    caption: (
      <>
        <CaptionCue>Tick 6.</CaptionCue> The timer callback enters the{" "}
        <strong>task queue</strong>. Both queues now hold one item — and the{" "}
        timer was scheduled <em>first</em>.
      </>
    ),
  },
  {
    stack: ["thenC"],
    webApi: [],
    micro: [],
    task: ["timerB"],
    output: ["A", "D", "C"],
    activeLine: null,
    caption: (
      <>
        <CaptionCue>Tick 7.</CaptionCue> Stack empty → the loop drains the{" "}
        <strong>microtask queue first</strong>. <code className="font-mono">thenC</code>{" "}
        runs and logs <code className="font-mono">C</code> — even though{" "}
        <code className="font-mono">timerB</code> was scheduled earlier.
      </>
    ),
  },
  {
    stack: ["timerB"],
    webApi: [],
    micro: [],
    task: [],
    output: ["A", "D", "C", "B"],
    activeLine: null,
    caption: (
      <>
        <CaptionCue>Tick 8.</CaptionCue> Microtask queue drained. Now the loop
        runs <em>one</em> task. <code className="font-mono">timerB</code> logs{" "}
        <code className="font-mono">B</code>.
      </>
    ),
  },
  {
    stack: [],
    webApi: [],
    micro: [],
    task: [],
    output: ["A", "D", "C", "B"],
    activeLine: null,
    caption: (
      <>
        <CaptionCue>Tick 9.</CaptionCue> Both queues empty. Final output:{" "}
        <code className="font-mono">A · D · C · B</code>. The microtask jumped{" "}
        the line.
      </>
    ),
  },
];

const PROGRAM = [
  `console.log("A");`,
  `setTimeout(() => console.log("B"), 0);`,
  `Promise.resolve().then(() => console.log("C"));`,
  `console.log("D");`,
];

/* ---------------------------------------------------------------------------
 * Mobile-first redesign. Six stacked HTML zones (single column on <lg) — no
 * SVG overlay, no overlapping panes. At lg+ the program + call stack pair
 * sit side-by-side, with the Web-APIs / queues / output rows underneath.
 *
 * Every zone has a fixed `min-height` so the frame is invariant across
 * ticks (R6).
 * --------------------------------------------------------------------------*/

function ProgramPane({ activeLine }: { activeLine: number | null }) {
  // Stable per-instance layoutId so the highlight glides between lines
  // instead of remount-fading on every step.
  const markerId = useId();
  return (
    <div className="flex flex-col gap-[var(--spacing-2xs)]">
      <div
        className="font-sans"
        style={{
          fontSize: 11,
          color: "var(--color-text-muted)",
          letterSpacing: "0.02em",
        }}
      >
        program
      </div>
      <div
        className="font-mono"
        style={{
          background: "color-mix(in oklab, var(--color-surface) 60%, transparent)",
          border: "1px solid var(--color-rule)",
          borderRadius: "var(--radius-sm)",
          padding: "10px 12px",
          fontSize: 12,
          lineHeight: "22px",
          // Reserve space for 4 lines.
          minHeight: 4 * 22 + 20,
          overflowX: "auto",
          whiteSpace: "pre",
        }}
      >
        <LayoutGroup id={markerId}>
          {PROGRAM.map((line, i) => {
            const isActive = activeLine === i + 1;
            return (
              <motion.div
                key={i}
                style={{
                  position: "relative",
                  paddingLeft: 4,
                }}
                animate={{
                  color: isActive
                    ? "var(--color-text)"
                    : "var(--color-text-muted)",
                }}
                transition={SPRING.smooth}
              >
                {isActive ? (
                  <motion.span
                    layoutId={`pc-${markerId}`}
                    aria-hidden
                    transition={SPRING.smooth}
                    style={{
                      position: "absolute",
                      inset: "0 -8px 0 -8px",
                      background:
                        "color-mix(in oklab, var(--color-accent) 14%, transparent)",
                      borderRadius: 2,
                      pointerEvents: "none",
                    }}
                  />
                ) : null}
                <span style={{ position: "relative" }}>{line}</span>
              </motion.div>
            );
          })}
        </LayoutGroup>
      </div>
    </div>
  );
}

function StackPane({ frames }: { frames: string[] }) {
  // Reserve 4 slots so the column never reflows.
  const reserved = 4;
  const SLOT_H = 26;
  return (
    <div className="flex flex-col gap-[var(--spacing-2xs)]">
      <div
        className="font-sans"
        style={{
          fontSize: 11,
          color: "var(--color-text-muted)",
          letterSpacing: "0.02em",
        }}
      >
        call stack
      </div>
      <div
        style={{
          position: "relative",
          background: "color-mix(in oklab, var(--color-surface) 60%, transparent)",
          border: "1px solid var(--color-rule)",
          borderRadius: "var(--radius-sm)",
          padding: 8,
          minHeight: reserved * (SLOT_H + 4) + 16,
          display: "flex",
          flexDirection: "column-reverse",
          gap: 4,
        }}
      >
        <AnimatePresence initial={false}>
          {frames.map((frame, i) => (
            <motion.div
              key={`${frame}-${i}`}
              layout
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={SPRING.smooth}
              className="font-mono"
              style={{
                height: SLOT_H,
                lineHeight: `${SLOT_H}px`,
                textAlign: "center",
                fontSize: 12,
                color: "var(--color-text)",
                background: "color-mix(in oklab, var(--color-accent) 14%, transparent)",
                border: "1px solid var(--color-accent)",
                borderRadius: 3,
              }}
            >
              {frame}
            </motion.div>
          ))}
        </AnimatePresence>
        {/* Faint reserved-slot guides (drawn first, behind frames). */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 8,
            display: "flex",
            flexDirection: "column-reverse",
            gap: 4,
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          {Array.from({ length: reserved }).map((_, i) => (
            <div
              key={i}
              style={{
                height: SLOT_H,
                border: "1px dashed var(--color-rule)",
                borderRadius: 3,
                opacity: 0.4,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function WebApiPane({ items }: { items: string[] }) {
  return (
    <div className="flex flex-col gap-[var(--spacing-2xs)]">
      <div
        className="font-sans"
        style={{
          fontSize: 11,
          color: "var(--color-text-muted)",
          letterSpacing: "0.02em",
        }}
      >
        web APIs (outside JS)
      </div>
      <div
        style={{
          border: "1px dashed var(--color-rule)",
          borderRadius: "var(--radius-sm)",
          padding: 8,
          minHeight: 44,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
        }}
      >
        <AnimatePresence initial={false}>
          {items.length === 0 ? (
            <motion.span
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-sans"
              style={{
                fontSize: 11,
                color: "var(--color-text-muted)",
                opacity: 0.6,
                fontStyle: "italic",
              }}
            >
              empty
            </motion.span>
          ) : (
            items.map((label, i) => (
              <motion.span
                key={`${label}-${i}`}
                layout
                initial={{ opacity: 0, scale: 0.85, x: -6 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={SPRING.smooth}
                className="font-mono"
                style={{
                  padding: "4px 10px",
                  fontSize: 11,
                  border: "1px dashed var(--color-text-muted)",
                  borderRadius: 3,
                  color: "var(--color-text-muted)",
                }}
              >
                {label}
              </motion.span>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function QueuePane({
  label,
  items,
  filled,
}: {
  label: string;
  items: string[];
  filled: boolean;
}) {
  return (
    <div className="flex flex-col gap-[var(--spacing-2xs)]">
      <div
        className="font-sans"
        style={{
          fontSize: 11,
          color: "var(--color-text-muted)",
          letterSpacing: "0.02em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          border: "1px dashed var(--color-rule)",
          borderRadius: "var(--radius-sm)",
          padding: 8,
          minHeight: 44,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
        }}
      >
        <AnimatePresence initial={false}>
          {items.length === 0 ? (
            <motion.span
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-sans"
              style={{
                fontSize: 11,
                color: "var(--color-text-muted)",
                opacity: 0.6,
                fontStyle: "italic",
              }}
            >
              empty
            </motion.span>
          ) : (
            items.map((slot, i) => (
              <motion.span
                key={`${slot}-${i}`}
                layout
                initial={{ opacity: 0, scale: 0.85, x: -6 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={SPRING.smooth}
                className="font-mono"
                style={{
                  padding: "4px 12px",
                  fontSize: 12,
                  borderRadius: 3,
                  background: filled ? "var(--color-accent)" : "transparent",
                  color: filled ? "var(--color-bg)" : "var(--color-accent)",
                  border: filled ? "none" : "1.5px solid var(--color-accent)",
                }}
              >
                {slot}
              </motion.span>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function OutputPane({ output }: { output: string[] }) {
  return (
    <div className="flex flex-col gap-[var(--spacing-2xs)]">
      <div
        className="font-sans"
        style={{
          fontSize: 11,
          color: "var(--color-text-muted)",
          letterSpacing: "0.02em",
        }}
      >
        output
      </div>
      <div
        style={{
          background: "color-mix(in oklab, var(--color-surface) 60%, transparent)",
          border: "1px solid var(--color-rule)",
          borderRadius: "var(--radius-sm)",
          padding: "8px 12px",
          minHeight: 40,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <AnimatePresence initial={false}>
          {output.length === 0 ? (
            <motion.span
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-sans"
              style={{
                fontSize: 11,
                color: "var(--color-text-muted)",
                opacity: 0.6,
                fontStyle: "italic",
              }}
            >
              empty
            </motion.span>
          ) : (
            output.flatMap((letter, i) => {
              const elements = [
                <motion.span
                  key={`${letter}-${i}`}
                  layout
                  initial={{ opacity: 0, scale: 0.6, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={SPRING.smooth}
                  className="font-mono"
                  style={{
                    fontSize: 16,
                    color: "var(--color-accent)",
                    fontWeight: 600,
                    minWidth: "1ch",
                    textAlign: "center",
                  }}
                >
                  {letter}
                </motion.span>,
              ];
              if (i < output.length - 1) {
                elements.push(
                  <span
                    key={`sep-${i}`}
                    aria-hidden
                    className="font-mono"
                    style={{
                      fontSize: 14,
                      color: "var(--color-text-muted)",
                      opacity: 0.6,
                    }}
                  >
                    ·
                  </span>,
                );
              }
              return elements;
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Canvas({ tick }: { tick: Tick }) {
  return (
    <div className="flex flex-col gap-[var(--spacing-md)]">
      {/* Top row: program + call stack. Stacked on mobile, side-by-side on lg. */}
      <div className="bs-runtime-top">
        <ProgramPane activeLine={tick.activeLine} />
        <StackPane frames={tick.stack} />
      </div>
      <WebApiPane items={tick.webApi} />
      <QueuePane label="microtask queue" items={tick.micro} filled />
      <QueuePane label="task queue" items={tick.task} filled={false} />
      <OutputPane output={tick.output} />
      <style>{`
        .bs-runtime-top {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--spacing-md);
        }
        @media (min-width: 720px) {
          .bs-runtime-top {
            grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
}

const MemoCanvas = memo(Canvas);

/**
 * RuntimeSimulator (W1) — the spine widget. Walks 10 ticks of a small
 * program, showing how the call stack, Web APIs, microtask queue, and task
 * queue interleave. The reader sees `A · D · C · B` after tick 7 — the
 * post's first revelation, demonstrated before it's named.
 *
 * One verb: step (via WidgetNav). No play/scrub alongside.
 *
 * Layout: mobile-first. Single column at <720px (program → stack → web-apis
 * → micro queue → task queue → output). At lg+, program and call stack sit
 * side-by-side; the queues + output remain full-width below them. No
 * overlapping panes; every zone has its own fixed min-height (R6).
 */
export function RuntimeSimulator() {
  const [step, setStep] = useState(0);
  const tick = TICKS[step];

  return (
    <WidgetShell
      title="runtime · scripted stepper"
      measurements={`tick ${step + 1} / ${TICKS.length}`}
      state={tick.caption}
      canvas={<MemoCanvas tick={tick} />}
      controls={
        <div className="flex items-center justify-center w-full">
          <WidgetNav
            value={step}
            total={TICKS.length}
            onChange={setStep}
            counterNoun="tick"
          />
        </div>
      }
    />
  );
}
