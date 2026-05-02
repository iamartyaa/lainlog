"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Arrow } from "@/components/viz/Arrow";
import { WidgetNav } from "@/components/viz/WidgetNav";
import { SvgDefs } from "@/components/viz/SvgDefs";
import type { BlockState } from "@/components/viz/Block";
import { SPRING, SVG_SONAR } from "@/lib/motion";
import { BitArray } from "./BitArray";
import { WidgetShell } from "@/components/viz/WidgetShell";

type HashLaneStep = {
  kind: "insert" | "query" | "remove";
  key: string;
  bitIndices: [number, number, number];
  caption: string;
};

type Props = {
  m?: number;
  script?: HashLaneStep[];
  initialStep?: number;
};

// Default script — the authored-aha deletion-breakage moment.
const DEFAULT_SCRIPT: HashLaneStep[] = [
  {
    kind: "insert",
    key: "foo",
    bitIndices: [2, 7, 11],
    caption:
      "Insert foo. Three hashes, three bits. The filter now remembers that it's seen foo — though, as we'll see, not exactly what it saw.",
  },
  {
    kind: "insert",
    key: "baz",
    bitIndices: [5, 7, 13],
    caption:
      "Insert baz. Notice bit 7 was already set by foo. Nobody asked permission; the bit belongs to both of them now.",
  },
  {
    kind: "remove",
    key: "baz",
    bitIndices: [5, 7, 13],
    caption:
      "Remove baz. We clear the three bits baz set. But bit 7 was also foo's — and the filter has no way to know that.",
  },
  {
    kind: "query",
    key: "foo",
    bitIndices: [2, 7, 11],
    caption:
      "Now query foo. Bit 7 is zero. The filter answers \"no\" — for a key we definitely inserted. That's a false negative, which Bloom filters promise never to produce. Which is why they don't support remove.",
  },
];

const HASH_NAMES = ["h₁", "h₂", "h₃"] as const;
// Three shapes so hash identity survives colorblindness; tint carries identity too.
const HASH_SHAPES = ["circle", "triangle", "square"] as const;

/**
 * HashLane — opening widget. Three hash lanes above a 16-bit array, stepping
 * through the foo/baz/remove/query script that manufactures the deletion-
 * impossibility aha.
 */
