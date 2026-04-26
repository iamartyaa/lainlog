"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
 * MicrotaskStarvation — "Queue Race" v2 (mobile-first, frame-stable).
 *
 * Layout:
 *   - Mobile (< 720 px container): vertical stack, fixed reserved heights for
 *     every region. No horizontal scroll on the shell. Buttons stay one row;
 *     queue chips overflow horizontally inside their own bounded strip.
 *   - lg (≥ 720 px container, via @container query): two columns — queues +
 *     console side-by-side under the controls strip.
 *
 * Frame stability (R6): the outer shell never resizes during interaction.
 * Each region reserves a fixed `min-h-*`; growth happens inside reserved
 * space. Console scrolls internally past 6 lines; queues scroll horizontally
 * past viewport width. Starved badge fades in place — never reflows headers.
 *
 * State machine only — no real Promise / setTimeout recursion. The
 * `+ self-scheduling micro` chip caps at SELF_HOPS hops, then settles, so
 * the demo stays finite even though it teaches an unbounded concept.
 * --------------------------------------------------------------------------*/

const SELF_HOPS = 6;
const STARVED_BADGE_AT = 4;
const FIRE_DELAY_MS = 280;
const MAX_CONSOLE_LINES = 12;
const TOOLTIP_FADE_MS = 6000;

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

  const [microSeq, setMicroSeq] = useState(0);
  const [macroSeq, setMacroSeq] = useState(0);

  const [activeId, setActiveId] = useState<string | null>(null);

  /** First-click mini-tooltip explaining the self-scheduling button. */
  const [selfHintShown, setSelfHintShown] = useState(false);
  const [selfHintVisible, setSelfHintVisible] = useState(false);
  const hintTimerRef = useRef<number | null>(null);

  const cancelRef = useRef(false);

  // Auto-fade the self-scheduling tooltip after TOOLTIP_FADE_MS or once a
  // run starts (whichever comes first).
  useEffect(() => {
    if (!selfHintVisible) return;
    hintTimerRef.current = window.setTimeout(() => {
      setSelfHintVisible(false);
    }, TOOLTIP_FADE_MS);
    return () => {
      if (hintTimerRef.current != null) {
        window.clearTimeout(hintTimerRef.current);
        hintTimerRef.current = null;
      }
    };
  }, [selfHintVisible]);

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
    if (!selfHintShown) {
      setSelfHintShown(true);
      setSelfHintVisible(true);
    }
  }, [running, selfHintShown]);

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
    setSelfHintVisible(false);
  }, []);

  const wait = (ms: number) =>
    new Promise<void>((res) => {
      const t = window.setTimeout(res, ms);
      void t;
    });

  const fireOneFromQueue = useCallback(
    async (
      kind: "micro" | "macro",
      step: number,
    ): Promise<{ fired: boolean; spawnedSelf: boolean }> => {
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
      await wait(0);
      if (!snapshot) return { fired: false, spawnedSelf: false };

      setActiveId(snapshot.id);
      await wait(reduce ? 0 : Math.round(FIRE_DELAY_MS * 0.45));

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

      if (kind === "micro" && step >= STARVED_BADGE_AT) {
        setStarved((prev) => {
          if (prev) return prev;
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
    setSelfHintVisible(false);

    const MAX_MICRO_STEPS_PER_TICK = 32;

    let microSteps = 0;
    let microLen = await peekMicroLen();
    while (microLen > 0 && microSteps < MAX_MICRO_STEPS_PER_TICK) {
      if (cancelRef.current) break;
      await fireOneFromQueue("micro", microSteps);
      microSteps++;
      microLen = await peekMicroLen();
    }

    if (!cancelRef.current && microSteps < MAX_MICRO_STEPS_PER_TICK) {
      const macLen = await peekMacroLen();
      if (macLen > 0) {
        await fireOneFromQueue("macro", 0);
      }
    }

    setTick((t) => t + 1);
    setRunning(false);
  }, [running, fireOneFromQueue]);

  const totalQueued = micro.length + macro.length;
  const canRun = !running && totalQueued > 0;

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
    >
      <div className="bs-qrace">
        {/* Tick counter strip — fixed height, aria-live announces ticks. */}
        <div
          className="bs-qrace-tick font-mono tabular-nums"
          aria-live="polite"
          aria-atomic="true"
        >
          <span style={{ color: "var(--color-text-muted)" }}>tick</span>{" "}
          <span style={{ color: "var(--color-accent)" }}>{tick}</span>
          <span style={{ color: "var(--color-text-muted)", margin: "0 8px" }}>
            ·
          </span>
          <span style={{ color: "var(--color-text-muted)" }}>output</span>{" "}
          <span style={{ color: "var(--color-text)" }}>{output.length}</span>
          {running ? (
            <span
              className="bs-qrace-run"
              aria-hidden
              style={{ marginLeft: 10, color: "var(--color-accent)" }}
            >
              ▸ running
            </span>
          ) : null}
        </div>

        {/* Body grid — single column on mobile, 2 cols at lg. */}
        <div className="bs-qrace-body">
          <div className="bs-qrace-queues">
            <QueueRegion
              label="microtask queue"
              chips={micro}
              activeId={activeId}
              accent
              reservedCount={5}
            />
            <QueueRegion
              label="macrotask queue"
              chips={macro}
              activeId={activeId}
              accent={false}
              reservedCount={2}
              badge={starved ? "starved" : null}
            />
          </div>
          <ConsolePane lines={output} />
        </div>

        {/* Controls strip. Tap targets ≥ 44px; flex-wrap only as last resort
            — at 360 px the row stays single via short labels. */}
        <div
          className="bs-qrace-controls"
          role="group"
          aria-label="Queue controls"
        >
          <CtrlBtn onClick={addMicro} disabled={running} kind="accent">
            <span aria-hidden>+</span>
            <span>micro</span>
          </CtrlBtn>
          <CtrlBtn onClick={addMacro} disabled={running} kind="muted">
            <span aria-hidden>+</span>
            <span>macro</span>
          </CtrlBtn>
          <div className="bs-qrace-self-wrap">
            <CtrlBtn
              onClick={addSelf}
              disabled={running}
              kind="dashed"
              ariaLabel="add a self-scheduling microtask"
            >
              <span aria-hidden>↻</span>
              <span>self-sched</span>
            </CtrlBtn>
            <AnimatePresence>
              {selfHintVisible ? (
                <motion.div
                  key="hint"
                  className="bs-qrace-hint"
                  initial={
                    reduce ? { opacity: 0 } : { opacity: 0, y: -4 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={reduce ? { duration: 0 } : SPRING.smooth}
                  role="note"
                >
                  This microtask schedules another microtask. Hit Run — the
                  queue never empties.
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
          <CtrlBtn
            onClick={run}
            disabled={!canRun}
            kind="primary"
            ariaLabel={running ? "running" : "run one tick"}
          >
            {running ? "running…" : "Run ▸"}
          </CtrlBtn>
          <CtrlBtn onClick={reset} kind="ghost" ariaLabel="reset queues">
            reset
          </CtrlBtn>
        </div>

        <p className="bs-qrace-rule">
          Run = drain <em>all</em> microtasks, then <em>one</em> macrotask, then
          repeat.
        </p>
      </div>

      <style>{`
        .bs-qrace {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }
        .bs-qrace-tick {
          min-height: 24px;
          line-height: 24px;
          font-size: 12px;
          letter-spacing: 0.02em;
          padding: 0 2px;
        }
        .bs-qrace-body {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--spacing-sm);
        }
        .bs-qrace-queues {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }
        .bs-qrace-controls {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px;
          padding-top: 4px;
        }
        .bs-qrace-self-wrap {
          position: relative;
          display: inline-flex;
        }
        .bs-qrace-hint {
          position: absolute;
          left: 0;
          top: calc(100% + 6px);
          z-index: 2;
          width: max-content;
          max-width: 240px;
          padding: 6px 10px;
          font-family: var(--font-sans);
          font-size: 11px;
          line-height: 1.4;
          color: var(--color-text);
          background: var(--color-surface);
          border: 1px solid var(--color-accent);
          border-radius: var(--radius-sm);
        }
        .bs-qrace-hint::before {
          content: "";
          position: absolute;
          top: -5px;
          left: 18px;
          width: 8px;
          height: 8px;
          background: var(--color-surface);
          border-top: 1px solid var(--color-accent);
          border-left: 1px solid var(--color-accent);
          transform: rotate(45deg);
        }
        .bs-qrace-rule {
          font-family: var(--font-sans);
          font-size: 11px;
          color: var(--color-text-muted);
          text-align: center;
          margin: 2px 0 0 0;
          line-height: 1.5;
        }
        @container widget (min-width: 720px) {
          .bs-qrace-body {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          }
        }
      `}</style>
    </WidgetShell>
  );
}

/* ----------------------------------------------------------------------- */
/*  Queue region — fixed reserved height; chips overflow horizontally     */
/*  inside the bounded strip when the queue grows past the viewport.      */
/* ----------------------------------------------------------------------- */

function QueueRegion({
  label,
  chips,
  activeId,
  accent,
  badge,
  reservedCount,
}: {
  label: string;
  chips: Chip[];
  activeId: string | null;
  accent: boolean;
  badge?: string | null;
  /** Used to size the reserved strip on mobile. Microtask gets more height. */
  reservedCount: number;
}) {
  // Reserved heights match the spec: 192 px for micros (5 rows × ~32 + chrome),
  // 96 px for macros (2 rows). Both are min-heights so chips stack inside,
  // never push the surrounding regions.
  const STRIP_H = reservedCount >= 4 ? 168 : 72;
  return (
    <div className="bs-qrace-region">
      <div className="bs-qrace-head">
        <span style={{ color: "var(--color-text-muted)" }}>{label}</span>
        <span className="bs-qrace-head-right">
          <AnimatePresence initial={false}>
            {badge ? (
              <motion.span
                key="badge"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={SPRING.smooth}
                className="bs-qrace-badge font-mono"
                aria-live="polite"
              >
                {badge}
              </motion.span>
            ) : null}
          </AnimatePresence>
          <span
            className="font-mono tabular-nums"
            style={{ color: "var(--color-text-muted)", opacity: 0.8 }}
          >
            {chips.length}
          </span>
        </span>
      </div>
      <div
        className="bs-qrace-strip"
        style={{
          minHeight: STRIP_H,
          borderStyle: accent ? "solid" : "dashed",
          background: accent
            ? "color-mix(in oklab, var(--color-accent) 5%, transparent)"
            : "color-mix(in oklab, var(--color-surface) 30%, transparent)",
        }}
        aria-live="polite"
        aria-label={`${label} (${chips.length} pending)`}
      >
        <AnimatePresence initial={false}>
          {chips.length === 0 ? (
            <motion.span
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bs-qrace-empty font-sans"
            >
              empty
            </motion.span>
          ) : (
            <div className="bs-qrace-chiprow">
              {chips.map((c) => {
                const isActive = activeId === c.id;
                return (
                  <motion.div
                    key={c.id}
                    layout
                    layoutId={`chip-${c.id}`}
                    initial={{ opacity: 0, scale: 0.8, y: 6 }}
                    animate={{
                      opacity: 1,
                      scale: isActive ? 1.06 : 1,
                      y: 0,
                    }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={SPRING.smooth}
                    className="bs-qrace-chip font-mono"
                    style={{
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
                      borderStyle: c.kind === "self" ? "dashed" : "solid",
                      borderColor: accent
                        ? "var(--color-accent)"
                        : "var(--color-rule)",
                    }}
                  >
                    {c.label}
                    {c.kind === "self" ? (
                      <span
                        aria-hidden
                        style={{ marginLeft: 6, fontSize: 10, opacity: 0.7 }}
                      >
                        ↻
                      </span>
                    ) : null}
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .bs-qrace-region {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }
        .bs-qrace-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-family: var(--font-sans);
          font-size: 11px;
          letter-spacing: 0.02em;
          min-height: 16px;
        }
        .bs-qrace-head-right {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .bs-qrace-badge {
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 999px;
          color: var(--color-bg);
          background: var(--color-accent);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .bs-qrace-strip {
          position: relative;
          border: 1px solid var(--color-rule);
          border-radius: var(--radius-sm);
          padding: 8px;
          overflow-x: auto;
          overflow-y: hidden;
          touch-action: pan-x;
          -webkit-overflow-scrolling: touch;
        }
        .bs-qrace-empty {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          color: var(--color-text-muted);
          opacity: 0.5;
          font-style: italic;
          pointer-events: none;
        }
        .bs-qrace-chiprow {
          display: flex;
          flex-wrap: nowrap;
          gap: 6px;
          align-items: center;
          min-height: 40px;
        }
        .bs-qrace-chip {
          flex: 0 0 auto;
          min-width: 56px;
          height: 40px;
          line-height: 40px;
          padding: 0 12px;
          font-size: 12px;
          border-radius: 4px;
          border-width: 1px;
          text-align: center;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/*  Console pane — fixed reserved height; lines past 6 scroll internally  */
/*  so the pane never grows. Caret blinks slowly while idle.              */
/* ----------------------------------------------------------------------- */

function ConsolePane({ lines }: { lines: ConsoleLine[] }) {
  const reduce = useReducedMotion();
  const RESERVED_LINES = 6;
  const LINE_H = 22;
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  // Pin scroll to the bottom as new lines arrive (so the latest is always
  // visible without changing pane height).
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [lines.length]);

  return (
    <div className="bs-qrace-console-region">
      <div className="bs-qrace-console-head">
        <span style={{ color: "var(--color-text-muted)" }}>
          console · firing order
        </span>
        <span
          className="font-mono tabular-nums"
          style={{ color: "var(--color-text-muted)", opacity: 0.8 }}
        >
          {lines.length}
        </span>
      </div>
      <div
        ref={scrollerRef}
        className="bs-qrace-console"
        style={{ minHeight: RESERVED_LINES * LINE_H + 16 }}
        aria-live="polite"
      >
        {lines.length === 0 ? (
          <span className="bs-qrace-console-empty font-sans">
            waiting for Run
            <motion.span
              aria-hidden
              animate={
                reduce
                  ? { opacity: 1 }
                  : { opacity: [0.2, 1, 1, 0.2] }
              }
              transition={
                reduce
                  ? { duration: 0 }
                  : { duration: 1.6, repeat: Infinity, times: [0, 0.4, 0.6, 1] }
              }
              style={{
                marginLeft: 4,
                color: "var(--color-accent)",
                fontFamily: "var(--font-mono)",
              }}
            >
              ▍
            </motion.span>
          </span>
        ) : (
          <AnimatePresence initial={false}>
            {lines.map((l, i) => (
              <motion.div
                key={l.id}
                layout
                initial={
                  reduce
                    ? { opacity: 0 }
                    : { opacity: 0, y: 4 }
                }
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={
                  reduce ? { duration: 0 } : { duration: 0.2 }
                }
                className="bs-qrace-console-line font-mono"
                style={{
                  color:
                    l.kind === "micro"
                      ? "var(--color-accent)"
                      : "var(--color-text)",
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
            ))}
          </AnimatePresence>
        )}
      </div>

      <style>{`
        .bs-qrace-console-region {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }
        .bs-qrace-console-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          font-family: var(--font-sans);
          font-size: 11px;
          letter-spacing: 0.02em;
          min-height: 16px;
        }
        .bs-qrace-console {
          background: color-mix(in oklab, var(--color-surface) 60%, transparent);
          border: 1px solid var(--color-rule);
          border-radius: var(--radius-sm);
          padding: 8px 12px;
          font-size: 12px;
          line-height: 22px;
          overflow-y: auto;
          max-height: 192px;
          -webkit-overflow-scrolling: touch;
        }
        .bs-qrace-console-line {
          white-space: pre;
          line-height: 22px;
        }
        .bs-qrace-console-empty {
          font-size: 11px;
          color: var(--color-text-muted);
          font-style: italic;
          line-height: 22px;
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/*  CtrlBtn — control row button. Tap target ≥ 44 × 44 px.                */
/* ----------------------------------------------------------------------- */

function CtrlBtn({
  children,
  onClick,
  disabled,
  kind,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  kind: "primary" | "accent" | "muted" | "dashed" | "ghost";
  ariaLabel?: string;
}) {
  const base: React.CSSProperties = {
    minHeight: 44,
    padding: "0 12px",
    borderRadius: "var(--radius-sm)",
    fontFamily: "var(--font-sans)",
    fontSize: "var(--text-ui)",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    border: "1px solid var(--color-rule)",
    background: "transparent",
    color: "var(--color-text)",
    whiteSpace: "nowrap",
  };
  const variant: Record<typeof kind, React.CSSProperties> = {
    primary: {
      background: "var(--color-accent)",
      color: "var(--color-bg)",
      border: "1px solid var(--color-accent)",
      fontWeight: 600,
      padding: "0 18px",
    },
    accent: {
      background:
        "color-mix(in oklab, var(--color-accent) 14%, transparent)",
      color: "var(--color-accent)",
      border: "1px solid var(--color-accent)",
    },
    muted: {},
    dashed: {
      background:
        "color-mix(in oklab, var(--color-accent) 8%, transparent)",
      color: "var(--color-accent)",
      border: "1px dashed var(--color-accent)",
    },
    ghost: {
      color: "var(--color-text-muted)",
    },
  };
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      style={{ ...base, ...variant[kind] }}
      {...(disabled ? {} : PRESS)}
    >
      {children}
    </motion.button>
  );
}
