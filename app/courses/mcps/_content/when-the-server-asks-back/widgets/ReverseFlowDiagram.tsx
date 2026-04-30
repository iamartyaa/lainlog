"use client";

/**
 * ReverseFlowDiagram — the load-bearing widget for chapter 8.
 *
 * Three tabs (sampling | elicitation | roots), each a 4-tick flow that
 * interleaves three actors (server, client, user). The HITL checkpoints
 * render with a terracotta diamond marker; on the relevant tick, the
 * corresponding sub-widget mounts inline so the gate is not just diagrammed
 * but operable.
 *
 * Tick scripts (per tab):
 *   sampling:
 *     1. server → client      sampling/createMessage      (request lands)
 *     2. client → user        HITL gate (request review)  → SamplingApproval
 *     3. user → client        approved; client samples its host LLM
 *     4. client → server      response w/ completion       (HITL gate 2 implied)
 *
 *   elicitation:
 *     1. server → client      elicitation/create + schema
 *     2. client → user        host renders the form        → ElicitationForm
 *     3. user → client        user submits values
 *     4. client → server      response w/ form data
 *
 *   roots:
 *     1. server → client      roots/list (or client → server `notifications/
 *                             roots/list_changed`)
 *     2. client                client reads its declared roots → RootsManager
 *     3. client → server      response w/ roots list
 *     4. server                server now operates inside those bounds
 *                             (coordination, not enforcement)
 *
 * Controls: Step / Auto-play / Reset (via WidgetNav). Reduced motion safe.
 * One accent only. Three lanes stack on narrow viewports.
 */

