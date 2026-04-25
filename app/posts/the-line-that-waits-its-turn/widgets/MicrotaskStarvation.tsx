"use client";

import { useCallback, useRef, useState } from "react";
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
 * MicrotaskStarvation — "Queue Race".
 *
 * State-machine simulation of the event-loop priority rule:
 *   On each tick:  drain ALL microtasks  →  run ONE macrotask  →  repeat.
 *
 * The reader builds the queues by tapping `+ microtask` and `+ macrotask`,
 * then taps `Run` to drain one tick. The console pane records the firing
 * order. A fourth button — `+ self-scheduling micro` — adds a microtask
 * that, when fired, enqueues another microtask (capped at SELF_HOPS to
 * keep the demo finite). With self-scheduling micros pending, the
 * macrotask never gets a turn — that is microtask starvation, made
 * visible without simulating a real freeze.
 *
 * No real Promise / setTimeout recursion. No rAF. Pure state machine.
 * --------------------------------------------------------------------------*/

const SELF_HOPS = 6;
const STARVED_BADGE_AT = 4;
const FIRE_DELAY_MS = 280; // visible per-step pacing for the Run animation
const MAX_CONSOLE_LINES = 12;

type Chip = {
  id: string;
  label: string;
  /** kind === "self" → a micro that schedules another micro when fired. */
  kind: "micro" | "macro" | "self";
  /** Hops remaining before a self-scheduling chip stops re-spawning. */
  hopsLeft?: number;
};

type ConsoleLine = {
  id: string;
  label: string;
  kind: "micro" | "macro";
};

let __id = 0;
const nextId = () => `c${++__id}`;

