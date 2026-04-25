"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { WidgetNav } from "@/components/viz/WidgetNav";
import { SvgDefs } from "@/components/viz/SvgDefs";
import { Arrow } from "@/components/viz/Arrow";
import { SPRING } from "@/lib/motion";
import { WidgetShell } from "./WidgetShell";

const N = 5;
const TOTAL_STEPS = N + 1;

function captionFor(step: number): string {
  if (step === 0) {
    return "Loop done. Five callbacks queued; each one points back at the same shared cell that holds i.";
  }
  const fired = step;
  const printed = Array(fired).fill(N).join(" ");
  return `Timer ${fired} fires. It reads the shared cell — which holds ${N}. Console: ${printed}.`;
}

export function LoopVar() {
  const [step, setStep] = useState(0);

  // Canvas geometry
  const WIDTH = 680;
  const HEIGHT = 300;

  const CB_Y = 36;
  const CB_W = 84;
  const CB_H = 40;
  const CB_GAP = 20;
  const CB_TOTAL_W = N * CB_W + (N - 1) * CB_GAP;
  const CB_X0 = (WIDTH - CB_TOTAL_W) / 2;

  const BIND_Y = 180;
  const BIND_H = 40;

  // var: one wide cell spanning the callback row.
  const VAR_BIND_W = 140;
  const VAR_BIND_X = (WIDTH - VAR_BIND_W) / 2;

  const sharedVar = N;

  const firedCount = step;
  const printedValues = Array.from({ length: firedCount }, () => sharedVar);

  return (
    <WidgetShell
      title="loop · var"
      measurements={`${N} callbacks · 1 cell`}
      caption={captionFor(step)}
      captionTone="prominent"
      controls={
        <WidgetNav
          value={step}
          total={TOTAL_STEPS}
          onChange={setStep}
          playInterval={1100}
          ariaLabel="Step var-loop timeline"
        />
      }
    >
      <div className="bs-loopvar-wide">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          width="100%"
          style={{ maxWidth: WIDTH, height: "auto", display: "block" }}
          role="img"
          aria-label={`LoopVar: ${firedCount} of ${N} callbacks fired`}
        >
          <defs>
            <SvgDefs />
          </defs>

          {/* Callback boxes */}
          {Array.from({ length: N }, (_, i) => {
            const x = CB_X0 + i * (CB_W + CB_GAP);
            const fired = i < firedCount;
            const firing = i === firedCount - 1 && firedCount > 0;
            const fill = firing
              ? "color-mix(in oklab, var(--color-accent) 18%, transparent)"
              : fired
                ? "color-mix(in oklab, var(--color-surface) 60%, transparent)"
                : "transparent";
            const stroke = firing
              ? "var(--color-accent)"
              : "var(--color-rule)";
            return (
              <g key={`cb-${i}`}>
                <motion.rect
                  x={x}
                  y={CB_Y}
                  width={CB_W}
                  height={CB_H}
                  rx={3}
                  initial={false}
                  animate={{ fill, stroke }}
                  strokeWidth={firing ? 1.5 : 1}
                  transition={SPRING.snappy}
                />
                <text
                  x={x + CB_W / 2}
                  y={CB_Y + 16}
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                  fontSize={11}
                  fill="var(--color-text-muted)"
                >
                  cb{i}
                </text>
                <text
                  x={x + CB_W / 2}
                  y={CB_Y + 31}
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                  fontSize={13}
                  fill={fired ? "var(--color-text)" : "var(--color-text-muted)"}
                >
                  {fired ? `log(${sharedVar})` : "log(i)"}
                </text>
              </g>
            );
          })}

          {/* Single shared binding cell — mount-in fade preserved */}
          <motion.g
            key="var-bind"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={SPRING.smooth}
          >
            <rect
              x={VAR_BIND_X}
              y={BIND_Y}
              width={VAR_BIND_W}
              height={BIND_H}
              rx={3}
              fill="var(--color-accent)"
              fillOpacity={0.92}
            />
            <text
              x={VAR_BIND_X + VAR_BIND_W / 2}
              y={BIND_Y + 16}
              textAnchor="middle"
              fontFamily="var(--font-sans)"
              fontSize={10}
              fill="var(--color-bg)"
              opacity={0.85}
              letterSpacing="0.08em"
            >
              i (shared)
            </text>
            <text
              x={VAR_BIND_X + VAR_BIND_W / 2}
              y={BIND_Y + 32}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize={15}
              fill="var(--color-bg)"
            >
              {sharedVar}
            </text>
          </motion.g>

          {/* Tethers: each callback → the one shared cell */}
          {Array.from({ length: N }, (_, i) => {
            const cbCx = CB_X0 + i * (CB_W + CB_GAP) + CB_W / 2;
            const cbBy = CB_Y + CB_H;
            const bindX = VAR_BIND_X + VAR_BIND_W / 2;
            const firing = i === firedCount - 1 && firedCount > 0;
            const tone = firing ? "active" : "muted";
            return (
              <Arrow
                key={`teth-${i}`}
                x1={cbCx}
                y1={cbBy + 2}
                x2={bindX}
                y2={BIND_Y - 2}
                tone={tone}
                strokeWidth={firing ? 2 : 1.2}
              />
            );
          })}

          {/* Console */}
          <g>
            <text
              x={WIDTH / 2}
              y={HEIGHT - 32}
              textAnchor="middle"
              fontFamily="var(--font-sans)"
              fontSize={9}
              fill="var(--color-text-muted)"
              letterSpacing="0.08em"
            >
              CONSOLE
            </text>
            <text
              x={WIDTH / 2}
              y={HEIGHT - 8}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize={16}
              fill="var(--color-text)"
            >
              {printedValues.length > 0 ? printedValues.join(" ") : " "}
            </text>
          </g>
        </svg>
      </div>
      <div className="bs-loopvar-narrow">
        <NarrowLoopVar
          firedCount={firedCount}
          printedValues={printedValues}
          sharedVar={sharedVar}
        />
      </div>
    </WidgetShell>
  );
}

