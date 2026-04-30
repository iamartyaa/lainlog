"use client";

/**
 * SessionLifecycleStrip — 5-tick scripted stepper for chapter 2.
 *
 * Two lanes — host above, server below — connected by a tick-driven arrow
 * that flips direction depending on who initiates the message at that
 * tick. Five ticks: spawn → connect → initialize → exchange → terminate.
 * Lane chips crossfade per tick to name the local state.
 *
 * Frame stability:
 *  - Lanes use min-height; chip changes are opacity-only, never width/height.
 *  - The arrow renders inside the SVG with motion-driven `pathLength`.
 *  - Reduced motion → arrow appears at pathLength 1 instantly; chips
 *    crossfade with `duration: 0`.
 *
 * Mobile (<720px container width): lanes stack vertically; arrows become
 * down/up between stacked lanes via a CSS rotation on the arrow group.
 *
 * Accessibility: aria-current="step" on the active tick (handled by
 * WidgetNav); a polite live region announces "host: X / server: Y" on tick
 * change; counterNoun="tick".
 */

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { WidgetNav } from "@/components/viz/WidgetNav";
import { SPRING } from "@/lib/motion";

type Tick = {
  label: string;
  /** Direction the message flows at this tick. "none" = no message yet/anymore. */
  dir: "down" | "up" | "none";
  /** Short text describing what flows. Sits on the arrow. */
  message: string;
  /** Host-lane status chip text. */
  hostChip: string;
  /** Server-lane status chip text. */
  serverChip: string;
};

const TICKS: Tick[] = [
  {
    label: "spawn",
    dir: "none",
    message: "host launches the server process",
    hostChip: "host: spawning client #1",
    serverChip: "server: not yet running",
  },
  {
    label: "connect",
    dir: "down",
    message: "open transport (stdio or HTTP)",
    hostChip: "host: client #1 ready",
    serverChip: "server: transport open",
  },
  {
    label: "initialize",
    dir: "down",
    message: "negotiate protocol + capabilities",
    hostChip: "host: sent initialize",
    serverChip: "server: replied with caps",
  },
  {
    label: "exchange",
    dir: "up",
    message: "tools/list, tools/call, …",
    hostChip: "host: calling a tool",
    serverChip: "server: returning result",
  },
  {
    label: "terminate",
    dir: "down",
    message: "close transport, free resources",
    hostChip: "host: client #1 closed",
    serverChip: "server: stopped",
  },
];

export function SessionLifecycleStrip() {
  const [tick, setTick] = useState(0);
  const reduce = useReducedMotion();
  const t = TICKS[tick];

  return (
    <WidgetShell
      title={`session · ${t.label}`}
      measurements={`tick ${tick + 1} · ${TICKS.length}`}
      captionTone="prominent"
      caption={
        <span>
          One client–server connection has a lifecycle. Step through the
          five ticks. The arrow's direction names <em>who</em> sent the
          message; the chips name what each side now knows.
        </span>
      }
      controls={
        <WidgetNav
          value={tick}
          total={TICKS.length}
          onChange={setTick}
          counterNoun="tick"
          ariaLabel="lifecycle tick controls"
        />
      }
    >
      <style>{`
        .bs-life {
          container-type: inline-size;
          container-name: life;
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }
        .bs-life-lane {
          position: relative;
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          min-height: 56px;
          padding: 10px 14px;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-rule);
          background: color-mix(in oklab, var(--color-surface) 50%, transparent);
        }
        .bs-life-lane[data-role="host"] {
          border-color: color-mix(in oklab, var(--color-accent) 35%, var(--color-rule));
        }
        .bs-life-label {
          flex-shrink: 0;
          font-family: var(--font-mono, ui-monospace);
          font-size: var(--text-small);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          min-width: 4.5ch;
        }
        .bs-life-chip {
          font-family: var(--font-sans, system-ui);
          font-size: var(--text-ui);
          color: var(--color-text);
          line-height: 1.4;
        }
        .bs-life-bridge {
          position: relative;
          height: 56px;
        }
        .bs-life-msg {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-mono, ui-monospace);
          font-size: var(--text-small);
          color: var(--color-text-muted);
          pointer-events: none;
        }
      `}</style>

      <div className="bs-life" role="group" aria-label="session lifecycle">
        {/* HOST LANE */}
        <div className="bs-life-lane" data-role="host">
          <span className="bs-life-label">host</span>
          <motion.span
            key={`h-${tick}`}
            className="bs-life-chip"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={reduce ? { duration: 0 } : SPRING.smooth}
            aria-live="polite"
          >
            {t.hostChip}
          </motion.span>
        </div>

        {/* BRIDGE — arrow + label between lanes */}
        <div className="bs-life-bridge" aria-hidden>
          <svg
            viewBox="0 0 360 56"
            width="100%"
            height="56"
            preserveAspectRatio="none"
          >
            <defs>
              <marker
                id="bs-life-arrow-down"
                viewBox="0 0 10 10"
                refX="5"
                refY="9"
                markerWidth="8"
                markerHeight="8"
                orient="auto-start-reverse"
              >
                <path
                  d="M 0 0 L 10 0 L 5 10 z"
                  fill="var(--color-accent)"
                />
              </marker>
              <marker
                id="bs-life-arrow-up"
                viewBox="0 0 10 10"
                refX="5"
                refY="1"
                markerWidth="8"
                markerHeight="8"
                orient="auto-start-reverse"
              >
                <path
                  d="M 0 10 L 10 10 L 5 0 z"
                  fill="var(--color-accent)"
                />
              </marker>
            </defs>
            {t.dir !== "none" ? (
              <motion.line
                key={`arrow-${tick}-${t.dir}`}
                x1="180"
                x2="180"
                y1={t.dir === "down" ? 4 : 52}
                y2={t.dir === "down" ? 52 : 4}
                stroke="var(--color-accent)"
                strokeWidth="2"
                strokeLinecap="round"
                markerEnd={
                  t.dir === "down"
                    ? "url(#bs-life-arrow-down)"
                    : "url(#bs-life-arrow-up)"
                }
                initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={reduce ? { duration: 0 } : SPRING.smooth}
                vectorEffect="non-scaling-stroke"
              />
            ) : (
              <line
                x1="180"
                x2="180"
                y1="4"
                y2="52"
                stroke="var(--color-rule)"
                strokeWidth="1"
                strokeDasharray="3 3"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>
          <div className="bs-life-msg">
            <motion.span
              key={`m-${tick}`}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={reduce ? { duration: 0 } : SPRING.smooth}
              style={{
                background:
                  "color-mix(in oklab, var(--color-surface) 90%, transparent)",
                padding: "2px 8px",
                borderRadius: "var(--radius-sm)",
              }}
            >
              {t.message}
            </motion.span>
          </div>
        </div>

        {/* SERVER LANE */}
        <div className="bs-life-lane" data-role="server">
          <span className="bs-life-label">server</span>
          <motion.span
            key={`s-${tick}`}
            className="bs-life-chip"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={reduce ? { duration: 0 } : SPRING.smooth}
            aria-live="polite"
          >
            {t.serverChip}
          </motion.span>
        </div>
      </div>
    </WidgetShell>
  );
}

export default SessionLifecycleStrip;
