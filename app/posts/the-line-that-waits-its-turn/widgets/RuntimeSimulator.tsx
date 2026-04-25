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
 * The scripted program is hand-authored as 10 tick states. Each tick is a
 * complete snapshot of the runtime — stack frames, web-API timers, queue
 * contents, the output strip, and a one-sentence caption. No live execution.
 * The program being simulated:
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

/* ---------------------------------------------------------------------------
 * The simulated source. Constant — only the active-line highlight changes.
 * --------------------------------------------------------------------------*/
const PROGRAM = [
  `console.log("A");`,
  `setTimeout(() => console.log("B"), 0);`,
  `Promise.resolve().then(() => console.log("C"));`,
  `console.log("D");`,
];

/* ---------------------------------------------------------------------------
 * Canvas — fixed 360 × 320 SVG. Five reserved zones:
 *   1. program (top-left)              x=0  y=0   w=200 h=120
 *   2. call stack (top-right)          x=212 y=0   w=148 h=120
 *   3. web APIs (mid)                  x=0  y=132  w=360 h=44
 *   4. microtask queue (bottom-upper)  x=0  y=184  w=360 h=44
 *   5. task queue (bottom-mid)         x=0  y=232  w=360 h=44
 *   6. output strip (bottom)           x=0  y=284  w=360 h=36
 * Every zone is fixed-size with reserved rows so the frame never reflows.
 * --------------------------------------------------------------------------*/

const QUEUE_SLOT_W = 70;
const QUEUE_SLOT_H = 26;
const QUEUE_GAP = 8;

function QueueRow({
  label,
  items,
  y,
  filled,
}: {
  label: string;
  items: string[];
  y: number;
  /** Filled (terracotta) chip vs outlined chip. */
  filled: boolean;
}) {
  return (
    <g>
      <text
        x={0}
        y={y - 6}
        fontFamily="var(--font-sans)"
        fontSize={11}
        fill="var(--color-text-muted)"
      >
        {label}
      </text>
      {/* Reserved row outline so empty rows don't collapse. */}
      <rect
        x={0}
        y={y}
        width={360}
        height={QUEUE_SLOT_H + 4}
        rx={3}
        ry={3}
        fill="transparent"
        stroke="var(--color-rule)"
        strokeDasharray="2 3"
        strokeOpacity={0.5}
      />
      <AnimatePresence initial={false}>
        {items.map((label, i) => (
          <motion.g
            key={`${label}-${i}`}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={SPRING.snappy}
          >
            <rect
              x={6 + i * (QUEUE_SLOT_W + QUEUE_GAP)}
              y={y + 2}
              width={QUEUE_SLOT_W}
              height={QUEUE_SLOT_H}
              rx={3}
              ry={3}
              fill={filled ? "var(--color-accent)" : "transparent"}
              stroke={filled ? "transparent" : "var(--color-accent)"}
              strokeWidth={1.5}
            />
            <text
              x={6 + i * (QUEUE_SLOT_W + QUEUE_GAP) + QUEUE_SLOT_W / 2}
              y={y + 2 + QUEUE_SLOT_H / 2 + 1}
              dominantBaseline="central"
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize={11}
              fill={filled ? "var(--color-bg)" : "var(--color-accent)"}
            >
              {label}
            </text>
          </motion.g>
        ))}
      </AnimatePresence>
    </g>
  );
}