export function HashLane({ m = 16, script = DEFAULT_SCRIPT, initialStep = 0 }: Props) {
  const [step, setStep] = useState(initialStep);
  const current = script[Math.max(0, Math.min(step, script.length - 1))];

  // Compute cumulative bit state through step `step`.
  const bits = useMemo(() => {
    const state: BlockState[] = Array(m).fill("empty");
    for (let i = 0; i <= step; i++) {
      const s = script[i];
      if (!s) continue;
      if (s.kind === "insert") s.bitIndices.forEach((b) => (state[b] = "set"));
      else if (s.kind === "remove") s.bitIndices.forEach((b) => (state[b] = "empty"));
      // query doesn't change state
    }
    return state;
  }, [script, step, m]);

  // Mobile-first geometry: 16 cells × 20px stride = 320. Plus padding → 360 wide.
  const CELL = 18;
  const GAP = 2;
  const rowWidth = m * (CELL + GAP) - GAP;
  const PADDING_X = 20;
  const WIDTH = rowWidth + PADDING_X * 2;
  const LANE_Y = 44;
  const LANE_LABEL_Y = 24;
  const ARRAY_Y = 150;
  const HEIGHT = ARRAY_Y + CELL + 28;

  // Lane x positions — evenly distributed across the canvas.
  const laneXs = HASH_NAMES.map(
    (_, i) => PADDING_X + ((i + 1) / (HASH_NAMES.length + 1)) * rowWidth,
  );

  const bitCenter = (i: number) => ({
    x: PADDING_X + i * (CELL + GAP) + CELL / 2,
    y: ARRAY_Y,
  });

  const isQuery = current.kind === "query";
  const lineTone = isQuery ? "muted" : "active";
  const arrowKey = `${step}-${current.kind}-${current.key}`;

  const setCount = bits.filter((b) => b === "set").length;
  const measurements = `m = ${m} · set = ${setCount}`;

  const queryAnswer = (() => {
    if (!isQuery) return null;
    const [a, b, c] = current.bitIndices;
    const allSet = bits[a] === "set" && bits[b] === "set" && bits[c] === "set";
    return allSet ? "maybe" : "no";
  })();

  return (
    <WidgetShell
      title={`bloom · ${current.kind} "${current.key}"`}
      measurements={measurements}
      caption={current.caption}
      captionTone="prominent"
      controls={<WidgetNav value={step} total={script.length} onChange={setStep} />}
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        style={{ maxWidth: WIDTH, height: "auto", display: "block" }}
        role="img"
        aria-label={`Hash-lane demo, step ${step + 1} of ${script.length}: ${current.kind} ${current.key}`}
      >
        <defs>
          <SvgDefs />
        </defs>

        {/* Lane labels + shapes (hash identity) */}
        {HASH_NAMES.map((name, i) => (
          <g key={name} transform={`translate(${laneXs[i]}, ${LANE_LABEL_Y})`}>
            <LaneShape shape={HASH_SHAPES[i]} />
            <text
              x={18}
              y={4}
              fontFamily="var(--font-mono)"
              fontSize={12}
              fill="var(--color-text-muted)"
              dominantBaseline="central"
            >
              {name}
            </text>
          </g>
        ))}

        {/* Key label at centre-top, animated through step changes */}
        <motion.text
          key={arrowKey}
          x={WIDTH / 2}
          y={LANE_Y + 8}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize={14}
          fill={isQuery ? "var(--color-text-muted)" : "var(--color-text)"}
          initial={{ opacity: 0, y: LANE_Y + 2 }}
          animate={{ opacity: 1, y: LANE_Y + 8 }}
          transition={SPRING.smooth}
        >
          {current.kind === "remove" ? `remove("${current.key}")` :
           current.kind === "insert" ? `insert("${current.key}")` :
           `query("${current.key}")`}
        </motion.text>

        {/* Arrows: hash → bit. Re-keyed so they draw-in on each step. */}
        {current.bitIndices.map((bitIdx, i) => {
          const laneX = laneXs[i];
          const from = { x: laneX, y: LANE_Y + 16 };
          const to = bitCenter(bitIdx);
          const curvature = (i - 1) * 18;
          return (
            <Arrow
              key={`${arrowKey}-${i}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y - CELL / 2 - 4}
              tone={lineTone}
              curvature={curvature}
              animateIn
              strokeWidth={1.5}
            />
          );
        })}

        {/* Query pulse rings — one-shot sonar ping for "just checked" bits. */}
        {isQuery
          ? current.bitIndices.map((bitIdx) => {
              const { x, y } = bitCenter(bitIdx);
              const isMiss = bits[bitIdx] !== "set";
              return (
                <motion.circle
                  key={`pulse-${bitIdx}-${arrowKey}`}
                  cx={x}
                  cy={y + CELL / 2}
                  r={CELL * 0.6}
                  fill="none"
                  stroke={isMiss ? "var(--color-text)" : "var(--color-accent)"}
                  strokeWidth={1.5}
                  {...SVG_SONAR}
                />
              );
            })
          : null}

        {/* Bit array */}
        <BitArray
          m={m}
          bits={bits}
          cellSize={CELL}
          gap={GAP}
          asGroup
          x={PADDING_X}
          y={ARRAY_Y - CELL / 2 + CELL / 2}
        />

        {/* Query answer — shown only for query steps */}
        {queryAnswer !== null ? (
          <motion.text
            key={`ans-${arrowKey}`}
            x={WIDTH / 2}
            y={HEIGHT - 8}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize={13}
            fill={queryAnswer === "no" ? "var(--color-text-muted)" : "var(--color-accent)"}
            initial={{ opacity: 0, y: HEIGHT - 2 }}
            animate={{ opacity: 1, y: HEIGHT - 8 }}
            transition={{ ...SPRING.smooth, delay: 0.08 }}
          >
            answer: <tspan fontWeight={600}>{queryAnswer === "maybe" ? "maybe" : "no"}</tspan>
          </motion.text>
        ) : null}
      </svg>
    </WidgetShell>
  );
}

function LaneShape({ shape }: { shape: (typeof HASH_SHAPES)[number] }) {
  const fill = "none";
  const stroke = "var(--color-text-muted)";
  const sw = 1.4;
  if (shape === "circle")
    return <circle cx={0} cy={4} r={6} fill={fill} stroke={stroke} strokeWidth={sw} />;
  if (shape === "triangle")
    return (
      <polygon
        points="-6,10 6,10 0,-2"
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
    );
  return <rect x={-6} y={-2} width={12} height={12} fill={fill} stroke={stroke} strokeWidth={sw} />;
}
