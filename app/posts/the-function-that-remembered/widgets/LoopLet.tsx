"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { WidgetNav } from "@/components/viz/WidgetNav";
import { SvgDefs } from "@/components/viz/SvgDefs";
import { Arrow } from "@/components/viz/Arrow";
import { SPRING } from "@/lib/motion";
import { WidgetShell } from "@/components/viz/WidgetShell";

const N = 5;
const TOTAL_STEPS = N + 1;

function captionFor(step: number): string {
  if (step === 0) {
    return "Loop done. Five callbacks queued — each one tethered to its own per-iteration cell.";
  }
  const fired = step;
  const printed = Array.from({ length: fired }, (_, i) => i).join(" ");
  return `Timer ${fired} fires. It reads its own cell, which froze the value i had that round. Console: ${printed}.`;
}

export function LoopLet() {
  const [step, setStep] = useState(0);

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

  // let: five cells, one under each callback.
  const LET_BIND_W = 60;

  const letBindings = Array.from({ length: N }, (_, i) => i);

  const firedCount = step;
  const printedValues = Array.from({ length: firedCount }, (_, i) => i);

  return (
    <WidgetShell
      title="loop · let"
      measurements={`${N} callbacks · ${N} cells`}
      caption={captionFor(step)}
      captionTone="prominent"
      controls={
        <WidgetNav
          value={step}
          total={TOTAL_STEPS}
          onChange={setStep}
          playInterval={1100}
          ariaLabel="Step let-loop timeline"
        />
      }
    >
      <div className="bs-looplet-wide">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          width="100%"
          style={{ maxWidth: WIDTH, height: "auto", display: "block" }}
          role="img"
          aria-label={`LoopLet: ${firedCount} of ${N} callbacks fired`}
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
                  {fired ? `log(${i})` : "log(i)"}
                </text>
              </g>
            );
          })}

          {/* Five per-iteration binding cells — mount-in fade preserved */}
          <motion.g
            key="let-bind"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={SPRING.smooth}
          >
            {letBindings.map((val, i) => {
              const x = CB_X0 + i * (CB_W + CB_GAP) + (CB_W - LET_BIND_W) / 2;
              return (
                <g key={`bind-${i}`}>
                  <rect
                    x={x}
                    y={BIND_Y}
                    width={LET_BIND_W}
                    height={BIND_H}
                    rx={3}
                    fill="var(--color-accent)"
                    fillOpacity={0.92}
                  />
                  <text
                    x={x + LET_BIND_W / 2}
                    y={BIND_Y + 16}
                    textAnchor="middle"
                    fontFamily="var(--font-sans)"
                    fontSize={9}
                    fill="var(--color-bg)"
                    opacity={0.85}
                    letterSpacing="0.06em"
                  >
                    i #{i}
                  </text>
                  <text
                    x={x + LET_BIND_W / 2}
                    y={BIND_Y + 32}
                    textAnchor="middle"
                    fontFamily="var(--font-mono)"
                    fontSize={15}
                    fill="var(--color-bg)"
                  >
                    {val}
                  </text>
                </g>
              );
            })}
          </motion.g>

          {/* Tethers: each callback → its own cell */}
          {Array.from({ length: N }, (_, i) => {
            const cbCx = CB_X0 + i * (CB_W + CB_GAP) + CB_W / 2;
            const cbBy = CB_Y + CB_H;
            const bindX = CB_X0 + i * (CB_W + CB_GAP) + CB_W / 2;
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
              {printedValues.length > 0 ? printedValues.join(" ") : " "}
            </text>
          </g>
        </svg>
      </div>
      <div className="bs-looplet-narrow">
        <NarrowLoopLet
          firedCount={firedCount}
          printedValues={printedValues}
          letBindings={letBindings}
        />
      </div>
    </WidgetShell>
  );
}

/* -------------------------------------------------------------------------- */
/*                     Narrow portrait layout (mobile-first)                  */
/* -------------------------------------------------------------------------- */

function NarrowLoopLet({
  firedCount,
  printedValues,
  letBindings,
}: {
  firedCount: number;
  printedValues: number[];
  letBindings: number[];
}) {
  const W = 360;
  const CB_X = 18;
  const CB_W = 112;
  const CB_H = 36;
  const CB_GAP = 6;
  const CB_Y0 = 24;

  const BIND_X_LET = W - CB_W - 18;
  const BIND_W_LET = CB_W;
  const cbCenterY = (i: number) => CB_Y0 + i * (CB_H + CB_GAP) + CB_H / 2;
  const CB_COLUMN_BOTTOM = CB_Y0 + N * (CB_H + CB_GAP) - CB_GAP;

  const CONSOLE_Y = CB_COLUMN_BOTTOM + 28;
  const H = CONSOLE_Y + 56;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ maxWidth: W, height: "auto", display: "block" }}
      role="img"
      aria-label={`LoopLet: ${firedCount} of ${N} callbacks fired`}
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
              {fired ? `log(${i})` : "log(i)"}
            </text>
          </g>
        );
      })}

      {/* Five per-iteration binding cells aligned to each row — mount-in fade */}
      <motion.g
        key="n-let-bind"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={SPRING.smooth}
      >
        {letBindings.map((val, i) => {
          const y = CB_Y0 + i * (CB_H + CB_GAP);
          return (
            <g key={`n-bind-${i}`}>
              <rect
                x={BIND_X_LET}
                y={y}
                width={BIND_W_LET}
                height={CB_H}
                rx={3}
                fill="var(--color-accent)"
                fillOpacity={0.92}
              />
              <text
                x={BIND_X_LET + BIND_W_LET / 2}
                y={y + 14}
                textAnchor="middle"
                fontFamily="var(--font-sans)"
                fontSize={9}
                fill="var(--color-bg)"
                opacity={0.85}
                letterSpacing="0.06em"
              >
                i #{i}
              </text>
              <text
                x={BIND_X_LET + BIND_W_LET / 2}
                y={y + 28}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize={13}
                fill="var(--color-bg)"
              >
                {val}
              </text>
            </g>
          );
        })}
      </motion.g>

      {/* Tethers: horizontal, each row to its own cell */}
      {Array.from({ length: N }, (_, i) => {
        const x1 = CB_X + CB_W;
        const y1 = cbCenterY(i);
        const x2 = BIND_X_LET;
        const y2 = cbCenterY(i);
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
          {printedValues.length > 0 ? printedValues.join(" ") : " "}
        </text>
      </g>
    </svg>
  );
}