function StackZone({ frames }: { frames: string[] }) {
  // Stack grows upward — newest frame on top. Reserve 4 slots so the zone
  // never reflows.
  const SLOT_H = 24;
  const GAP = 4;
  const ZONE_X = 212;
  const ZONE_Y = 0;
  const ZONE_W = 148;
  const ZONE_H = 120;
  const reserved = 4;
  return (
    <g>
      <text
        x={ZONE_X}
        y={ZONE_Y - 6}
        fontFamily="var(--font-sans)"
        fontSize={11}
        fill="var(--color-text-muted)"
      >
        call stack
      </text>
      <rect
        x={ZONE_X}
        y={ZONE_Y}
        width={ZONE_W}
        height={ZONE_H}
        rx={3}
        ry={3}
        fill="transparent"
        stroke="var(--color-rule)"
        strokeDasharray="2 3"
        strokeOpacity={0.5}
      />
      {/* Reserved slot outlines (faint) */}
      {Array.from({ length: reserved }).map((_, i) => (
        <rect
          key={`slot-${i}`}
          x={ZONE_X + 6}
          y={ZONE_Y + ZONE_H - 6 - (i + 1) * SLOT_H - i * GAP}
          width={ZONE_W - 12}
          height={SLOT_H}
          rx={2}
          ry={2}
          fill="transparent"
          stroke="var(--color-rule)"
          strokeOpacity={0.25}
        />
      ))}
      <AnimatePresence initial={false}>
        {frames.map((frame, i) => (
          <motion.g
            key={`${frame}-${i}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={SPRING.snappy}
          >
            <rect
              x={ZONE_X + 6}
              y={ZONE_Y + ZONE_H - 6 - (i + 1) * SLOT_H - i * GAP}
              width={ZONE_W - 12}
              height={SLOT_H}
              rx={2}
              ry={2}
              fill="color-mix(in oklab, var(--color-accent) 14%, transparent)"
              stroke="var(--color-accent)"
              strokeWidth={1}
            />
            <text
              x={ZONE_X + ZONE_W / 2}
              y={ZONE_Y + ZONE_H - 6 - (i + 1) * SLOT_H - i * GAP + SLOT_H / 2 + 1}
              dominantBaseline="central"
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize={11}
              fill="var(--color-text)"
            >
              {frame}
            </text>
          </motion.g>
        ))}
      </AnimatePresence>
    </g>
  );
}

function ProgramZone({ activeLine }: { activeLine: number | null }) {
  const ZONE_X = 0;
  const ZONE_Y = 0;
  const ZONE_W = 200;
  const ZONE_H = 120;
  const LINE_H = 22;
  return (
    <g>
      <text
        x={ZONE_X}
        y={ZONE_Y - 6}
        fontFamily="var(--font-sans)"
        fontSize={11}
        fill="var(--color-text-muted)"
      >
        program
      </text>
      <rect
        x={ZONE_X}
        y={ZONE_Y}
        width={ZONE_W}
        height={ZONE_H}
        rx={3}
        ry={3}
        fill="transparent"
        stroke="var(--color-rule)"
        strokeDasharray="2 3"
        strokeOpacity={0.5}
      />
      {PROGRAM.map((line, i) => {
        const isActive = activeLine === i + 1;
        return (
          <g key={i}>
            {isActive ? (
              <motion.rect
                x={ZONE_X + 4}
                y={ZONE_Y + 8 + i * LINE_H - 2}
                width={ZONE_W - 8}
                height={LINE_H - 2}
                rx={2}
                ry={2}
                initial={false}
                animate={{
                  fill: "color-mix(in oklab, var(--color-accent) 14%, transparent)",
                }}
                transition={SPRING.snappy}
              />
            ) : null}
            <text
              x={ZONE_X + 8}
              y={ZONE_Y + 8 + i * LINE_H + LINE_H / 2}
              dominantBaseline="central"
              fontFamily="var(--font-mono)"
              fontSize={10}
              fill={
                isActive ? "var(--color-text)" : "var(--color-text-muted)"
              }
            >
              {line}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function WebApiRow({ items }: { items: string[] }) {
  const Y = 132;
  return (
    <g>
      <text
        x={0}
        y={Y - 6}
        fontFamily="var(--font-sans)"
        fontSize={11}
        fill="var(--color-text-muted)"
      >
        web APIs (outside JS)
      </text>
      <rect
        x={0}
        y={Y}
        width={360}
        height={36}
        rx={3}
        ry={3}
        fill="transparent"
        stroke="var(--color-rule)"
        strokeDasharray="2 3"
        strokeOpacity={0.5}
      />
      <AnimatePresence initial={false}>
        {items.map((label, i) => (
          <motion.g
            key={`${label}-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={SPRING.snappy}
          >
            <rect
              x={8 + i * 140}
              y={Y + 6}
              width={132}
              height={24}
              rx={2}
              ry={2}
              fill="transparent"
              stroke="var(--color-text-muted)"
              strokeWidth={1}
              strokeDasharray="3 2"
            />
            <text
              x={8 + i * 140 + 66}
              y={Y + 6 + 12 + 1}
              dominantBaseline="central"
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize={11}
              fill="var(--color-text-muted)"
            >
              {label}
            </text>
          </motion.g>
        ))}
      </AnimatePresence>
    </g>
  );
}

function OutputStrip({ output }: { output: string[] }) {
  const Y = 284;
  return (
    <g>
      <text
        x={0}
        y={Y - 6}
        fontFamily="var(--font-sans)"
        fontSize={11}
        fill="var(--color-text-muted)"
      >
        output
      </text>
      <rect
        x={0}
        y={Y}
        width={360}
        height={36}
        rx={3}
        ry={3}
        fill="color-mix(in oklab, var(--color-surface) 60%, transparent)"
        stroke="var(--color-rule)"
        strokeOpacity={0.4}
      />
      {output.map((letter, i) => (
        <motion.text
          key={`${letter}-${i}`}
          x={16 + i * 28}
          y={Y + 18 + 1}
          dominantBaseline="central"
          fontFamily="var(--font-mono)"
          fontSize={16}
          fill="var(--color-accent)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={SPRING.snappy}
        >
          {letter}
        </motion.text>
      ))}
      {output.length > 1 ? (
        // separator dots between letters — pure decoration of the cumulative log
        output.slice(0, -1).map((_, i) => (
          <text
            key={`sep-${i}`}
            x={16 + i * 28 + 16}
            y={Y + 18 + 1}
            dominantBaseline="central"
            fontFamily="var(--font-mono)"
            fontSize={14}
            fill="var(--color-text-muted)"
            opacity={0.6}
          >
            ·
          </text>
        ))
      ) : null}
    </g>
  );
}

function Canvas({ tick }: { tick: Tick }) {
  return (
    <svg
      viewBox="0 0 360 320"
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      style={{
        display: "block",
        margin: "0 auto",
        maxWidth: 480,
      }}
      role="img"
      aria-label="JavaScript runtime simulator: program, call stack, Web APIs, microtask queue, task queue, and output."
    >
      <ProgramZone activeLine={tick.activeLine} />
      <StackZone frames={tick.stack} />
      <WebApiRow items={tick.webApi} />
      <QueueRow label="microtask queue" items={tick.micro} y={196} filled />
      <QueueRow label="task queue" items={tick.task} y={244} filled={false} />
      <OutputStrip output={tick.output} />
    </svg>
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
 * Frame stability (R6): SVG is fixed 360×320 with reserved zones for every
 * row. Empty queues keep their dashed outline so nothing reflows.
 */
export function RuntimeSimulator() {
  const [step, setStep] = useState(0);
  const tick = TICKS[step];

  return (
    <WidgetShell
      title="runtime · scripted stepper"
      measurements={`tick ${step} / ${TICKS.length - 1}`}
      caption={tick.caption}
      captionTone="prominent"
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
    >
      <MemoCanvas tick={tick} />
    </WidgetShell>
  );
}
