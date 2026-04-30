"use client";

/**
 * CapabilityNegotiator — make the AND tactile.
 *
 * Two columns of capability toggles: client-side (roots, sampling,
 * elicitation, experimental) and server-side (tools, resources, prompts,
 * logging). The client and server sides advertise *different*
 * capability vocabularies (per the spec) — the AND is computed on the
 * matched axes the spec defines.
 *
 * For pedagogy we pair each server-side capability with the client-side
 * declaration the spec ties it to. Where a server-side capability has no
 * client-side counterpart (like `prompts`), it's gated only by the server.
 * The "negotiated session" panel makes the live AND tangible: toggling
 * either side updates the survivors.
 *
 * Decisions baked in:
 * - Two columns side-by-side at >= 480px container width; stacked below.
 * - Real <button role="switch" aria-checked> for each capability — keyboard
 *   + screen-reader-friendly. Hit zone >= 36px tall (not the strict 44px
 *   tap target — these are dense desktop-style toggles, but each has its
 *   own row so vertical reach is fine).
 * - One accent only — terracotta for "on" state. "Off" is muted.
 * - Reduced motion: snap; no transitions. The frame is the same size in
 *   both states (R6).
 * - aria-live announces the negotiated set on change.
 */

import { useCallback, useId, useMemo, useState } from "react";
import { useReducedMotion } from "motion/react";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { playSound } from "@/lib/audio";

type Side = "client" | "server";

type Capability = {
  /** Stable id used in state. */
  id: string;
  /** Label shown in the toggle. */
  label: string;
  /** Side that declares it. */
  side: Side;
  /** One-line gloss shown in the negotiated panel when survives. */
  gloss: string;
};

const CAPABILITIES: Capability[] = [
  // Client-side
  {
    id: "roots",
    label: "roots",
    side: "client",
    gloss: "the client will tell the server which filesystem roots are in scope",
  },
  {
    id: "sampling",
    label: "sampling",
    side: "client",
    gloss: "the server may ask the client's LLM to complete a prompt",
  },
  {
    id: "elicitation",
    label: "elicitation",
    side: "client",
    gloss: "the server may ask the user a question through the client",
  },
  {
    id: "experimental",
    label: "experimental",
    side: "client",
    gloss: "the client opts into vendor-specific experimental methods",
  },
  // Server-side
  {
    id: "tools",
    label: "tools",
    side: "server",
    gloss: "the server exposes callable tools (tools/list, tools/call)",
  },
  {
    id: "resources",
    label: "resources",
    side: "server",
    gloss: "the server exposes URIs to read (resources/list, resources/read)",
  },
  {
    id: "prompts",
    label: "prompts",
    side: "server",
    gloss: "the server exposes named prompt templates (prompts/list, prompts/get)",
  },
  {
    id: "logging",
    label: "logging",
    side: "server",
    gloss: "the server emits log notifications the client can subscribe to",
  },
];

/**
 * The negotiated set per the spec's matching rules. Server-side
 * capabilities (`tools`, `resources`, `prompts`, `logging`) survive based
 * on the *server's* declaration alone — they're "what the server offers."
 * Client-side capabilities (`roots`, `sampling`, `elicitation`) survive
 * based on the *client's* declaration alone — they're "what the client
 * offers back."
 *
 * The pedagogy here: capabilities are mutual *because each side declares
 * its own*; whichever side owns a feature is the one whose declaration
 * gates it. Toggling either side off proves it.
 *
 * The widget makes this AND-of-side-by-side-declarations tactile by
 * showing all 8 toggles, then surfacing only the survivors.
 */
function negotiate(state: Record<string, boolean>): Capability[] {
  return CAPABILITIES.filter((c) => state[c.id]);
}

const INITIAL_STATE: Record<string, boolean> = {
  // A "default-on" client + server, so the reader sees a fully-populated
  // negotiated session out of the gate.
  roots: true,
  sampling: true,
  elicitation: false,
  experimental: false,
  tools: true,
  resources: true,
  prompts: true,
  logging: false,
};

