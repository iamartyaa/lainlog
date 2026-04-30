"use client";

/**
 * MitigationsChecklist — concrete client-side mitigations the reader's
 * MCP host should implement.
 *
 * Each row carries:
 *   - a short name (the rule).
 *   - a one-line "why" (the attack class it prevents).
 *   - a class chip linking back to the AttackTaxonomy.
 *
 * Tapping a row reveals the "how" — a 2–3 sentence sketch of the
 * implementation pattern. The checkbox is a self-track artefact; we
 * persist nothing across loads, but the visual lets the reader feel the
 * progress through the list.
 *
 * Voice §12: not a glossary; the rules are presented in increasing
 * cost order so the reader sees pin-and-diff before they see HITL gating.
 */

import { useCallback, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { SPRING } from "@/lib/motion";
import { playSound } from "@/lib/audio";

type Mitigation = {
  id: string;
  rule: string;
  why: string;
  cls: "rug pull" | "tool poisoning" | "tool shadowing" | "exfil via output" | "all";
  how: string;
};

const ITEMS: Mitigation[] = [
  {
    id: "pin-descriptions",
    rule: "Pin tool description hashes at install; alert on change.",
    why: "Defeats rug pulls — descriptions can't quietly mutate.",
    cls: "rug pull",
    how: "Compute a stable hash of every tool description on connect. Persist {server, tool, hash} on disk. On notifications/tools/list_changed, recompute and diff. Pause tool calls until the user re-approves.",
  },
  {
    id: "namespace-tools",
    rule: "Namespace tools by server (whatsapp.send_message, not send_message).",
    why: "Defeats tool shadowing — name collisions become explicit.",
    cls: "tool shadowing",
    how: "Internally key every tool by (serverName, toolName). When forwarding to the model, prefix the name (or pass a server tag the model can see). Refuse a list_changed that introduces a name owned by another server without confirmation.",
  },
  {
    id: "sanitise-output",
    rule: "Sanitize tool output before re-feeding to the model.",
    why: "Defeats exfiltration via untrusted output and chained injection.",
    cls: "exfil via output",
    how: "Wrap every tool result in an unambiguous fence the model has been trained to treat as data, not instruction. Strip or flag known injection patterns. Surface result text containing imperative verbs or bare URLs to the user.",
  },
  {
    id: "treat-descriptions",
    rule: "Treat tool descriptions as untrusted strings.",
    why: "Defeats tool poisoning — instructions hidden in descriptions stop being load-bearing.",
    cls: "tool poisoning",
    how: "Apply the same fencing to descriptions as to results. Run a poisoning detector (keyword + LLM grader) at connect time and at every list_changed. Fail closed: if the detector flags, don't ship the tool to the model.",
  },
  {
    id: "restrict-roots",
    rule: "Restrict roots tightly. No /home, no /etc, no $HOME.",
    why: "Limits blast radius of any successful injection.",
    cls: "all",
    how: "Default roots to a single project subtree. Surface every roots/list result to the user and require explicit approval to extend. Refuse roots/list_changed that broadens scope.",
  },
  {
    id: "audit-log",
    rule: "Audit-log every tools/call — request and response.",
    why: "Detects exfiltration after the fact and provides forensics.",
    cls: "all",
    how: "Persist {ts, server, tool, args, result} to a host-local journal the user can inspect. Hash result bodies; alert on results that contain credential-shaped strings or unfamiliar URLs.",
  },
  {
    id: "hitl-sampling",
    rule: "HITL gate on every sampling / elicitation request.",
    why: "Prevents the server from quietly steering the user's own model.",
    cls: "all",
    how: "When a server calls sampling/createMessage or elicitation/create, surface the full prompt and the proposed user-facing question to the user before forwarding. Default deny; require an affirmative click to proceed.",
  },
  {
    id: "rate-limit-reverse",
    rule: "Rate-limit reverse-direction calls (server → client).",
    why: "Containment: a hijacked server can't burst-exfiltrate via sampling.",
    cls: "all",
    how: "Cap server-initiated requests per minute per server. On breach, pause that server's session and surface to the user. Log breaches into the audit journal.",
  },
];

export function MitigationsChecklist() {
  const reduce = useReducedMotion();
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggleCheck = useCallback((id: string) => {
    playSound("Click");
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
  }, []);

  const total = ITEMS.length;
  const done = checked.size;

  return (
    <WidgetShell
      title="Mitigations — what your client must add"
      measurements={`${done} / ${total}`}
      captionTone="prominent"
      caption={
        <>
          The protocol can&apos;t enforce these — your host must. Read top
          to bottom: the rules at the top cost least, the ones at the bottom
          cost most.
        </>
      }
    >
      <style>{`
        .bs-mit {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .bs-mit-row {
          background: var(--color-surface);
          border: 1px solid var(--color-rule);
          border-radius: var(--radius-md);
          padding: var(--spacing-sm) var(--spacing-md);
          display: flex;
          gap: var(--spacing-sm);
          align-items: flex-start;
          transition: border-color 120ms ease;
        }
        .bs-mit-row[data-checked="true"] {
          background: color-mix(in oklab, var(--color-accent) 5%, var(--color-surface));
          border-color: color-mix(in oklab, var(--color-accent) 40%, var(--color-rule));
        }
        .bs-mit-check {
          flex-shrink: 0;
          width: 22px;
          height: 22px;
          margin-top: 2px;
          border: 1px solid var(--color-rule);
          border-radius: var(--radius-sm);
          background: var(--color-surface);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-accent);
          font-family: var(--font-mono);
          font-size: 14px;
          line-height: 1;
        }
        .bs-mit-check[aria-checked="true"] {
          background: var(--color-accent);
          border-color: var(--color-accent);
          color: var(--color-surface);
        }
        .bs-mit-check:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }
        .bs-mit-body {
          flex: 1;
          min-width: 0;
        }
        .bs-mit-rule {
          font-family: var(--font-serif);
          font-size: var(--text-body);
          line-height: 1.5;
          color: var(--color-text);
          background: transparent;
          border: 0;
          padding: 0;
          cursor: pointer;
          text-align: left;
          width: 100%;
        }
        .bs-mit-rule:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
          border-radius: var(--radius-sm);
        }
        .bs-mit-rule[data-checked="true"] {
          color: var(--color-text-muted);
        }
        .bs-mit-meta {
          margin-top: 4px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: var(--spacing-sm);
          font-family: var(--font-sans);
          font-size: var(--text-small);
          color: var(--color-text-muted);
        }
        .bs-mit-cls {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.04em;
          padding: 2px 6px;
          border: 1px solid var(--color-rule);
          border-radius: 999px;
          color: var(--color-accent);
          background: color-mix(in oklab, var(--color-accent) 6%, transparent);
        }
        .bs-mit-how {
          font-family: var(--font-serif);
          font-size: var(--text-small);
          line-height: 1.6;
          color: var(--color-text);
          padding: var(--spacing-sm);
          background: color-mix(in oklab, var(--color-surface) 60%, transparent);
          border: 1px solid var(--color-rule);
          border-radius: var(--radius-sm);
          margin-top: var(--spacing-sm);
        }
      `}</style>

      <div className="bs-mit">
        {ITEMS.map((m) => {
          const isChecked = checked.has(m.id);
          const isOpen = expanded === m.id;
          return (
            <div key={m.id} className="bs-mit-row" data-checked={isChecked}>
              <button
                type="button"
                className="bs-mit-check"
                role="checkbox"
                aria-checked={isChecked}
                aria-label={`mark "${m.rule}" as covered`}
                onClick={() => toggleCheck(m.id)}
              >
                {isChecked ? "✓" : ""}
              </button>
              <div className="bs-mit-body">
                <button
                  type="button"
                  className="bs-mit-rule"
                  data-checked={isChecked}
                  onClick={() => toggleExpand(m.id)}
                  aria-expanded={isOpen}
                >
                  {m.rule}
                </button>
                <div className="bs-mit-meta">
                  <span className="bs-mit-cls">defends · {m.cls}</span>
                  <span>{m.why}</span>
                </div>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      key="how"
                      className="bs-mit-how"
                      initial={
                        reduce ? { opacity: 0 } : { opacity: 0, y: -4 }
                      }
                      animate={{ opacity: 1, y: 0 }}
                      exit={
                        reduce ? { opacity: 0 } : { opacity: 0, y: -4 }
                      }
                      transition={reduce ? { duration: 0 } : SPRING.gentle}
                    >
                      <strong style={{ color: "var(--color-accent)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                        how
                      </strong>
                      {m.how}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </WidgetShell>
  );
}

export default MitigationsChecklist;
