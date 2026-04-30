"use client";

/**
 * MxNExplorer — the load-bearing widget for chapter 1 of the MCPs course.
 *
 * Two scrubbers (M = hosts, N = tools) drive a bipartite graph. A "with MCP"
 * toggle collapses the graph from "every host wires to every tool" (M·N
 * arrows) into a star topology through a hub (M + N arrows). The arrow count
 * + delta in the measurements slot is the felt aha at M=4, N=9 (36 → 13).
 *
 * Decisions baked in (with judgement):
 * - SVG is sized via viewBox; the parent `<WidgetShell>` provides the
 *   responsive frame and hydration scaffold. We do not animate `width` or
 *   `height` on the SVG itself — only `cx/cy/x1/y1/...` between layouts.
 * - "without MCP" arrows use `--color-rule` (tonal, neutral). "with MCP"
 *   arrows use `--color-accent` (terracotta). This is the one-accent rule.
 * - Reduced motion: nodes snap between layouts (no spring tail); arrow
 *   draw-in collapses to opacity. Frame stays the same size either way.
 * - Mobile (< 480 px): scrubbers stack vertically below the canvas. The
 *   SVG `viewBox` keeps the graph readable down to 320 px container width.
 * - A11y: each scrubber is a real `<input type="range">` with a label and
 *   ARIA-valuenow (Scrubber primitive handles this). The toggle is a real
 *   `<button>` with `aria-pressed`.
 */

