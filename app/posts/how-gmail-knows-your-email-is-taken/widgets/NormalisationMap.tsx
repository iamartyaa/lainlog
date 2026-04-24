"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Stepper } from "@/components/viz/Stepper";
import { SvgDefs } from "@/components/viz/SvgDefs";
import { Arrow } from "@/components/viz/Arrow";
import { SPRING } from "@/lib/motion";
import { ScrambleIn } from "@/components/fancy";
import { WidgetShell } from "./WidgetShell";

type Row = {
  typed: string;
  caption: string;
  separate?: boolean;
  alternate?: string;
};

const DEFAULT_CANONICAL = "johndoe@gmail.com";

const DEFAULT_ROWS: Row[] = [
  {
    typed: "johndoe@gmail.com",
    caption: "The canonical form itself. Obviously taken.",
  },
  {
    typed: "JohnDoe@Gmail.com",
    caption: "Case doesn't matter. Same account.",
  },
  {
    typed: "j.o.h.n.d.o.e@gmail.com",
    caption: "Dots don't matter — inside @gmail.com. Same account.",
  },
  {
    typed: "john.doe+newsletters@gmail.com",
    caption: "Everything after the plus is a tag you made up. Same account.",
  },
  {
    typed: "j.ohn.doe+work@googlemail.com",
    caption: "googlemail.com is gmail.com — old branding, same inbox. Same account.",
  },
  {
    typed: "johndoe@company.com",
    separate: true,
    alternate: "johndoe@company.com",
    caption:
      "Workspace addresses follow tenant rules, not Gmail's. So @company.com is its own namespace.",
  },
];

type Props = {
  rows?: Row[];
  canonical?: string;
  initialStep?: number;
};

/**
 * NormalisationMap — mobile-first. Typed rows stack vertically; curved arrows
 * sweep down into one canonical chip pinned at the bottom. The Workspace row
 * breaks sideways into its own dashed alternate chip to teach the exception.
 *
 * Canonical chip uses `ScrambleIn` so the rewrite re-plays on every step —
 * teaching "the server rewrote this" even when the final string is unchanged.
 */
