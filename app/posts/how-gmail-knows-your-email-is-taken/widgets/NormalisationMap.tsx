"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Stepper } from "@/components/viz/Stepper";
import { SvgDefs } from "@/components/viz/SvgDefs";
import { Arrow } from "@/components/viz/Arrow";
import { SPRING } from "@/lib/motion";
import { WidgetShell } from "./WidgetShell";

type Row = {
  typed: string;
  /** One-line caption that appears below the canvas when this row becomes active. */
  caption: string;
  /** If true, this row does NOT map to the default canonical form. */
  separate?: boolean;
  /** When separate=true, the alternate canonical form. */
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
      "Workspace addresses play by the tenant admin's rules, not Gmail's — so @company.com is its own namespace.",
  },
];

type Props = {
  rows?: Row[];
  canonical?: string;
  initialStep?: number;
};

/**
 * NormalisationMap — §4. Several typed inputs collapse by curved arrows into
 * one canonical form (with one intentional exception for the Workspace row).
 */
export function NormalisationMap({
  rows = DEFAULT_ROWS,
  canonical = DEFAULT_CANONICAL,
  initialStep = 0,
}: Props) {
  const [step, setStep] = useState(initialStep);
  const current = rows[Math.max(0, Math.min(step, rows.length - 1))];

  // Geometry
  const WIDTH = 680;
  const ROW_H = 34;
  const ROW_GAP = 4;
  const PAD_T = 12;
  const PAD_B = 12;
  const PAD_L = 18;
  const PAD_R = 28;
  const LEFT_W = 280;
  const RIGHT_X = WIDTH - PAD_R - 220;
  const HEIGHT = PAD_T + rows.length * (ROW_H + ROW_GAP) - ROW_GAP + PAD_B;
  const CANONICAL_Y = HEIGHT / 2;

  return (
    <WidgetShell
      title="NormalisationMap"
      measurements={`step = ${step + 1}/${rows.length}`}
      caption={current.caption}
      controls={<Stepper value={step} total={rows.length} onChange={setStep} />}
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        style={{ maxWidth: WIDTH, height: "auto", display: "block" }}
        role="img"
        aria-label={`Normalisation map, step ${step + 1} of ${rows.length}: ${current.typed}`}
      >
        <defs>
          <SvgDefs />
        </defs>

        {/* Typed inputs on the left */}
        {rows.map((row, i) => {
          const y = PAD_T + i * (ROW_H + ROW_GAP) + ROW_H / 2;
          const revealed = i <= step;
          const active = i === step;
          return (
            <motion.g
              key={`row-${i}`}
              initial={false}
              animate={{ opacity: revealed ? 1 : 0.15 }}
              transition={SPRING.smooth}
            >
              {active ? (
                <rect
                  x={PAD_L - 6}
                  y={y - ROW_H / 2}
                  width={LEFT_W + 8}
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
                fontSize={13}
                fill={active ? "var(--color-text)" : "var(--color-text-muted)"}
              >
                {row.typed}
              </text>
            </motion.g>
          );
        })}

        {/* Canonical form on the right */}
        <g>
          <rect
            x={RIGHT_X}
            y={CANONICAL_Y - 20}
            width={220}
            height={40}
            rx={3}
            fill="color-mix(in oklab, var(--color-accent) 18%, transparent)"
            stroke="var(--color-accent)"
            strokeWidth={1.2}
          />
          <text
            x={RIGHT_X + 110}
            y={CANONICAL_Y - 2}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize={14}
            fill="var(--color-text)"
          >
            {canonical}
          </text>
          <text
            x={RIGHT_X + 110}
            y={CANONICAL_Y + 12}
            textAnchor="middle"
            fontFamily="var(--font-sans)"
            fontSize={9}
            fill="var(--color-text-muted)"
            letterSpacing="0.08em"
          >
            CANONICAL FORM
          </text>
        </g>

        {/* Workspace alternate target — only visible once the separate row is reached */}
        {(() => {
          const separateRow = rows.find((r) => r.separate);
          const separateIdx = rows.findIndex((r) => r.separate);
          if (!separateRow || separateIdx === -1) return null;
          const revealed = step >= separateIdx;
          const altY = PAD_T + separateIdx * (ROW_H + ROW_GAP) + ROW_H / 2;
          return (
            <motion.g
              initial={false}
              animate={{ opacity: revealed ? 1 : 0 }}
              transition={SPRING.smooth}
            >
              <rect
                x={RIGHT_X}
                y={altY - 16}
                width={220}
                height={32}
                rx={3}
                fill="none"
                stroke="var(--color-text-muted)"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <text
                x={RIGHT_X + 110}
                y={altY + 3}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize={12}
                fill="var(--color-text-muted)"
              >
                {separateRow.alternate ?? separateRow.typed}
              </text>
            </motion.g>
          );
        })()}

        {/* Arrows from each revealed typed row to its destination */}
        {rows.map((row, i) => {
          if (i > step) return null;
          const y = PAD_T + i * (ROW_H + ROW_GAP) + ROW_H / 2;
          const toY = row.separate ? y : CANONICAL_Y;
          const curvature = row.separate ? 0 : (i - rows.length / 2) * 5;
          const tone = i === step ? "active" : "muted";
          return (
            <Arrow
              key={`arr-${i}-${row.typed}`}
              x1={PAD_L + LEFT_W + 6}
              y1={y}
              x2={RIGHT_X - 4}
              y2={toY}
              tone={tone}
              curvature={curvature}
              animateIn={i === step}
              strokeWidth={1.2}
            />
          );
        })}
      </svg>
    </WidgetShell>
  );
}