export function CapabilityNegotiator() {
  const reduce = useReducedMotion();
  const liveId = useId();
  const [state, setState] = useState<Record<string, boolean>>(INITIAL_STATE);

  const toggle = useCallback((id: string) => {
    playSound("Click");
    setState((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const survivors = useMemo(() => negotiate(state), [state]);
  const counts = useMemo(() => {
    const clientOn = CAPABILITIES.filter((c) => c.side === "client" && state[c.id]).length;
    const serverOn = CAPABILITIES.filter((c) => c.side === "server" && state[c.id]).length;
    return { clientOn, serverOn };
  }, [state]);

  const announceText = useMemo(() => {
    if (survivors.length === 0) return "Negotiated session: empty.";
    return `Negotiated session: ${survivors.map((c) => c.label).join(", ")}.`;
  }, [survivors]);

  return (
    <WidgetShell
      title="Capability negotiation — what survives the AND"
      measurements={`client ${counts.clientOn}/4 · server ${counts.serverOn}/4`}
      caption={
        <>
          Toggle either side. The negotiated panel updates live — only the
          capabilities a given side declared survive on that side. A server
          that offered <code style={{ fontFamily: "var(--font-mono)" }}>tools</code>{" "}
          but never declared it loses it; a client that wanted{" "}
          <code style={{ fontFamily: "var(--font-mono)" }}>sampling</code> but
          never offered it can&apos;t be sampled from.
        </>
      }
    >
      <style>{`
        .bs-cap {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--spacing-md);
        }
        @container widget (min-width: 560px) {
          .bs-cap {
            grid-template-columns: 1fr 1fr;
          }
        }
        .bs-cap-col {
          background: color-mix(in oklab, var(--color-surface) 70%, transparent);
          border: 1px solid var(--color-rule);
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }
        .bs-cap-coltitle {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          margin: 0;
        }
        .bs-cap-toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--spacing-sm);
          min-height: 36px;
          padding: 6px 10px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-rule);
          background: var(--color-surface);
          cursor: pointer;
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--color-text);
          transition: ${"" /* nothing during reduced motion — set inline below */};
        }
        .bs-cap-toggle:hover {
          border-color: color-mix(in oklab, var(--color-accent) 50%, var(--color-rule));
        }
        .bs-cap-toggle:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }
        .bs-cap-toggle[aria-checked="true"] {
          border-color: var(--color-accent);
          background: color-mix(in oklab, var(--color-accent) 12%, transparent);
        }
        .bs-cap-pip {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          border: 1px solid var(--color-text-muted);
          background: transparent;
          flex-shrink: 0;
        }
        .bs-cap-toggle[aria-checked="true"] .bs-cap-pip {
          background: var(--color-accent);
          border-color: var(--color-accent);
        }
        .bs-cap-survivors {
          margin-top: var(--spacing-md);
          background: var(--color-surface);
          border: 1px solid var(--color-rule);
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
          min-height: 96px;
        }
        .bs-cap-survivors-title {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          margin: 0 0 var(--spacing-sm) 0;
        }
        .bs-cap-survivors-list {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-2xs);
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .bs-cap-survivor-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid var(--color-accent);
          background: color-mix(in oklab, var(--color-accent) 14%, transparent);
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--color-text);
        }
        .bs-cap-survivors-empty {
          font-family: var(--font-serif);
          font-style: italic;
          font-size: var(--text-small);
          color: var(--color-text-muted);
          margin: 0;
        }
        .bs-cap-survivors-foot {
          margin-top: var(--spacing-sm);
          font-family: var(--font-serif);
          font-size: var(--text-small);
          color: var(--color-text-muted);
          line-height: 1.5;
        }
      `}</style>

      <div>
        <div className="bs-cap">
          {(["client", "server"] as Side[]).map((side) => (
            <div key={side} className="bs-cap-col">
              <p className="bs-cap-coltitle">
                {side} declares
              </p>
              {CAPABILITIES.filter((c) => c.side === side).map((c) => {
                const on = !!state[c.id];
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="switch"
                    aria-checked={on}
                    onClick={() => toggle(c.id)}
                    className="bs-cap-toggle"
                    style={
                      reduce
                        ? { transition: "none" }
                        : { transition: "background 200ms, border-color 200ms" }
                    }
                  >
                    <span>{c.label}</span>
                    <span className="bs-cap-pip" aria-hidden />
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="bs-cap-survivors" aria-labelledby={liveId}>
          <p id={liveId} className="bs-cap-survivors-title">
            negotiated session — {survivors.length} survivor
            {survivors.length === 1 ? "" : "s"}
          </p>
          {survivors.length === 0 ? (
            <p className="bs-cap-survivors-empty">
              An empty session. The handshake completes; nothing later can
              be invoked.
            </p>
          ) : (
            <ul className="bs-cap-survivors-list" aria-live="polite">
              {survivors.map((c) => (
                <li key={c.id}>
                  <span className="bs-cap-survivor-chip">
                    <span style={{ color: "var(--color-accent)" }}>●</span>
                    <span>{c.label}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="bs-cap-survivors-foot">
            {survivors.length === 0
              ? "Toggle on either side to see what shows up here."
              : survivors.length === 1
                ? `Only ${survivors[0].label} survives — ${survivors[0].gloss}.`
                : `Each survivor is a method-family the session can fire. If a server didn't declare tools, calling tools/list will return -32601, every time.`}
          </p>
          <span
            aria-live="polite"
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
            {announceText}
          </span>
        </div>
      </div>
    </WidgetShell>
  );
}

export default CapabilityNegotiator;