import { useMemo, useState, useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { Scrubber } from "@/components/viz/Scrubber";
import { SPRING, PRESS } from "@/lib/motion";
import { playSound } from "@/lib/audio";

type Mode = "without" | "with";

const M_MIN = 1;
const M_MAX = 6;
const N_MIN = 1;
const N_MAX = 10;

// Canvas geometry, in viewBox units. We design at 360×220 — readable down
// to a 320 px container.
const VB_W = 360;
const VB_H = 220;
const COL_X_LEFT = 60;
const COL_X_RIGHT = VB_W - 60;
const HUB_X = VB_W / 2;
const HUB_Y = VB_H / 2;
const COL_PADDING_Y = 24;

function nodeY(i: number, count: number) {
  if (count <= 1) return VB_H / 2;
  const usable = VB_H - COL_PADDING_Y * 2;
  return COL_PADDING_Y + (i / (count - 1)) * usable;
}

export function MxNExplorer() {
  const reduce = useReducedMotion();
  const [m, setM] = useState(4);
  const [n, setN] = useState(9);
  const [mode, setMode] = useState<Mode>("without");
  const arrowMarkerId = useId();

  const withoutCount = m * n;
  const withCount = m + n;
  const currentCount = mode === "with" ? withCount : withoutCount;
  const delta = withoutCount - withCount;

  const hosts = useMemo(
    () => Array.from({ length: m }, (_, i) => ({ id: `h${i}`, x: COL_X_LEFT, y: nodeY(i, m) })),
    [m],
  );
  const tools = useMemo(
    () => Array.from({ length: n }, (_, i) => ({ id: `t${i}`, x: COL_X_RIGHT, y: nodeY(i, n) })),
    [n],
  );

  // Edge list. In `without` mode we draw every (host, tool) pair. In `with`
  // mode we draw host→hub and hub→tool — the star.
  const edges = useMemo(() => {
    if (mode === "without") {
      const out: { id: string; x1: number; y1: number; x2: number; y2: number }[] = [];
      for (const h of hosts) {
        for (const t of tools) {
          out.push({ id: `${h.id}-${t.id}`, x1: h.x, y1: h.y, x2: t.x, y2: t.y });
        }
      }
      return out;
    }
    const out: { id: string; x1: number; y1: number; x2: number; y2: number }[] = [];
    for (const h of hosts) {
      out.push({ id: `${h.id}-hub`, x1: h.x, y1: h.y, x2: HUB_X, y2: HUB_Y });
    }
    for (const t of tools) {
      out.push({ id: `hub-${t.id}`, x1: HUB_X, y1: HUB_Y, x2: t.x, y2: t.y });
    }
    return out;
  }, [mode, hosts, tools]);

  const edgeColor =
    mode === "with"
      ? "var(--color-accent)"
      : "color-mix(in oklab, var(--color-text-muted) 50%, transparent)";

  const measurements =
    mode === "without"
      ? `${withoutCount} adapters`
      : `${withCount} adapters · −${delta}`;

  const canvas = (
    <div className="w-full" style={{ minHeight: 220 }}>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={
          mode === "with"
            ? `Star topology — ${m} hosts and ${n} tools all route through one hub. ${withCount} arrows total.`
            : `Bipartite graph — ${m} hosts each wire to all ${n} tools. ${withoutCount} arrows total.`
        }
        style={{ display: "block", maxHeight: 320 }}
      >
        <defs>
          {/* Tiny arrowhead, sized to look right at 1.25px stroke. */}
          <marker
            id={arrowMarkerId}
            viewBox="0 0 6 6"
            refX="5.5"
            refY="3"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L6,3 L0,6 Z" fill={edgeColor} />
          </marker>
        </defs>

        {/* Edges. */}
        {edges.map((e) => (
          <motion.line
            key={`${mode}:${e.id}`}
            x1={e.x1}
            y1={e.y1}
            x2={e.x2}
            y2={e.y2}
            stroke={edgeColor}
            strokeWidth={1.25}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            initial={reduce ? { opacity: 0 } : { opacity: 0, pathLength: 0 }}
            animate={reduce ? { opacity: 0.9 } : { opacity: 0.9, pathLength: 1 }}
            transition={reduce ? { duration: 0 } : { ...SPRING.smooth }}
          />
        ))}

        {/* Hub — only in `with` mode. Slightly larger than nodes; terracotta
            outlined to read as "the protocol". */}
        {mode === "with" ? (
          <motion.g
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={reduce ? { duration: 0 } : SPRING.smooth}
            style={{ transformOrigin: `${HUB_X}px ${HUB_Y}px`, transformBox: "fill-box" }}
          >
            <rect
              x={HUB_X - 9}
              y={HUB_Y - 9}
              width={18}
              height={18}
              fill="var(--color-accent)"
              opacity={0.18}
              rx={2}
            />
            <rect
              x={HUB_X - 9}
              y={HUB_Y - 9}
              width={18}
              height={18}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              rx={2}
            />
            <text
              x={HUB_X}
              y={HUB_Y + 22}
              textAnchor="middle"
              fontSize="9"
              fill="var(--color-text-muted)"
              fontFamily="var(--font-mono)"
            >
              MCP
            </text>
          </motion.g>
        ) : null}

        {/* Hosts column. */}
        {hosts.map((h, i) => (
          <motion.g
            key={h.id}
            initial={false}
            animate={{ x: 0, y: 0 }}
            transition={reduce ? { duration: 0 } : SPRING.smooth}
          >
            <circle
              cx={h.x}
              cy={h.y}
              r={5}
              fill="var(--color-text)"
              opacity={0.85}
            />
            {i === 0 ? (
              <text
                x={h.x}
                y={COL_PADDING_Y - 8}
                textAnchor="middle"
                fontSize="9"
                fill="var(--color-text-muted)"
                fontFamily="var(--font-mono)"
              >
                hosts
              </text>
            ) : null}
          </motion.g>
        ))}

        {/* Tools column. */}
        {tools.map((t, i) => (
          <motion.g
            key={t.id}
            initial={false}
            animate={{ x: 0, y: 0 }}
            transition={reduce ? { duration: 0 } : SPRING.smooth}
          >
            <circle
              cx={t.x}
              cy={t.y}
              r={5}
              fill="var(--color-text)"
              opacity={0.85}
            />
            {i === 0 ? (
              <text
                x={t.x}
                y={COL_PADDING_Y - 8}
                textAnchor="middle"
                fontSize="9"
                fill="var(--color-text-muted)"
                fontFamily="var(--font-mono)"
              >
                tools
              </text>
            ) : null}
          </motion.g>
        ))}
      </svg>
    </div>
  );

  const onToggle = () => {
    playSound("Click");
    setMode((m) => (m === "with" ? "without" : "with"));
  };

  return (
    <WidgetShell
      title="M × N adapters, before and after one protocol"
      measurements={measurements}
      caption={
        mode === "with" ? (
          <>
            With one protocol between hosts and tools, every host implements MCP once
            and every tool exposes itself once. {m} + {n} = {withCount} integrations to write.
          </>
        ) : (
          <>
            Without a protocol, each (host, tool) pair gets its own bespoke adapter.
            {" "}{m} × {n} = {withoutCount} integrations to write — and to maintain forever.
          </>
        )
      }
      controls={
        <div
          className="flex w-full flex-wrap items-center gap-x-[var(--spacing-md)] gap-y-[var(--spacing-sm)] justify-center"
          style={{ maxWidth: 520 }}
        >
          <div style={{ minWidth: 200, flex: "1 1 200px" }}>
            <Scrubber
              label="M"
              value={m}
              min={M_MIN}
              max={M_MAX}
              onChange={setM}
              format={(v) => `${v} host${v === 1 ? "" : "s"}`}
            />
          </div>
          <div style={{ minWidth: 200, flex: "1 1 200px" }}>
            <Scrubber
              label="N"
              value={n}
              min={N_MIN}
              max={N_MAX}
              onChange={setN}
              format={(v) => `${v} tool${v === 1 ? "" : "s"}`}
            />
          </div>
          <motion.button
            type="button"
            onClick={onToggle}
            aria-pressed={mode === "with"}
            aria-label={mode === "with" ? "Disable MCP — see M × N adapters" : "Enable MCP — collapse to M + N"}
            className="font-sans inline-flex items-center justify-center rounded-[var(--radius-md)] px-[var(--spacing-md)] py-[var(--spacing-2xs)] min-h-[36px]"
            style={{
              fontSize: "var(--text-ui)",
              border: "1px solid var(--color-accent)",
              background:
                mode === "with"
                  ? "color-mix(in oklab, var(--color-accent) 18%, transparent)"
                  : "transparent",
              color: mode === "with" ? "var(--color-accent)" : "var(--color-text)",
              cursor: "pointer",
            }}
            {...PRESS}
          >
            {mode === "with" ? "with MCP ✓" : "with MCP"}
          </motion.button>
          <span
            className="font-mono tabular-nums"
            aria-live="polite"
            style={{
              fontSize: "var(--text-small)",
              color: "var(--color-text-muted)",
              minWidth: "8ch",
              textAlign: "right",
            }}
          >
            {currentCount}
            {mode === "with" ? ` (−${delta})` : ""}
          </span>
        </div>
      }
    >
      {canvas}
    </WidgetShell>
  );
}

export default MxNExplorer;
