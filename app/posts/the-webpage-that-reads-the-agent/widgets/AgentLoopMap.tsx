"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { WidgetNav, SvgDefs } from "@/components/viz";
import { TextHighlighter } from "@/components/fancy";
import { SPRING } from "@/lib/motion";

const HL_COLOR =
  "color-mix(in oklab, var(--color-accent) 28%, transparent)";
const HL_TX = { type: "spring" as const, duration: 0.9, bounce: 0 };

type Stage = {
  label: string;
  className: string;
  mechanism: string;
};

const STAGES: Stage[] = [
  {
    label: "Perception",
    className: "Content Injection",
    mechanism:
      "the agent parses what the browser eventually discards — comments, aria-labels, hidden pixels.",
  },
  {
    label: "Reasoning",
    className: "Semantic Manipulation",
    mechanism:
      "no command. framing, tone and attributed authorship bend the model's synthesis.",
  },
  {
    label: "Memory & Learning",
    className: "Cognitive State",
    mechanism:
      "poisoned retrieval and memory that echo across sessions and users.",
  },
  {
    label: "Action",
    className: "Behavioural Control",
    mechanism:
      "jailbreaks and confused-deputy exfil turn the agent's tools into the channel.",
  },
  {
    label: "Multi-agent",
    className: "Systemic",
    mechanism:
      "homogeneous agents react to the same signal and fail in concert.",
  },
  {
    label: "Human overseer",
    className: "Human-in-the-Loop",
    mechanism:
      "the agent is weaponised to exploit the supervising human.",
  },
];

const N = STAGES.length;
// SVG authored for a 360-unit square viewBox — scales fluidly.
const CX = 180;
const CY = 180;
const R = 110;

function polar(i: number, r: number = R) {
  const theta = (i / N) * Math.PI * 2 - Math.PI / 2;
  return { x: CX + r * Math.cos(theta), y: CY + r * Math.sin(theta) };
}

export function AgentLoopMap() {
  const [step, setStep] = useState(0);
  const active = STAGES[step];
  const prev = (step - 1 + N) % N;
  const next = (step + 1) % N;

  return (
    <WidgetShell
      title="agent loop · six stages"
      captionTone="prominent"
      caption={
        <AnimatePresence mode="wait">
          <motion.span
            key={step}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={SPRING.snappy}
          >
            {step === 0 ? (
              <>
                <TextHighlighter
                  triggerType="auto"
                  transition={HL_TX}
                  highlightColor={HL_COLOR}
                  className="rounded-[0.2em] px-[1px]"
                >
                  Step through the loop
                </TextHighlighter>{" "}
                — each stop pins a class of trap to the stage of cognition
                it attacks. Stage 1: <strong
                  style={{
                    fontFamily: "var(--font-sans)",
                    color: "var(--color-accent)",
                    fontWeight: 600,
                  }}
                >
                  {active.className}
                </strong>{" "}
                — {active.mechanism}
              </>
            ) : (
              <>
                <strong
                  style={{
                    fontFamily: "var(--font-sans)",
                    color: "var(--color-accent)",
                    fontWeight: 600,
                  }}
                >
                  {active.className}
                </strong>{" "}
                — {active.mechanism}
              </>
            )}
          </motion.span>
        </AnimatePresence>
      }
      controls={
        <WidgetNav
          value={step}
          total={N}
          onChange={setStep}
          playInterval={2400}
          counterNoun="stage"
        />
      }
    >
      <div className="mx-auto" style={{ maxWidth: 420 }}>
        <svg
          viewBox="0 0 360 360"
          role="img"
          aria-label={`Agent operational loop; stage ${step + 1} of ${N}: ${active.label}, ${active.className}`}
          style={{ width: "100%", height: "auto", display: "block" }}
        >
          <SvgDefs />

          {/* dashed ring */}
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke="var(--color-rule)"
            strokeWidth={1}
            strokeDasharray="2 5"
          />

          {/* arrowed arc highlighting the direction to next stage */}
          {(() => {
            const a = polar(step, R);
            const b = polar(step + 1, R);
            return (
              <motion.line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="var(--color-accent)"
                strokeWidth={2}
                strokeLinecap="round"
                initial={false}
                animate={{ opacity: 0.8 }}
                transition={SPRING.smooth}
              />
            );
          })()}

          {/* nodes */}
          {STAGES.map((s, i) => {
            const p = polar(i, R);
            const isActive = i === step;
            const isEdge = i === prev || i === next;
            return (
              <motion.circle
                key={s.label}
                cx={p.x}
                cy={p.y}
                initial={false}
                animate={{
                  r: isActive ? 14 : isEdge ? 9 : 7,
                }}
                transition={SPRING.snappy}
                fill={
                  isActive
                    ? "var(--color-accent)"
                    : "var(--color-bg)"
                }
                stroke={
                  isActive
                    ? "var(--color-accent)"
                    : "var(--color-rule)"
                }
                strokeWidth={1.5}
              />
            );
          })}

          {/* outer stage labels (Plex Mono, small caps) */}
          {STAGES.map((s, i) => {
            const p = polar(i, R + 32);
            const theta = (i / N) * Math.PI * 2 - Math.PI / 2;
            const cos = Math.cos(theta);
            const anchor =
              Math.abs(cos) < 0.3 ? "middle" : cos > 0 ? "start" : "end";
            const isActive = i === step;
            return (
              <motion.text
                key={`l-${s.label}`}
                x={p.x}
                y={p.y}
                textAnchor={anchor}
                dominantBaseline="middle"
                initial={false}
                animate={{ opacity: isActive ? 1 : 0.4 }}
                transition={SPRING.snappy}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  fill: isActive
                    ? "var(--color-text)"
                    : "var(--color-text-muted)",
                }}
              >
                {s.label}
              </motion.text>
            );
          })}

          {/* centre cluster */}
          <text
            x={CX}
            y={CY - 10}
            textAnchor="middle"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fill: "var(--color-text-muted)",
            }}
          >
            the agent
          </text>
          <AnimatePresence mode="wait">
            <motion.text
              key={step}
              x={CX}
              y={CY + 14}
              textAnchor="middle"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={SPRING.snappy}
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 15,
                fontWeight: 600,
                fill: "var(--color-accent)",
              }}
            >
              {active.className}
            </motion.text>
          </AnimatePresence>
        </svg>
      </div>
    </WidgetShell>
  );
}
