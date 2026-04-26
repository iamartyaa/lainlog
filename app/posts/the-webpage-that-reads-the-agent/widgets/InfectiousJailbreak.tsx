"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { TextHighlighter } from "@/components/fancy";
import { SPRING } from "@/lib/motion";
import { playSound } from "@/lib/audio";

/**
 * A small network of agent nodes. One agent is seeded "infected"
 * (terracotta). On press, the infection spreads to neighbours along edges,
 * tick by tick, until the whole population is infected.
 *
 * Starts paused at state 0 — only the seed node is infected — so the reader
 * sees the starting configuration before the spread runs.
 *
 * Based on Gu et al. 2024's infectious jailbreak.
 */

const N = 14;
const CX = 180;
const CY = 120;
const RX = 148;
const RY = 96;

function seedPositions(): Array<{ x: number; y: number }> {
  return Array.from({ length: N }, (_, i) => {
    const theta = (i / N) * Math.PI * 2 - Math.PI / 2;
    const jitterR = 0.92 + ((i * 13) % 7) / 50;
    return {
      x: CX + RX * Math.cos(theta) * jitterR,
      y: CY + RY * Math.sin(theta) * jitterR,
    };
  });
}

function seedEdges(): Array<[number, number]> {
  const edges: Array<[number, number]> = [];
  for (let i = 0; i < N; i++) {
    edges.push([i, (i + 1) % N]);
  }
  const chords: Array<[number, number]> = [
    [0, 5],
    [2, 9],
    [6, 11],
    [3, 12],
    [7, 13],
  ];
  edges.push(...chords);
  return edges;
}

const HL_COLOR =
  "color-mix(in oklab, var(--color-accent) 28%, transparent)";
const HL_TX = { type: "spring" as const, duration: 0.9, bounce: 0 };