/* -------------------------------------------------------------------------- */
/*                     Narrow portrait layout (mobile-first)                  */
/* -------------------------------------------------------------------------- */

function NarrowLoopVar({
  firedCount,
  printedValues,
  sharedVar,
}: {
  firedCount: number;
  printedValues: number[];
  sharedVar: number;
}) {
  const W = 360;
  const CB_X = 18;
  const CB_W = 112;
  const CB_H = 36;
  const CB_GAP = 6;
  const CB_Y0 = 24;

  const VAR_BIND_W = 96;
  const VAR_BIND_H = 48;
  const VAR_BIND_X = W - VAR_BIND_W - 28;
  const cbCenterY = (i: number) => CB_Y0 + i * (CB_H + CB_GAP) + CB_H / 2;
  const CB_COLUMN_BOTTOM = CB_Y0 + N * (CB_H + CB_GAP) - CB_GAP;
  const VAR_BIND_Y = (CB_Y0 + CB_COLUMN_BOTTOM) / 2 - VAR_BIND_H / 2;

  const CONSOLE_Y = CB_COLUMN_BOTTOM + 28;
  const H = CONSOLE_Y + 56;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ maxWidth: W, height: "auto", display: "block" }}
      role="img"
      aria-label={`LoopVar: ${firedCount} of ${N} callbacks fired`}
    >
      {/* Callback list (left column) */}
      {Array.from({ length: N }, (_, i) => {
        const y = CB_Y0 + i * (CB_H + CB_GAP);
        const fired = i < firedCount;
        const firing = i === firedCount - 1 && firedCount > 0;
        const fill = firing
          ? "color-mix(in oklab, var(--color-accent) 18%, transparent)"
          : fired
            ? "color-mix(in oklab, var(--color-surface) 60%, transparent)"
            : "transparent";
        const stroke = firing ? "var(--color-accent)" : "var(--color-rule)";
        return (
          <g key={`n-cb-${i}`}>
            <motion.rect
              x={CB_X}
              y={y}
              width={CB_W}
              height={CB_H}
              rx={3}
              initial={false}
              animate={{ fill, stroke }}
              strokeWidth={firing ? 1.5 : 1}
              transition={SPRING.snappy}
            />
            <text
              x={CB_X + 10}
              y={y + 14}
              fontFamily="var(--font-mono)"
              fontSize={10}
              fill="var(--color-text-muted)"
            >
              cb{i}
            </text>
            <text
              x={CB_X + 10}
              y={y + 28}
              fontFamily="var(--font-mono)"
              fontSize={12}
              fill={fired ? "var(--color-text)" : "var(--color-text-muted)"}
            >
              {fired ? `log(${sharedVar})` : "log(i)"}
            </text>
          </g>
        );
      })}

      {/* Single shared binding cell — mount-in fade preserved */}
      <motion.g
        key="n-var-bind"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={SPRING.smooth}
      >
        <rect
          x={VAR_BIND_X}
          y={VAR_BIND_Y}
          width={VAR_BIND_W}
          height={VAR_BIND_H}
          rx={3}
          fill="var(--color-accent)"
          fillOpacity={0.92}
        />
        <text
          x={VAR_BIND_X + VAR_BIND_W / 2}
          y={VAR_BIND_Y + 18}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize={10}
          fill="var(--color-bg)"
          opacity={0.85}
          letterSpacing="0.06em"
        >
          i (shared)
        </text>
        <text
          x={VAR_BIND_X + VAR_BIND_W / 2}
          y={VAR_BIND_Y + 36}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize={15}
          fill="var(--color-bg)"
        >
          {sharedVar}
        </text>
      </motion.g>

      {/* Tethers: horizontal from each callback to the one shared cell */}
      {Array.from({ length: N }, (_, i) => {
        const x1 = CB_X + CB_W;
        const y1 = cbCenterY(i);
        const x2 = VAR_BIND_X;
        const y2 = VAR_BIND_Y + VAR_BIND_H / 2;
        const firing = i === firedCount - 1 && firedCount > 0;
        return (
          <Arrow
            key={`n-teth-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            tone={firing ? "active" : "muted"}
            strokeWidth={firing ? 2 : 1.2}
          />
        );
      })}

      {/* Console band */}
      <g>
        <rect
          x={CB_X}
          y={CONSOLE_Y}
          width={W - CB_X * 2}
          height={44}
          rx={3}
          fill="color-mix(in oklab, var(--color-surface) 60%, transparent)"
          stroke="var(--color-rule)"
          strokeWidth={1}
        />
        <text
          x={CB_X + 8}
          y={CONSOLE_Y + 14}
          fontFamily="var(--font-sans)"
          fontSize={9}
          fill="var(--color-text-muted)"
          letterSpacing="0.08em"
        >
          CONSOLE
        </text>
        <text
          x={W / 2}
          y={CONSOLE_Y + 34}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize={16}
          fill="var(--color-text)"
        >
          {printedValues.length > 0 ? printedValues.join(" ") : " "}
        </text>
      </g>
    </svg>
  );
}
