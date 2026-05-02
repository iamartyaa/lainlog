"use client";

import { useState, useMemo } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { TextHighlighter } from "@/components/fancy";
import { SPRING, PRESS } from "@/lib/motion";
import { playSound } from "@/lib/audio";

/**
 * W3 — PassRateOverTime.
 *
 * Time-series of an eval suite's pass rate over 12 weeks. The reader
 * scrubs through the timeline. The line climbs from 60% to 100%, plateaus,
 * and at week 8 a customer-incident dot appears. The reader can press
 * "add hard prompts" to recalibrate — the line drops to 78%, the curve
 * becomes informative again.
 *
 * State machine: scrub through weeks → at week ≥ 6, suite is "saturated"
 * → press "add hard prompts" → recalibrated state.
 */

// 12 weeks of pass-rate %, climbing to 100 by week 6 and plateauing
const RAW: number[] = [62, 71, 78, 85, 92, 100, 100, 100, 100, 100, 100, 100];
const RECAL: number[] = [62, 71, 78, 85, 92, 100, 100, 100, 78, 81, 84, 86];
const INCIDENT_WEEK = 8; // 0-indexed

const W = 360;
const H = 180;
const PAD_X = 28;
const PAD_Y = 18;

function pointsFor(values: number[], upTo: number): string {
  const n = values.length;
  return values
    .slice(0, upTo + 1)
    .map((v, i) => {
      const x = PAD_X + (i / (n - 1)) * (W - PAD_X * 2);
      const y = PAD_Y + (1 - v / 100) * (H - PAD_Y * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function PassRateOverTime() {
  const prefersReducedMotion = useReducedMotion();
  const [week, setWeek] = useState(0);
  const [recalibrated, setRecalibrated] = useState(false);

  const series = recalibrated ? RECAL : RAW;
  const value = series[week];
  const saturated = week >= 6 && !recalibrated;
  const showIncident = week >= INCIDENT_WEEK && !recalibrated;

  const incidentX =
    PAD_X + (INCIDENT_WEEK / (series.length - 1)) * (W - PAD_X * 2);
  const incidentY = PAD_Y + (1 - 100 / 100) * (H - PAD_Y * 2);

  const polyPoints = useMemo(() => pointsFor(series, week), [series, week]);

  const recalibrate = () => {
    if (recalibrated) return;
    playSound("Click");
    setRecalibrated(true);
  };

  const reset = () => {
    playSound("Progress-Tick");
    setWeek(0);
    setRecalibrated(false);
  };

  return (
    <WidgetShell
      title="pass-rate · over time"
      measurements={`week ${week + 1}/${series.length} · ${value}%`}
      canvas={
        <div className="bs-prot-canvas">
          <style>{`
            .bs-prot-canvas {
              padding: var(--spacing-md);
              min-height: 320px;
              display: flex;
              flex-direction: column;
              gap: var(--spacing-sm);
              align-items: center;
            }
            .bs-prot-svg {
              width: 100%;
              max-width: 480px;
              height: auto;
              display: block;
            }
            .bs-prot-axis {
              stroke: var(--color-rule);
              stroke-width: 1;
            }
            .bs-prot-grid {
              stroke: var(--color-rule);
              stroke-width: 1;
              stroke-dasharray: 2 4;
              opacity: 0.5;
            }
            .bs-prot-line {
              fill: none;
              stroke: var(--color-accent);
              stroke-width: 2;
              stroke-linecap: round;
              stroke-linejoin: round;
            }
            .bs-prot-dot {
              fill: var(--color-surface);
              stroke: var(--color-accent);
              stroke-width: 2;
            }
            .bs-prot-incident {
              fill: var(--color-accent);
              stroke: var(--color-bg);
              stroke-width: 2;
            }
            .bs-prot-tick {
              fill: var(--color-text-muted);
              font-family: var(--font-mono);
              font-size: 10px;
            }
            .bs-prot-scrubber {
              width: 100%;
              max-width: 480px;
            }
          `}</style>

          <svg
            className="bs-prot-svg"
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={`Eval pass-rate at week ${week + 1}: ${value}%`}
          >
            {/* Y-axis grid lines at 60, 80, 100 */}
            {[60, 80, 100].map((v) => {
              const y = PAD_Y + (1 - v / 100) * (H - PAD_Y * 2);
              return (
                <g key={v}>
                  <line
                    className="bs-prot-grid"
                    x1={PAD_X}
                    x2={W - PAD_X}
                    y1={y}
                    y2={y}
                  />
                  <text
                    className="bs-prot-tick"
                    x={PAD_X - 6}
                    y={y + 3}
                    textAnchor="end"
                  >
                    {v}%
                  </text>
                </g>
              );
            })}

            {/* X-axis baseline */}
            <line
              className="bs-prot-axis"
              x1={PAD_X}
              x2={W - PAD_X}
              y1={H - PAD_Y}
              y2={H - PAD_Y}
            />
            <text
              className="bs-prot-tick"
              x={PAD_X}
              y={H - 4}
              textAnchor="start"
            >
              wk 1
            </text>
            <text
              className="bs-prot-tick"
              x={W - PAD_X}
              y={H - 4}
              textAnchor="end"
            >
              wk {series.length}
            </text>

            {/* The pass-rate line, drawn up to current week */}
            <motion.polyline
              className="bs-prot-line"
              points={polyPoints}
              initial={false}
              animate={{ opacity: 1 }}
              transition={
                prefersReducedMotion ? { duration: 0 } : SPRING.smooth
              }
            />

            {/* Current dot at the leading edge */}
            <motion.circle
              className="bs-prot-dot"
              cx={
                PAD_X + (week / (series.length - 1)) * (W - PAD_X * 2)
              }
              cy={PAD_Y + (1 - value / 100) * (H - PAD_Y * 2)}
              r={4}
              initial={false}
              animate={{ opacity: 1 }}
              transition={
                prefersReducedMotion ? { duration: 0 } : SPRING.snappy
              }
            />

            {/* Customer-incident dot — appears at week 8 */}
            <AnimatePresence>
              {showIncident ? (
                <motion.circle
                  key="incident"
                  className="bs-prot-incident"
                  cx={incidentX}
                  cy={incidentY - 12}
                  r={5}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={
                    prefersReducedMotion ? { duration: 0 } : SPRING.snappy
                  }
                />
              ) : null}
            </AnimatePresence>
            {showIncident ? (
              <text
                className="bs-prot-tick"
                x={incidentX + 9}
                y={incidentY - 9}
                textAnchor="start"
                style={{ fill: "var(--color-text)" }}
              >
                customer reported
              </text>
            ) : null}
          </svg>

          <input
            type="range"
            className="bs-prot-scrubber"
            min={0}
            max={series.length - 1}
            value={week}
            onChange={(e) => {
              setWeek(Number(e.target.value));
            }}
            aria-label="Scrub through weeks"
          />
        </div>
      }
      state={
        recalibrated ? (
          <span>
            You added hard prompts. The line drops; the suite is{" "}
            <TextHighlighter
              transition={{ type: "spring", duration: 0.9, bounce: 0 }}
              highlightColor="color-mix(in oklab, var(--color-accent) 28%, transparent)"
              useInViewOptions={{ once: true, amount: 0.55 }}
              className="rounded-[0.2em] px-[1px]"
            >
              tasting again.
            </TextHighlighter>{" "}
            That 78% is where the signal lives.
          </span>
        ) : saturated ? (
          <span>
            The line says you&apos;ve solved it.{" "}
            <TextHighlighter
              transition={{ type: "spring", duration: 0.9, bounce: 0 }}
              highlightColor="color-mix(in oklab, var(--color-accent) 28%, transparent)"
              useInViewOptions={{ once: true, amount: 0.55 }}
              className="rounded-[0.2em] px-[1px]"
            >
              The customer disagrees.
            </TextHighlighter>{" "}
            A 100% pass rate is what eval saturation looks like.
          </span>
        ) : (
          <span>
            Team Evals&apos; pass rate, over twelve weeks. Scrub forward —{" "}
            <TextHighlighter
              transition={{ type: "spring", duration: 0.9, bounce: 0 }}
              highlightColor="color-mix(in oklab, var(--color-accent) 28%, transparent)"
              useInViewOptions={{ once: true, amount: 0.55 }}
              className="rounded-[0.2em] px-[1px]"
            >
              watch what happens after week six.
            </TextHighlighter>
          </span>
        )
      }
      controls={
        <div className="flex items-center gap-[var(--spacing-sm)] flex-wrap">
          <motion.button
            type="button"
            onClick={recalibrate}
            disabled={recalibrated || !saturated}
            className="bs-vvr-commit"
            {...PRESS}
          >
            + add hard prompts
          </motion.button>
          <motion.button
            type="button"
            onClick={reset}
            className="bs-vvr-commit"
            {...PRESS}
          >
            ↺ reset
          </motion.button>
        </div>
      }
    />
  );
}