export function InfectiousJailbreak() {
  const positions = useMemo(seedPositions, []);
  const edges = useMemo(seedEdges, []);
  const neighbours = useMemo(() => {
    const map: number[][] = Array.from({ length: N }, () => []);
    for (const [a, b] of edges) {
      map[a].push(b);
      map[b].push(a);
    }
    return map;
  }, [edges]);

  const prefersReducedMotion = useReducedMotion();
  const [infected, setInfected] = useState<Set<number>>(() => new Set([0]));
  // Explicitly start paused — the reader sees state 0 before anything moves.
  const [running, setRunning] = useState(false);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    if (infected.size >= N) {
      setRunning(false);
      return;
    }
    const interval = prefersReducedMotion ? 900 : 600;
    tickRef.current = window.setTimeout(() => {
      setInfected((prev) => {
        const next = new Set(prev);
        for (const src of prev) {
          for (const nb of neighbours[src]) {
            if (!next.has(nb)) {
              next.add(nb);
              return next;
            }
          }
        }
        return prev;
      });
    }, interval);
    return () => {
      if (tickRef.current !== null) window.clearTimeout(tickRef.current);
    };
  }, [infected, neighbours, prefersReducedMotion, running]);

  const reset = () => {
    // Click on the user-press; the propagation tick that follows is autonomous.
    playSound("Click");
    if (tickRef.current !== null) window.clearTimeout(tickRef.current);
    setRunning(false);
    setInfected(new Set([0]));
  };

  const toggleRun = () => {
    // Click on every play / pause / replay press. Don't double-fire when
    // toggleRun delegates to reset().
    if (infected.size >= N) {
      reset();
      return;
    }
    playSound("Click");
    setRunning((r) => !r);
  };

  const state: "start" | "running" | "done" =
    infected.size >= N ? "done" : running ? "running" : "start";

  return (
    <WidgetShell
      title="infectious jailbreak"
      measurements={`${infected.size}/${N} infected`}
      captionTone="prominent"
      caption={
        state === "start" ? (
          <>
            Fourteen agents, one seeded infected.{" "}
            <TextHighlighter
              triggerType="auto"
              transition={HL_TX}
              highlightColor={HL_COLOR}
              className="rounded-[0.2em] px-[1px]"
            >
              Press play
            </TextHighlighter>{" "}
            to watch the jailbreak spread along the edges — each infected
            node whispers the attack to a neighbour on every tick.
          </>
        ) : state === "running" ? (
          <>
            Each tick, one uninfected neighbour of an infected agent flips
            terracotta. The attacker only compromised a single agent. The
            rest were convinced by conversation.
          </>
        ) : (
          <>
            Fourteen of fourteen.{" "}
            <TextHighlighter
              triggerType="auto"
              transition={HL_TX}
              highlightColor={HL_COLOR}
              className="rounded-[0.2em] px-[1px]"
            >
              The attacker compromised one.
            </TextHighlighter>{" "}
            In Gu et al.&apos;s multimodal study, a single adversarial image
            in one agent&apos;s memory spread until the whole population
            was jailbroken. Reset to replay.
          </>
        )
      }
      controls={
        <div className="flex gap-[var(--spacing-sm)] flex-wrap">
          <button
            onClick={toggleRun}
            className="rounded-[var(--radius-sm)] px-[var(--spacing-md)] py-[var(--spacing-2xs)] min-h-[44px] font-sans transition-colors"
            style={{
              fontSize: "var(--text-ui)",
              background:
                state === "start" ? "var(--color-accent)" : "transparent",
              color:
                state === "start"
                  ? "var(--color-bg)"
                  : "var(--color-text)",
              border:
                state === "start"
                  ? "1px solid var(--color-accent)"
                  : "1px solid var(--color-rule)",
              fontWeight: 600,
            }}
            aria-pressed={state === "running"}
          >
            {state === "start"
              ? "▸ play"
              : state === "running"
                ? "❚❚ pause"
                : "↻ reset"}
          </button>
          {state !== "start" && state !== "done" ? (
            <button
              onClick={reset}
              className="rounded-[var(--radius-sm)] px-[var(--spacing-md)] py-[var(--spacing-2xs)] min-h-[44px] font-sans transition-colors hover:text-[color:var(--color-accent)]"
              style={{
                fontSize: "var(--text-ui)",
                border: "1px solid var(--color-rule)",
              }}
            >
              reset
            </button>
          ) : null}
        </div>
      }
    >
      <div className="mx-auto" style={{ maxWidth: 540 }}>
        <svg
          viewBox="0 0 360 240"
          role="img"
          aria-label={`Network of ${N} agents, ${infected.size} infected`}
          style={{ width: "100%", height: "auto", display: "block" }}
        >
          {edges.map(([a, b], i) => {
            const pa = positions[a];
            const pb = positions[b];
            const bothInfected = infected.has(a) && infected.has(b);
            return (
              <motion.line
                key={`e-${i}`}
                x1={pa.x}
                y1={pa.y}
                x2={pb.x}
                y2={pb.y}
                initial={false}
                animate={{
                  stroke: bothInfected
                    ? "color-mix(in oklab, var(--color-accent) 55%, transparent)"
                    : "var(--color-rule)",
                  strokeWidth: bothInfected ? 1.5 : 1,
                }}
                transition={SPRING.smooth}
              />
            );
          })}

          {positions.map((p, i) => {
            const isInfected = infected.has(i);
            const isSeed = i === 0;
            return (
              <g key={`n-${i}`}>
                {isInfected ? (
                  <motion.circle
                    cx={p.x}
                    cy={p.y}
                    r={14}
                    fill="color-mix(in oklab, var(--color-accent) 18%, transparent)"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={SPRING.smooth}
                  />
                ) : null}
                <motion.circle
                  cx={p.x}
                  cy={p.y}
                  r={6}
                  initial={false}
                  animate={{
                    fill: isInfected
                      ? "var(--color-accent)"
                      : "var(--color-bg)",
                    stroke: isInfected
                      ? "var(--color-accent)"
                      : "var(--color-rule)",
                  }}
                  transition={SPRING.snappy}
                  strokeWidth={1.5}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </WidgetShell>
  );
}
