"use client";

/**
 * SamplingApproval — a tiny in-page approval modal mock.
 *
 * Pedagogical role: make the human-in-the-loop checkpoint tactile. The
 * server requested `sampling/createMessage`; before any prompt reaches the
 * host's LLM, the host shows the user this gate. Three buttons:
 * `Allow once`, `Allow always`, `Deny`. The HITL gate IS the spec's safety
 * claim made concrete.
 *
 * Two roles in the chapter:
 *   - Standalone (Content.tsx, around the sampling beat) — the reader can
 *     poke at the gate independent of the timeline.
 *   - Embedded inside ReverseFlowDiagram's "sampling" tab at the gate tick
 *     (compact mode) — the same component, smaller chrome, so the diagram
 *     teaches the same gesture without a second component drift.
 */

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { SPRING } from "@/lib/motion";
import { playSound } from "@/lib/audio";

type Decision = "pending" | "allow-once" | "allow-always" | "deny";

type SamplingApprovalProps = {
  /** Compact = no WidgetShell, render only the modal mock (used inside the
   *  flow diagram). Default false = full WidgetShell with a caption. */
  compact?: boolean;
  /** Optional callback fired on any decision. Lets the parent diagram
   *  advance its tick when the gate has been answered. */
  onDecision?: (decision: Exclude<Decision, "pending">) => void;
};

const PROMPT_PREVIEW = `analyse the 47 flights in this dataset and
recommend the best three by total cost,
including layover penalties.`;

export function SamplingApproval({
  compact = false,
  onDecision,
}: SamplingApprovalProps) {
  const reduce = useReducedMotion();
  const [decision, setDecision] = useState<Decision>("pending");

  const handle = (next: Exclude<Decision, "pending">) => {
    playSound(next === "deny" ? "Error" : "Success");
    setDecision(next);
    onDecision?.(next);
  };

  const reset = () => {
    playSound("Progress-Tick");
    setDecision("pending");
  };

  const verdictText: Record<Exclude<Decision, "pending">, string> = {
    "allow-once": "Allowed for this call. The host will ask again next time.",
    "allow-always":
      "Allowed for this server going forward. Future sampling requests skip the gate.",
    deny: "Denied. The host returns an error to the server; the LLM is never called.",
  };

  const modal = (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Sampling approval"
      className="bs-samp-modal"
    >
      <div className="bs-samp-head">
        <span className="bs-samp-eyebrow">filesystem-server wants to sample your LLM</span>
        <span className="bs-samp-pill">sampling/createMessage</span>
      </div>
      <pre className="bs-samp-prompt">{PROMPT_PREVIEW}</pre>
      <div className="bs-samp-meta">
        <span>maxTokens · 512</span>
        <span>·</span>
        <span>modelPreferences · speed</span>
      </div>
      <AnimatePresence mode="wait">
        {decision === "pending" ? (
          <motion.div
            key="actions"
            className="bs-samp-actions"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={SPRING.gentle}
          >
            <button
              type="button"
              className="bs-samp-btn bs-samp-btn--primary"
              onClick={() => handle("allow-once")}
            >
              allow once
            </button>
            <button
              type="button"
              className="bs-samp-btn"
              onClick={() => handle("allow-always")}
            >
              allow always
            </button>
            <button
              type="button"
              className="bs-samp-btn bs-samp-btn--deny"
              onClick={() => handle("deny")}
            >
              deny
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="verdict"
            className="bs-samp-verdict"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={SPRING.gentle}
            data-decision={decision}
          >
            <span className="bs-samp-verdict-label">
              {decision === "deny" ? "denied" : decision === "allow-once" ? "allowed once" : "allowed always"}
            </span>
            <span className="bs-samp-verdict-text">
              {verdictText[decision]}
            </span>
            <button
              type="button"
              className="bs-samp-btn bs-samp-btn--reset"
              onClick={reset}
            >
              reset
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const styles = (
    <style>{`
      .bs-samp-modal {
        background: var(--color-surface);
        border: 1px solid var(--color-rule);
        border-radius: var(--radius-md);
        padding: var(--spacing-md);
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
        max-width: 100%;
      }
      .bs-samp-head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: var(--spacing-sm);
      }
      .bs-samp-eyebrow {
        font-family: var(--font-sans);
        font-size: var(--text-ui);
        color: var(--color-text);
        letter-spacing: -0.005em;
      }
      .bs-samp-pill {
        font-family: var(--font-mono);
        font-size: 11px;
        padding: 2px 8px;
        border-radius: var(--radius-sm);
        border: 1px solid var(--color-accent);
        color: var(--color-accent);
        background: color-mix(in oklab, var(--color-accent) 8%, transparent);
        white-space: nowrap;
      }
      .bs-samp-prompt {
        font-family: var(--font-mono);
        font-size: 12px;
        line-height: 1.55;
        color: var(--color-text);
        background: color-mix(in oklab, var(--color-surface) 60%, var(--color-bg));
        border: 1px solid var(--color-rule);
        border-radius: var(--radius-sm);
        padding: var(--spacing-sm);
        margin: 0;
        white-space: pre-wrap;
        overflow-x: auto;
      }
      .bs-samp-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        font-family: var(--font-mono);
        font-size: 11px;
        color: var(--color-text-muted);
      }
      .bs-samp-actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-sm);
        margin-top: 4px;
      }
      .bs-samp-btn {
        min-height: 44px;
        padding: 8px 14px;
        font-family: var(--font-sans);
        font-size: var(--text-ui);
        border-radius: var(--radius-md);
        border: 1px solid var(--color-rule);
        background: transparent;
        color: var(--color-text);
        cursor: pointer;
        flex: 1 1 0;
        min-width: 96px;
      }
      .bs-samp-btn:focus-visible {
        outline: 2px solid var(--color-accent);
        outline-offset: 2px;
      }
      .bs-samp-btn--primary {
        border-color: var(--color-accent);
        color: var(--color-accent);
        background: color-mix(in oklab, var(--color-accent) 12%, transparent);
      }
      .bs-samp-btn--deny {
        color: var(--color-text-muted);
      }
      .bs-samp-btn--reset {
        flex: 0 0 auto;
        min-width: 80px;
      }
      .bs-samp-verdict {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-sm);
        border-radius: var(--radius-sm);
        border: 1px solid var(--color-accent);
        background: color-mix(in oklab, var(--color-accent) 8%, transparent);
      }
      .bs-samp-verdict[data-decision="deny"] {
        border-color: var(--color-rule);
        background: color-mix(in oklab, var(--color-text-muted) 6%, transparent);
      }
      .bs-samp-verdict-label {
        font-family: var(--font-mono);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--color-accent);
      }
      .bs-samp-verdict[data-decision="deny"] .bs-samp-verdict-label {
        color: var(--color-text-muted);
      }
      .bs-samp-verdict-text {
        flex: 1 1 200px;
        font-family: var(--font-serif);
        font-size: var(--text-small);
        color: var(--color-text);
        line-height: 1.5;
      }
    `}</style>
  );

  if (compact) {
    return (
      <>
        {styles}
        {modal}
      </>
    );
  }

  return (
    <WidgetShell
      title="The sampling gate — what the host actually shows the user"
      caption={
        <>
          The server&apos;s prompt arrives at the host. Before it reaches the
          LLM, the host shows this. Three answers, three different sessions
          downstream.
        </>
      }
    >
      {styles}
      {modal}
    </WidgetShell>
  );
}

export default SamplingApproval;