export function MicrotaskStarvation() {
  const reduce = useReducedMotion();

  const [micro, setMicro] = useState<Chip[]>([]);
  const [macro, setMacro] = useState<Chip[]>([]);
  const [output, setOutput] = useState<ConsoleLine[]>([]);
  const [tick, setTick] = useState(0);
  const [running, setRunning] = useState(false);
  const [starved, setStarved] = useState(false);

  // Counters for label generation. Persist across resets via state, not refs,
  // so the chip labels stay readable.
  const [microSeq, setMicroSeq] = useState(0);
  const [macroSeq, setMacroSeq] = useState(0);

  // Active-chip indicator: which chip is currently "firing" (highlighted).
  const [activeId, setActiveId] = useState<string | null>(null);

  const cancelRef = useRef(false);

  const addMicro = useCallback(() => {
    if (running) return;
    setMicroSeq((n) => {
      const next = n + 1;
      setMicro((q) => [...q, { id: nextId(), label: `m${next}`, kind: "micro" }]);
      return next;
    });
  }, [running]);

  const addSelf = useCallback(() => {
    if (running) return;
    setMicroSeq((n) => {
      const next = n + 1;
      setMicro((q) => [
        ...q,
        {
          id: nextId(),
          label: `m${next}*`,
          kind: "self",
          hopsLeft: SELF_HOPS,
        },
      ]);
      return next;
    });
  }, [running]);

  const addMacro = useCallback(() => {
    if (running) return;
    setMacroSeq((n) => {
      const next = n + 1;
      setMacro((q) => [...q, { id: nextId(), label: `M${next}`, kind: "macro" }]);
      return next;
    });
  }, [running]);

  const reset = useCallback(() => {
    cancelRef.current = true;
    setMicro([]);
    setMacro([]);
    setOutput([]);
    setTick(0);
    setMicroSeq(0);
    setMacroSeq(0);
    setStarved(false);
    setRunning(false);
    setActiveId(null);
  }, []);

  // Read latest queue state via functional setters; UI updates each step.
  const wait = (ms: number) =>
    new Promise<void>((res) => {
      const t = window.setTimeout(res, ms);
      // best-effort cancel: we still resolve, but the run loop checks
      // cancelRef.current to bail.
      void t;
    });

  const fireOneFromQueue = useCallback(
    async (
      kind: "micro" | "macro",
      step: number,
    ): Promise<{ fired: boolean; spawnedSelf: boolean }> => {
      // Snapshot top-of-queue.
      let snapshot: Chip | undefined;
      if (kind === "micro") {
        setMicro((q) => {
          snapshot = q[0];
          return q;
        });
      } else {
        setMacro((q) => {
          snapshot = q[0];
          return q;
        });
      }
      // Allow setMicro/setMacro flush.
      await wait(0);
      if (!snapshot) return { fired: false, spawnedSelf: false };

      // Highlight the head briefly.
      setActiveId(snapshot.id);
      await wait(reduce ? 0 : Math.round(FIRE_DELAY_MS * 0.45));

      // Pop it + write to console + maybe spawn next self-scheduling micro.
      const fired = snapshot;
      let spawnedSelf = false;
      if (kind === "micro") {
        setMicro((q) => q.slice(1));
        setOutput((o) =>
          [
            ...o,
            { id: nextId(), label: fired.label, kind: "micro" as const },
          ].slice(-MAX_CONSOLE_LINES),
        );
        if (fired.kind === "self" && (fired.hopsLeft ?? 0) > 1) {
          const remaining = (fired.hopsLeft ?? 0) - 1;
          spawnedSelf = true;
          setMicro((q) => [
            ...q,
            {
              id: nextId(),
              label: `${fired.label.replace(/\*$/, "")}→${SELF_HOPS - remaining + 1}*`,
              kind: "self",
              hopsLeft: remaining,
            },
          ]);
        }
      } else {
        setMacro((q) => q.slice(1));
        setOutput((o) =>
          [
            ...o,
            { id: nextId(), label: fired.label, kind: "macro" as const },
          ].slice(-MAX_CONSOLE_LINES),
        );
      }

      // Trigger starved badge once we've drained STARVED_BADGE_AT consecutive
      // micros within the same Run with macros pending.
      if (kind === "micro" && step >= STARVED_BADGE_AT) {
        setStarved((prev) => {
          if (prev) return prev;
          // Only mark starved if there ARE macros waiting.
          let hasMacro = false;
          setMacro((q) => {
            hasMacro = q.length > 0;
            return q;
          });
          return hasMacro;
        });
      }

      await wait(reduce ? 0 : Math.round(FIRE_DELAY_MS * 0.55));
      setActiveId(null);
      return { fired: true, spawnedSelf };
    },
    [reduce],
  );

  // Probe current queue lengths via setState callback — guarantees freshest
  // values without subscribing to render cycles.
  const peekMicroLen = () =>
    new Promise<number>((res) => {
      setMicro((q) => {
        res(q.length);
        return q;
      });
    });
  const peekMacroLen = () =>
    new Promise<number>((res) => {
      setMacro((q) => {
        res(q.length);
        return q;
      });
    });

  const run = useCallback(async () => {
    if (running) return;
    cancelRef.current = false;
    setRunning(true);

    // Hard cap on micro-drain steps in a single Run (handles self-scheduling
    // chains). Visually matches "the macrotask never got its turn".
    const MAX_MICRO_STEPS_PER_TICK = 32;

    let microSteps = 0;
    let microLen = await peekMicroLen();
    while (microLen > 0 && microSteps < MAX_MICRO_STEPS_PER_TICK) {
      if (cancelRef.current) break;
      await fireOneFromQueue("micro", microSteps);
      microSteps++;
      microLen = await peekMicroLen();
    }

    // ONE macrotask, only if we drained micros (else: starved).
    if (!cancelRef.current && microSteps < MAX_MICRO_STEPS_PER_TICK) {
      const macLen = await peekMacroLen();
      if (macLen > 0) {
        await fireOneFromQueue("macro", 0);
      }
    }

    setTick((t) => t + 1);
    setRunning(false);
  }, [running, fireOneFromQueue]);

  // Derived
  const outputStr = output.map((o) => o.label).join(" · ") || "—";

  return (
    <WidgetShell
      title="queue race · microtasks vs macrotasks"
      measurements={`tick ${tick} · output ${output.length}`}
      caption={
        starved ? (
          <>
            <CaptionCue>Microtask starvation.</CaptionCue> Each fired microtask
            adds another microtask, so the queue never empties — and the
            macrotask never gets its turn. One runaway Promise chain stalls
            everything else, even though the engine isn&apos;t doing real work.
          </>
        ) : output.length === 0 ? (
          <>
            <CaptionCue>Build the queues, then Run.</CaptionCue> Add a few
            microtasks and a macrotask. Tap <em>Run</em>: the loop drains{" "}
            <em>every</em> microtask first, then runs <em>one</em> macrotask.
            Try <em>+ self-scheduling micro</em> to feel the priority rule
            bite.
          </>
        ) : (
          <>
            <CaptionCue>One tick complete.</CaptionCue> The microtask queue
            drained fully before any macrotask ran. Add more, hit Run again —
            or try a self-scheduling microtask to see what happens when the
            queue refuses to empty.
          </>
        )
      }
      captionTone="prominent"
      controls={
        <div className="flex flex-wrap items-center justify-center gap-[var(--spacing-sm)] w-full">
          <motion.button
            type="button"
            onClick={addMicro}
            disabled={running}
            className="font-sans rounded-[var(--radius-sm)] min-h-[44px]"
            style={{
              padding: "8px 14px",
              fontSize: "var(--text-ui)",
              background: "color-mix(in oklab, var(--color-accent) 14%, transparent)",
              color: "var(--color-accent)",
              border: "1px solid var(--color-accent)",
              opacity: running ? 0.5 : 1,
              cursor: running ? "not-allowed" : "pointer",
            }}
            {...(running ? {} : PRESS)}
          >
            + microtask
          </motion.button>
          <motion.button
            type="button"
            onClick={addMacro}
            disabled={running}
            className="font-sans rounded-[var(--radius-sm)] min-h-[44px]"
            style={{
              padding: "8px 14px",
              fontSize: "var(--text-ui)",
              background: "transparent",
              color: "var(--color-text)",
              border: "1px solid var(--color-rule)",
              opacity: running ? 0.5 : 1,
              cursor: running ? "not-allowed" : "pointer",
            }}
            {...(running ? {} : PRESS)}
          >
            + macrotask
          </motion.button>
          <motion.button
            type="button"
            onClick={addSelf}
            disabled={running}
            className="font-sans rounded-[var(--radius-sm)] min-h-[44px]"
            style={{
              padding: "8px 14px",
              fontSize: "var(--text-ui)",
              background: "color-mix(in oklab, var(--color-accent) 8%, transparent)",
              color: "var(--color-accent)",
              border: "1px dashed var(--color-accent)",
              opacity: running ? 0.5 : 1,
              cursor: running ? "not-allowed" : "pointer",
            }}
            {...(running ? {} : PRESS)}
            aria-label="add a self-scheduling microtask (warning: starves the macrotask queue)"
          >
            + self-scheduling micro
          </motion.button>
          <motion.button
            type="button"
            onClick={run}
            disabled={running || (micro.length === 0 && macro.length === 0)}
            className="font-sans rounded-[var(--radius-md)] min-h-[44px]"
            style={{
              padding: "8px 22px",
              fontSize: "var(--text-ui)",
              background: "var(--color-accent)",
              color: "var(--color-bg)",
              border: "none",
              opacity:
                running || (micro.length === 0 && macro.length === 0) ? 0.5 : 1,
              cursor:
                running || (micro.length === 0 && macro.length === 0)
                  ? "not-allowed"
                  : "pointer",
              fontWeight: 600,
            }}
            {...(running || (micro.length === 0 && macro.length === 0)
              ? {}
              : PRESS)}
          >
            {running ? "running…" : "Run ▸"}
          </motion.button>
          <motion.button
            type="button"
            onClick={reset}
            className="font-sans rounded-[var(--radius-sm)] min-h-[44px]"
            style={{
              padding: "8px 14px",
              fontSize: "var(--text-ui)",
              color: "var(--color-text-muted)",
              background: "transparent",
              border: "1px solid var(--color-rule)",
            }}
            {...PRESS}
          >
            reset
          </motion.button>
        </div>
      }
    >
      <div className="flex flex-col gap-[var(--spacing-md)]">
        <div className="bs-qrace-grid">
          <QueueColumn
            label="microtask queue"
            chips={micro}
            activeId={activeId}
            accent
          />
          <QueueColumn
            label="macrotask queue"
            chips={macro}
            activeId={activeId}
            accent={false}
            badge={starved ? "starved" : null}
          />
        </div>
        <ConsolePane lines={output} />
        <p
          className="font-sans"
          style={{
            fontSize: 12,
            color: "var(--color-text-muted)",
            margin: 0,
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Run = drain <em>all</em> microtasks, then <em>one</em> macrotask, then
          repeat.
        </p>
        <style>{`
          .bs-qrace-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: var(--spacing-md);
          }
          @media (min-width: 640px) {
            .bs-qrace-grid {
              grid-template-columns: 1fr 1fr;
            }
          }
        `}</style>
      </div>
    </WidgetShell>
  );
}

function QueueColumn({
  label,
  chips,
  activeId,
  accent,
  badge,
}: {
  label: string;
  chips: Chip[];
  activeId: string | null;
  accent: boolean;
  badge?: string | null;
}) {
  // Reserve at least 4 chip rows of vertical space (R6 frame stability).
  const RESERVED = 4;
  const ROW_H = 30;
  return (
    <div className="flex flex-col gap-[var(--spacing-2xs)]">
      <div
        className="flex items-center justify-between font-sans"
        style={{ fontSize: 11, color: "var(--color-text-muted)" }}
      >
        <span style={{ letterSpacing: "0.02em" }}>{label}</span>
        <AnimatePresence initial={false}>
          {badge ? (
            <motion.span
              key="badge"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={SPRING.smooth}
              className="font-mono"
              style={{
                fontSize: 10,
                padding: "2px 8px",
                borderRadius: 999,
                color: "var(--color-bg)",
                background: "var(--color-accent)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {badge}
            </motion.span>
          ) : (
            <span
              className="font-mono tabular-nums"
              style={{ fontSize: 11, opacity: 0.7 }}
            >
              {chips.length}
            </span>
          )}
        </AnimatePresence>
      </div>
      <div
        style={{
          border: `1px ${accent ? "solid" : "dashed"} var(--color-rule)`,
          borderRadius: "var(--radius-sm)",
          padding: 8,
          minHeight: RESERVED * (ROW_H + 6) + 16,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          background: accent
            ? "color-mix(in oklab, var(--color-accent) 4%, transparent)"
            : "color-mix(in oklab, var(--color-surface) 30%, transparent)",
          position: "relative",
        }}
      >
        <AnimatePresence initial={false}>
          {chips.length === 0 ? (
            <motion.span
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-sans"
              style={{
                fontSize: 11,
                color: "var(--color-text-muted)",
                opacity: 0.5,
                fontStyle: "italic",
                position: "absolute",
                top: "50%",
                left: 0,
                right: 0,
                textAlign: "center",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            >
              empty
            </motion.span>
          ) : (
            chips.map((c) => {
              const isActive = activeId === c.id;
              return (
                <motion.div
                  key={c.id}
                  layout
                  layoutId={`chip-${c.id}`}
                  initial={{ opacity: 0, scale: 0.8, y: 6 }}
                  animate={{
                    opacity: 1,
                    scale: isActive ? 1.04 : 1,
                    y: 0,
                  }}
                  exit={{ opacity: 0, scale: 0.7, x: 18 }}
                  transition={SPRING.smooth}
                  className="font-mono"
                  style={{
                    height: ROW_H,
                    lineHeight: `${ROW_H}px`,
                    paddingInline: 12,
                    fontSize: 12,
                    borderRadius: 4,
                    background: accent
                      ? isActive
                        ? "var(--color-accent)"
                        : "color-mix(in oklab, var(--color-accent) 12%, transparent)"
                      : isActive
                        ? "color-mix(in oklab, var(--color-text) 14%, transparent)"
                        : "color-mix(in oklab, var(--color-surface) 80%, transparent)",
                    color: accent
                      ? isActive
                        ? "var(--color-bg)"
                        : "var(--color-accent)"
                      : "var(--color-text)",
                    border: `1px ${
                      c.kind === "self" ? "dashed" : "solid"
                    } ${
                      accent ? "var(--color-accent)" : "var(--color-rule)"
                    }`,
                    textAlign: "left",
                  }}
                >
                  {c.label}
                  {c.kind === "self" ? (
                    <span
                      aria-hidden
                      style={{
                        marginLeft: 8,
                        fontSize: 10,
                        opacity: 0.7,
                      }}
                    >
                      ↻
                    </span>
                  ) : null}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ConsolePane({ lines }: { lines: ConsoleLine[] }) {
  const RESERVED_LINES = 4;
  const LINE_H = 22;
  return (
    <div className="flex flex-col gap-[var(--spacing-2xs)]">
      <div
        className="flex items-baseline justify-between font-sans"
        style={{ fontSize: 11, color: "var(--color-text-muted)" }}
      >
        <span style={{ letterSpacing: "0.02em" }}>console · firing order</span>
        <span
          className="font-mono tabular-nums"
          style={{ fontSize: 11, opacity: 0.7 }}
        >
          {lines.length}
        </span>
      </div>
      <div
        style={{
          background: "color-mix(in oklab, var(--color-surface) 60%, transparent)",
          border: "1px solid var(--color-rule)",
          borderRadius: "var(--radius-sm)",
          padding: "8px 12px",
          minHeight: RESERVED_LINES * LINE_H + 16,
          fontSize: 12,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <AnimatePresence initial={false}>
          {lines.length === 0 ? (
            <motion.span
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-sans"
              style={{
                fontSize: 11,
                color: "var(--color-text-muted)",
                opacity: 0.5,
                fontStyle: "italic",
                lineHeight: `${LINE_H}px`,
              }}
            >
              waiting for Run…
            </motion.span>
          ) : (
            lines.map((l, i) => (
              <motion.div
                key={l.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={SPRING.smooth}
                className="font-mono"
                style={{
                  lineHeight: `${LINE_H}px`,
                  color:
                    l.kind === "micro"
                      ? "var(--color-accent)"
                      : "var(--color-text)",
                  whiteSpace: "pre",
                }}
              >
                <span
                  style={{
                    color: "var(--color-text-muted)",
                    marginRight: 8,
                    opacity: 0.7,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  {l.kind === "micro" ? "micro" : "macro"} → {l.label}
                </span>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