export function NormalisationMap({
  rows = DEFAULT_ROWS,
  canonical = DEFAULT_CANONICAL,
  initialStep = 0,
}: Props) {
  const [step, setStep] = useState(initialStep);
  const clampedStep = Math.max(0, Math.min(step, rows.length - 1));
  const current = rows[clampedStep];

  // Mobile-first geometry — 360 wide, stacked vertically.
  const WIDTH = 360;
  const ROW_H = 30;
  const ROW_GAP = 4;
  const PAD_T = 10;
  const PAD_L = 20;
  const GAP_TO_CANONICAL = 24;
  const CANONICAL_H = 44;
  const ROWS_BLOCK_H = rows.length * (ROW_H + ROW_GAP) - ROW_GAP;
  const CANONICAL_Y = PAD_T + ROWS_BLOCK_H + GAP_TO_CANONICAL;
  const HEIGHT = CANONICAL_Y + CANONICAL_H + 8;
  const ROW_W = WIDTH - PAD_L * 2;

  // Resolve the canonical form shown in the chip for the current step:
  // Workspace row exposes its alternate, everyone else points at default.
  const displayCanonical = current.separate
    ? current.alternate ?? current.typed
    : canonical;

  return (
    <WidgetShell
      title="normalisation · one canonical form"
      measurements={`step ${clampedStep + 1}/${rows.length}`}
      caption={current.caption}
      controls={<Stepper value={clampedStep} total={rows.length} onChange={setStep} />}
    >
      <div className="relative" style={{ maxWidth: WIDTH, margin: "0 auto" }}>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          width="100%"
          style={{ maxWidth: WIDTH, height: "auto", display: "block" }}
          role="img"
          aria-label={`Normalisation map, step ${clampedStep + 1} of ${rows.length}: ${current.typed}`}
        >
          <defs>
            <SvgDefs />
          </defs>

          {/* Typed rows, stacked */}
          {rows.map((row, i) => {
            const y = PAD_T + i * (ROW_H + ROW_GAP) + ROW_H / 2;
            const revealed = i <= clampedStep;
            const active = i === clampedStep;
            return (
              <motion.g
                key={`row-${i}`}
                initial={false}
                animate={{ opacity: revealed ? 1 : 0.18 }}
                transition={SPRING.smooth}
              >
                {active ? (
                  <rect
                    x={PAD_L - 6}
                    y={y - ROW_H / 2}
                    width={ROW_W + 12}
                    height={ROW_H}
                    rx={2}
                    fill="color-mix(in oklab, var(--color-accent) 12%, transparent)"
                  />
                ) : null}
                <text
                  x={PAD_L}
                  y={y}
                  dominantBaseline="central"
                  fontFamily="var(--font-mono)"
                  fontSize={12}
                  fill={active ? "var(--color-text)" : "var(--color-text-muted)"}
                >
                  {row.typed}
                </text>
                {row.separate ? (
                  <text
                    x={WIDTH - PAD_L}
                    y={y}
                    textAnchor="end"
                    dominantBaseline="central"
                    fontFamily="var(--font-mono)"
                    fontSize={9}
                    fill="var(--color-text-muted)"
                    letterSpacing="0.08em"
                  >
                    WORKSPACE
                  </text>
                ) : null}
              </motion.g>
            );
          })}

          {/* Converging arrows from each revealed row into the canonical chip */}
          {rows.map((row, i) => {
            if (i > clampedStep) return null;
            if (row.separate) return null; // workspace branches sideways, not down
            const y = PAD_T + i * (ROW_H + ROW_GAP) + ROW_H / 2;
            const x1 = PAD_L + 240;
            const x2 = WIDTH / 2;
            const y2 = CANONICAL_Y;
            const tone = i === clampedStep ? "active" : "muted";
            const curvature = (i - rows.length / 2) * 3;
            return (
              <Arrow
                key={`arr-${i}-${row.typed}`}
                x1={x1}
                y1={y}
                x2={x2}
                y2={y2 - 2}
                tone={tone}
                curvature={curvature}
                animateIn={i === clampedStep}
                strokeWidth={1.2}
              />
            );
          })}

          {/* Sideways arrow for Workspace row — draws toward an offset chip */}
          {(() => {
            const separateIdx = rows.findIndex((r) => r.separate);
            if (separateIdx === -1 || clampedStep < separateIdx) return null;
            const separateRow = rows[separateIdx];
            const y = PAD_T + separateIdx * (ROW_H + ROW_GAP) + ROW_H / 2;
            const altCx = WIDTH / 2;
            const altCy = CANONICAL_Y + CANONICAL_H + 6;
            const altW = 200;
            const altH = 28;
            return (
              <motion.g
                initial={false}
                animate={{ opacity: 1 }}
                transition={SPRING.smooth}
              >
                <motion.path
                  d={`M ${PAD_L + 240} ${y} Q ${WIDTH - PAD_L + 8} ${y} ${altCx + altW / 2 - 4} ${altCy - 6}`}
                  fill="none"
                  stroke="var(--color-text-muted)"
                  strokeWidth={1}
                  strokeDasharray="4 3"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={SPRING.smooth}
                />
                <rect
                  x={altCx - altW / 2}
                  y={altCy - altH / 2 + 6}
                  width={altW}
                  height={altH}
                  rx={3}
                  fill="none"
                  stroke="var(--color-text-muted)"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
                <text
                  x={altCx}
                  y={altCy + 11}
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                  fontSize={11}
                  fill="var(--color-text-muted)"
                >
                  {separateRow.alternate ?? separateRow.typed}
                </text>
              </motion.g>
            );
          })()}

          {/* Canonical chip — ScrambleIn payload rendered as a foreignObject
              so the typographic re-reveal stays DOM-driven with reduced-motion
              support, while sitting inside our SVG frame. */}
          <rect
            x={WIDTH / 2 - 130}
            y={CANONICAL_Y}
            width={260}
            height={CANONICAL_H}
            rx={3}
            fill="color-mix(in oklab, var(--color-accent) 18%, transparent)"
            stroke="var(--color-accent)"
            strokeWidth={1.2}
          />
          <foreignObject
            x={WIDTH / 2 - 128}
            y={CANONICAL_Y + 4}
            width={256}
            height={CANONICAL_H - 18}
          >
            <div
              className="h-full w-full flex items-center justify-center font-mono tabular-nums"
              style={{
                color: "var(--color-text)",
                fontSize: 13,
                letterSpacing: "-0.005em",
              }}
            >
              <ScrambleIn key={`sc-${clampedStep}`} text={displayCanonical} />
            </div>
          </foreignObject>
          <text
            x={WIDTH / 2}
            y={CANONICAL_Y + CANONICAL_H - 6}
            textAnchor="middle"
            fontFamily="var(--font-sans)"
            fontSize={9}
            fill="var(--color-text-muted)"
            letterSpacing="0.08em"
          >
            CANONICAL FORM
          </text>
        </svg>
      </div>
    </WidgetShell>
  );
}