import { useCallback, useId, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { WidgetNav } from "@/components/viz/WidgetNav";
import { SPRING } from "@/lib/motion";
import { SamplingApproval } from "./SamplingApproval";
import { ElicitationForm } from "./ElicitationForm";
import { RootsManager } from "./RootsManager";

type Lane = "server" | "client" | "user";
type Scenario = "sampling" | "elicitation" | "roots";

type Tick = {
  /** Origin lane of the action (where the arrow / event begins). */
  from: Lane;
  /** Destination lane (or same as `from` for self-events). */
  to: Lane;
  /** Method / event label shown on the arrow. */
  label: string;
  /** Short caption for the prose-voice slot below the lanes. */
  caption: string;
  /** Whether this tick is a human-in-the-loop checkpoint. */
  hitl?: boolean;
  /** Optional embedded widget — mounts when the tick fires. */
  embed?: "sampling-approval" | "elicitation-form" | "roots-manager";
};

const SCRIPTS: Record<Scenario, Tick[]> = {
  sampling: [
    {
      from: "server",
      to: "client",
      label: "sampling/createMessage",
      caption:
        "1 · The server wants the host's LLM. It sends sampling/createMessage with the prompt, modelPreferences, and maxTokens.",
    },
    {
      from: "client",
      to: "user",
      label: "request review",
      caption:
        "2 · HITL gate one. The host shows the user the prompt and asks: do you consent to this server sampling your LLM?",
      hitl: true,
      embed: "sampling-approval",
    },
    {
      from: "user",
      to: "client",
      label: "approved · sample LLM",
      caption:
        "3 · The user approved. The client samples its host LLM with the prompt; the model returns a completion.",
    },
    {
      from: "client",
      to: "server",
      label: "response · completion",
      caption:
        "4 · HITL gate two (implicit on this lane). Before the completion goes back to the server, the host could surface it to the user; once approved, the response sails.",
      hitl: true,
    },
  ],
  elicitation: [
    {
      from: "server",
      to: "client",
      label: "elicitation/create",
      caption:
        "1 · The server is missing a piece of information mid-flow. It sends elicitation/create with a JSON-Schema fragment for the form it wants.",
    },
    {
      from: "client",
      to: "user",
      label: "render form from schema",
      caption:
        "2 · The host renders the schema as a form. The HITL gate is the form itself — the user filling it IS the response.",
      hitl: true,
      embed: "elicitation-form",
    },
    {
      from: "user",
      to: "client",
      label: "submit values",
      caption:
        "3 · The user submits. The client packages the values into the elicitation response payload.",
    },
    {
      from: "client",
      to: "server",
      label: "response · { action, content }",
      caption:
        "4 · The response goes back to the server. action is accept | decline | cancel; content carries the values when accepted.",
    },
  ],
  roots: [
    {
      from: "server",
      to: "client",
      label: "roots/list",
      caption:
        "1 · The server asks the client what directories it's allowed to operate inside. The client could also push notifications/roots/list_changed any time the user moves the workspace.",
    },
    {
      from: "client",
      to: "client",
      label: "read declared roots",
      caption:
        "2 · The client reads its current roots. No HITL gate here — the user already declared the boundary at workspace setup; this is just coordination on the wire.",
      embed: "roots-manager",
    },
    {
      from: "client",
      to: "server",
      label: "response · [ roots ]",
      caption:
        "3 · The client returns the roots list as file:// URIs. The server now knows the bounds it should respect.",
    },
    {
      from: "server",
      to: "server",
      label: "operate inside bounds",
      caption:
        "4 · The server operates inside the declared bounds. Coordination, not enforcement — nothing on the wire stops a misbehaving server from straying. (This sets up chapter 9.)",
    },
  ],
};

const SCENARIO_LABELS: Record<Scenario, string> = {
  sampling: "sampling",
  elicitation: "elicitation",
  roots: "roots",
};

const SCENARIO_BLURBS: Record<Scenario, string> = {
  sampling: "server wants the host's LLM",
  elicitation: "server asks the user a structured question",
  roots: "client tells the server where it can operate",
};

export function ReverseFlowDiagram() {
  const reduce = useReducedMotion();
  const liveRegionId = useId();
  const tablistId = useId();

  const [scenario, setScenario] = useState<Scenario>("sampling");
  // -1 = idle (no tick fired yet); 0..3 = tick fired.
  const [tick, setTick] = useState<number>(-1);

  const ticks = SCRIPTS[scenario];

  const handleScenarioChange = useCallback((next: Scenario) => {
    setScenario(next);
    setTick(-1);
  }, []);

  const handleTickChange = useCallback((next: number) => {
    // WidgetNav drives 0..total-1; we map it onto our -1..3 range.
    setTick(next);
  }, []);

  const handleReset = useCallback(() => {
    setTick(-1);
  }, []);

  const announce = useMemo(() => {
    if (tick < 0) return `Idle on ${scenario}.`;
    const t = ticks[tick];
    return `Tick ${tick + 1} of ${ticks.length} — ${t.from} to ${t.to}, ${t.label}.`;
  }, [tick, ticks, scenario]);

  const captionText = useMemo(() => {
    if (tick < 0) {
      return `Pick a scenario, then step through the four ticks. Watch the ${SCENARIO_BLURBS[scenario]}.`;
    }
    if (tick >= ticks.length) {
      return "Flow complete. Reset to play it again, or switch scenarios above.";
    }
    return ticks[tick].caption;
  }, [tick, ticks, scenario]);

  return (
    <WidgetShell
      title="Server-asks-back, three views — sampling, elicitation, roots"
      measurements={
        tick < 0
          ? `tick 0 / ${ticks.length} · ${scenario}`
          : `tick ${Math.min(tick + 1, ticks.length)} / ${ticks.length} · ${scenario}`
      }
      caption={captionText}
      captionTone="prominent"
      controls={
        <div className="flex flex-wrap items-center justify-center gap-[var(--spacing-sm)]">
          <WidgetNav
            value={Math.max(tick, 0)}
            total={ticks.length}
            onChange={handleTickChange}
            counterNoun="tick"
            playable={true}
          />
          <button
            type="button"
            onClick={handleReset}
            className="font-sans"
            style={{
              minHeight: 36,
              padding: "6px 12px",
              border: "1px solid var(--color-rule)",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--text-ui)",
              color: "var(--color-text-muted)",
              background: "transparent",
              cursor: "pointer",
            }}
            aria-label="Reset to idle"
          >
            ↺ reset
          </button>
        </div>
      }
    >
      <div
        id={liveRegionId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {announce}
      </div>

      <style>{`
        .bs-rfd {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }
        .bs-rfd-tabs {
          display: flex;
          gap: 4px;
          padding: 4px;
          background: color-mix(in oklab, var(--color-surface) 70%, transparent);
          border: 1px solid var(--color-rule);
          border-radius: var(--radius-md);
          flex-wrap: wrap;
        }
        .bs-rfd-tab {
          flex: 1 1 100px;
          min-height: 44px;
          padding: 8px 12px;
          font-family: var(--font-sans);
          font-size: var(--text-ui);
          color: var(--color-text-muted);
          background: transparent;
          border: 0;
          border-radius: var(--radius-sm);
          cursor: pointer;
          letter-spacing: -0.005em;
          text-align: center;
        }
        .bs-rfd-tab[aria-selected="true"] {
          color: var(--color-accent);
          background: color-mix(in oklab, var(--color-accent) 12%, transparent);
        }
        .bs-rfd-tab:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }
        .bs-rfd-tab-blurb {
          display: block;
          font-size: 11px;
          font-family: var(--font-mono);
          color: var(--color-text-muted);
          margin-top: 2px;
          opacity: 0.8;
        }
        .bs-rfd-stage {
          background: color-mix(in oklab, var(--color-surface) 70%, transparent);
          border: 1px solid var(--color-rule);
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }
        .bs-rfd-lanes {
          display: grid;
          grid-template-columns: 80px 1fr;
          gap: 8px var(--spacing-sm);
          align-items: center;
        }
        .bs-rfd-lane-label {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--color-text-muted);
          text-transform: lowercase;
          letter-spacing: 0.04em;
          text-align: right;
        }
        .bs-rfd-lane {
          position: relative;
          height: 36px;
          background: var(--color-bg);
          border: 1px solid var(--color-rule);
          border-radius: var(--radius-sm);
          overflow: hidden;
        }
        .bs-rfd-lane[data-active="true"] {
          border-color: var(--color-accent);
          background: color-mix(in oklab, var(--color-accent) 8%, var(--color-bg));
        }
        .bs-rfd-arrow-overlay {
          margin-left: 80px;
          margin-top: 4px;
          position: relative;
          height: 28px;
        }
        .bs-rfd-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-accent);
          background: color-mix(in oklab, var(--color-accent) 12%, var(--color-surface));
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--color-text);
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .bs-rfd-arrow[data-hitl="true"] {
          border-style: dashed;
          background: color-mix(in oklab, var(--color-accent) 18%, var(--color-surface));
        }
        .bs-rfd-arrow-glyph {
          color: var(--color-accent);
          font-family: var(--font-mono);
        }
        .bs-rfd-hitl {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 2px 8px;
          margin-left: 6px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-accent);
          background: color-mix(in oklab, var(--color-accent) 16%, transparent);
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--color-accent);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .bs-rfd-hitl-diamond {
          display: inline-block;
          width: 8px;
          height: 8px;
          background: var(--color-accent);
          transform: rotate(45deg);
        }
        .bs-rfd-embed {
          background: var(--color-bg);
          border: 1px dashed var(--color-accent);
          border-radius: var(--radius-md);
          padding: var(--spacing-sm);
        }
        .bs-rfd-embed-eyebrow {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--color-accent);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 8px;
        }
      `}</style>

      <div className="bs-rfd">
        {/* Scenario tabs */}
        <div
          className="bs-rfd-tabs"
          role="tablist"
          aria-label="Server-asks-back scenarios"
          id={tablistId}
        >
          {(Object.keys(SCRIPTS) as Scenario[]).map((s) => {
            const selected = scenario === s;
            return (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                className="bs-rfd-tab"
                onClick={() => handleScenarioChange(s)}
              >
                {SCENARIO_LABELS[s]}
                <span className="bs-rfd-tab-blurb">{SCENARIO_BLURBS[s]}</span>
              </button>
            );
          })}
        </div>

        {/* Stage: three lanes + arrows + embed */}
        <div className="bs-rfd-stage">
          {(["server", "client", "user"] as Lane[]).map((lane) => {
            const t = tick >= 0 && tick < ticks.length ? ticks[tick] : null;
            const active = t ? t.from === lane || t.to === lane : false;
            return (
              <div key={lane} className="bs-rfd-lanes">
                <div className="bs-rfd-lane-label">{lane}</div>
                <div className="bs-rfd-lane" data-active={active}>
                  <AnimatePresence>
                    {t && (t.from === lane || t.to === lane) ? (
                      <motion.div
                        key={`${scenario}-${tick}-${lane}`}
                        className="bs-rfd-arrow"
                        data-hitl={t.hitl ? "true" : "false"}
                        initial={
                          reduce ? { opacity: 0 } : { opacity: 0, x: t.from === lane ? -8 : 8 }
                        }
                        animate={{
                          opacity: 1,
                          x: 0,
                          left: lane === t.from ? "8px" : undefined,
                          right: lane === t.to && lane !== t.from ? "8px" : undefined,
                        }}
                        exit={{ opacity: 0 }}
                        transition={SPRING.smooth}
                        style={{
                          left: lane === t.from ? 8 : undefined,
                          right: lane === t.to && lane !== t.from ? 8 : undefined,
                        }}
                      >
                        <span className="bs-rfd-arrow-glyph">
                          {t.from === t.to ? "↻" : lane === t.from ? "→" : "←"}
                        </span>
                        <span>{t.label}</span>
                        {t.hitl && lane === "user" ? (
                          <span className="bs-rfd-hitl">
                            <span className="bs-rfd-hitl-diamond" aria-hidden />
                            HITL
                          </span>
                        ) : null}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}

          {/* Embed slot — mounts the relevant sub-widget when its tick fires. */}
          <AnimatePresence mode="wait">
            {tick >= 0 && tick < ticks.length && ticks[tick].embed ? (
              <motion.div
                key={`${scenario}-${tick}-embed`}
                className="bs-rfd-embed"
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={SPRING.gentle}
              >
                <div className="bs-rfd-embed-eyebrow">
                  what the host actually shows · try it
                </div>
                {ticks[tick].embed === "sampling-approval" ? (
                  <SamplingApproval compact />
                ) : null}
                {ticks[tick].embed === "elicitation-form" ? (
                  <ElicitationForm compact />
                ) : null}
                {ticks[tick].embed === "roots-manager" ? (
                  <RootsManager compact />
                ) : null}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </WidgetShell>
  );
}

export default ReverseFlowDiagram;
