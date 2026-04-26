"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { TextHighlighter } from "@/components/fancy";
import { SPRING } from "@/lib/motion";
import { playSound } from "@/lib/audio";

const HL_COLOR =
  "color-mix(in oklab, var(--color-accent) 28%, transparent)";
const HL_TX = { type: "spring" as const, duration: 0.9, bounce: 0 };

/**
 * A 3 × 6 coverage matrix. Rows = defence layers (Training, Inference,
 * Ecosystem). Columns = agent stages (Perception … Human overseer). A
 * cell's fill shows how well that layer covers that stage. The gaps
 * (Memory, Multi-agent, HITL) are visible.
 *
 * Interaction: tap a row to highlight it and read its detail. Mobile-first:
 * the matrix lays out horizontally on any width, no SVG.
 */

type Cover = 0 | 1 | 2; // 0 = none, 1 = partial, 2 = strong

type Layer = {
  key: string;
  label: string;
  row: [Cover, Cover, Cover, Cover, Cover, Cover];
  note: string;
};

const STAGES = [
  "Perception",
  "Reasoning",
  "Memory",
  "Action",
  "Multi-agent",
  "Human",
];

const LAYERS: Layer[] = [
  {
    key: "training",
    label: "training-time",
    // Perception Reasoning Memory Action Multi-agent Human
    row: [2, 1, 0, 1, 0, 0],
    note: "Adversarial data augmentation and Constitutional AI harden the model itself. Thin coverage on memory; nothing on multi-agent dynamics.",
  },
  {
    key: "inference",
    label: "inference-time",
    row: [2, 2, 1, 2, 0, 1],
    note: "Pre-ingestion filters, content scanners, and output monitors cover perception through action. Memory stores are mostly off-surface; multi-agent is unreachable.",
  },
  {
    key: "ecosystem",
    label: "ecosystem",
    row: [1, 1, 1, 1, 2, 2],
    note: "Reputation systems, AI-intended-content standards, and accountability frameworks wrap almost the whole ring — but only if the ecosystem adopts them. It hasn't.",
  },
];

export function DefenceCoverage() {
  // State 0: nothing is isolated — the reader sees all three layers and
  // chooses which to inspect.
  const [active, setActive] = useState<string | null>(null);
  const focus = LAYERS.find((l) => l.key === active) ?? null;

  return (
    <WidgetShell
      title="defence coverage"
      measurements={focus ? `focus · ${focus.label}` : "3 layers · 6 stages"}
      captionTone="prominent"
      caption={
        <AnimatePresence mode="wait">
          <motion.span
            key={focus?.key ?? "none"}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={SPRING.snappy}
          >
            {focus ? (
              focus.note
            ) : (
              <>
                The pale cells are where defence doesn&apos;t reach — the
                gaps most traps exploit.{" "}
                <TextHighlighter
                  triggerType="auto"
                  transition={HL_TX}
                  highlightColor={HL_COLOR}
                  className="rounded-[0.2em] px-[1px]"
                >
                  Tap a row to isolate a layer.
                </TextHighlighter>
              </>
            )}
          </motion.span>
        </AnimatePresence>
      }
    >
      <div className="bs-dc">
        {/* header row with stage names */}
        <div className="bs-dc-header">
          <span />
          {STAGES.map((s) => (
            <span key={s} className="bs-dc-stage">
              {s}
            </span>
          ))}
        </div>

        {LAYERS.map((l) => {
          const isActive = active === l.key;
          const dimmed = active !== null && !isActive;
          return (
            <button
              key={l.key}
              type="button"
              onClick={() => {
                playSound("Radio");
                setActive(isActive ? null : l.key);
              }}
              aria-pressed={isActive}
              aria-label={`${l.label} defence layer — press to read coverage detail`}
              className="bs-dc-row"
              style={{
                opacity: dimmed ? 0.45 : 1,
              }}
            >
              <span className="bs-dc-label">{l.label}</span>
              {l.row.map((v, ci) => (
                <Cell key={ci} value={v} active={isActive} />
              ))}
            </button>
          );
        })}

        {/* legend */}
        <div className="bs-dc-legend font-sans">
          <LegendSwatch value={2} /> covered
          <LegendSwatch value={1} /> partial
          <LegendSwatch value={0} /> gap
        </div>
      </div>

      <style>{`
        .bs-dc {
          display: grid;
          gap: var(--spacing-sm);
        }
        .bs-dc-header,
        .bs-dc-row {
          display: grid;
          grid-template-columns: minmax(110px, 128px) repeat(6, 1fr);
          gap: 4px;
          align-items: center;
        }
        .bs-dc-row {
          padding: var(--spacing-2xs);
          border: 1px solid transparent;
          border-radius: var(--radius-sm);
          background: transparent;
          cursor: pointer;
          text-align: left;
          transition: border-color 200ms, background 200ms, opacity 200ms;
          min-height: 44px;
          color: inherit;
        }
        .bs-dc-row:hover {
          border-color: var(--color-rule);
        }
        .bs-dc-row[aria-pressed="true"] {
          border-color: var(--color-accent);
          background: color-mix(in oklab, var(--color-accent) 6%, transparent);
        }
        .bs-dc-stage {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          text-align: center;
          line-height: 1.2;
          overflow-wrap: break-word;
        }
        .bs-dc-label {
          font-family: var(--font-sans);
          font-size: var(--text-ui);
          font-weight: 600;
          color: var(--color-text);
        }
        .bs-dc-legend {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: var(--spacing-sm);
          padding-top: var(--spacing-sm);
          font-size: var(--text-small);
          color: var(--color-text-muted);
          margin-left: 132px;
        }
        @container widget (max-width: 560px) {
          .bs-dc-header,
          .bs-dc-row {
            grid-template-columns: 92px repeat(6, 1fr);
          }
          .bs-dc-stage {
            font-size: 9px;
          }
          .bs-dc-legend {
            margin-left: 0;
          }
        }
      `}</style>
    </WidgetShell>
  );
}

function Cell({ value, active }: { value: Cover; active: boolean }) {
  const fill =
    value === 2
      ? "var(--color-accent)"
      : value === 1
        ? "color-mix(in oklab, var(--color-accent) 40%, transparent)"
        : "color-mix(in oklab, var(--color-accent) 6%, transparent)";
  return (
    <motion.span
      initial={false}
      animate={{
        background: fill,
        opacity: active && value === 0 ? 0.4 : 1,
      }}
      transition={SPRING.smooth}
      aria-hidden
      style={{
        display: "block",
        height: 32,
        borderRadius: 4,
        border: "1px solid color-mix(in oklab, var(--color-rule) 60%, transparent)",
      }}
    />
  );
}

function LegendSwatch({ value }: { value: Cover }) {
  const fill =
    value === 2
      ? "var(--color-accent)"
      : value === 1
        ? "color-mix(in oklab, var(--color-accent) 40%, transparent)"
        : "color-mix(in oklab, var(--color-accent) 8%, transparent)";
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: 14,
        height: 14,
        borderRadius: 3,
        background: fill,
        border: "1px solid var(--color-rule)",
        verticalAlign: "middle",
        marginRight: 6,
        marginLeft: 12,
      }}
    />
  );
}
