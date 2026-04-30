"use client";

/**
 * TopologyBuilder — load-bearing widget for chapter 2.
 *
 * The reader picks servers from a palette; each pick adds a client badge
 * inside the host card and an arrow to the server card outside. A toggle
 * on each server flips it between local (stdio) and remote (HTTP) — the
 * arrow icon morphs (pipe ↔ cloud) but the host doesn't change shape,
 * driving the load-bearing claim: <transport is the server's concern, not
 * the host's>.
 *
 * Interaction discipline (interactive-components.md §2.2). Native HTML5
 * drag-and-drop is unreliable on touch and the editorial-calm register
 * doesn't reward chaos. We ship tap/click-to-add as the universal primary
 * interaction — works on touch, mouse, and keyboard. Each palette server
 * is a real <button>: Tab to focus, arrow keys to traverse the palette,
 * Enter to add, Backspace/Delete (or the visible "remove" button) to
 * disconnect. The lesson — "you place this server, a client spawns" — is
 * intact.
 *
 * Frame stability (R6): outer card stays the same size whether 0 or 3
 * servers are connected. The host area reserves space for up to 3 client
 * badges in a horizontal row; the connections grid reserves space for up
 * to 3 rows. Reset is always available.
 *
 * Reduced motion: badge entrances + arrow draws collapse to opacity-only;
 * toggle changes are instant.
 *
 * One accent: terracotta only. Local vs remote reads via icon shape +
 * label, never via colour.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { SPRING } from "@/lib/motion";
import { playSound } from "@/lib/audio";

type ServerId = "filesystem" | "postgres" | "sentry";
type Transport = "local" | "remote";

type ServerDef = {
  id: ServerId;
  name: string;
  /** Default transport when first added. */
  defaultTransport: Transport;
};

const SERVERS: ServerDef[] = [
  { id: "filesystem", name: "Filesystem", defaultTransport: "local" },
  { id: "postgres", name: "Postgres", defaultTransport: "local" },
  { id: "sentry", name: "Sentry", defaultTransport: "remote" },
];

type Connection = {
  serverId: ServerId;
  transport: Transport;
};

const HOST_NAME = "VS Code";

/** Pipe icon — small terminal-pipe glyph for local/stdio transport. */
function PipeIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M2 8 L14 8" />
      <path d="M5 5 L5 11" />
      <path d="M11 5 L11 11" />
    </svg>
  );
}

/** Cloud icon — minimal scribble for remote/HTTP transport. */
function CloudIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 11.5 a3 3 0 0 1 0.5 -5.95 a3.5 3.5 0 0 1 6.7 0.95 a2.5 2.5 0 0 1 -0.2 5 z" />
    </svg>
  );
}

export function TopologyBuilder() {
  const reduce = useReducedMotion();
  const [conns, setConns] = useState<Connection[]>([]);
  const [announce, setAnnounce] = useState("");
  const liveRef = useRef<HTMLDivElement | null>(null);

  const connectedIds = useMemo(
    () => new Set(conns.map((c) => c.serverId)),
    [conns],
  );

  const addServer = useCallback(
    (id: ServerId) => {
      if (connectedIds.has(id)) return;
      const def = SERVERS.find((s) => s.id === id);
      if (!def) return;
      playSound("Click");
      setConns((prev) => [
        ...prev,
        { serverId: id, transport: def.defaultTransport },
      ]);
      setAnnounce(`added ${def.name} as client`);
    },
    [connectedIds],
  );

  const removeServer = useCallback((id: ServerId) => {
    const def = SERVERS.find((s) => s.id === id);
    playSound("Click");
    setConns((prev) => prev.filter((c) => c.serverId !== id));
    if (def) setAnnounce(`removed ${def.name}`);
  }, []);

  const toggleTransport = useCallback((id: ServerId) => {
    playSound("Radio");
    setConns((prev) =>
      prev.map((c) =>
        c.serverId === id
          ? { ...c, transport: c.transport === "local" ? "remote" : "local" }
          : c,
      ),
    );
  }, []);

  const reset = useCallback(() => {
    if (conns.length === 0) return;
    playSound("Click");
    setConns([]);
    setAnnounce("topology reset");
  }, [conns.length]);

  const measurements = `1 host · ${conns.length} client${conns.length === 1 ? "" : "s"} · ${conns.length} connection${conns.length === 1 ? "" : "s"}`;

  return (
    <WidgetShell
      title="topology · build it"
      measurements={measurements}
      captionTone="prominent"
      caption={
        <span>
          Tap a server in the palette to connect it. Each pick spawns a{" "}
          <em>client</em> inside the host. Toggle a server between local
          (pipe) and remote (cloud) — the host doesn't change shape.
        </span>
      }
      controls={
        <button
          type="button"
          onClick={reset}
          disabled={conns.length === 0}
          className="bs-topo-reset"
          aria-label="reset topology"
        >
          ↻ reset
        </button>
      }
    >
      <style>{`
        .bs-topo {
          container-type: inline-size;
          container-name: topo;
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }
        .bs-topo-host {
          position: relative;
          min-height: 96px;
          padding: 14px 16px;
          border-radius: var(--radius-md);
          border: 1px solid color-mix(in oklab, var(--color-accent) 35%, var(--color-rule));
          background: color-mix(in oklab, var(--color-surface) 60%, transparent);
        }
        .bs-topo-host-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--spacing-sm);
          margin-bottom: 10px;
        }
        .bs-topo-host-name {
          font-family: var(--font-sans, system-ui);
          font-size: var(--text-ui);
          font-weight: 600;
          color: var(--color-text);
        }
        .bs-topo-host-tag {
          font-family: var(--font-mono, ui-monospace);
          font-size: var(--text-small);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--color-text-muted);
        }
        .bs-topo-clients {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          min-height: 32px;
        }
        .bs-topo-client {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          background: color-mix(in oklab, var(--color-accent) 14%, transparent);
          border: 1px solid color-mix(in oklab, var(--color-accent) 35%, transparent);
          font-family: var(--font-mono, ui-monospace);
          font-size: var(--text-small);
          color: var(--color-text);
        }
        .bs-topo-client-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: var(--color-accent);
        }
        .bs-topo-empty {
          font-style: italic;
          font-size: var(--text-small);
          color: var(--color-text-muted);
          padding: 4px 0;
        }
        .bs-topo-section-label {
          font-family: var(--font-mono, ui-monospace);
          font-size: var(--text-small);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          margin-bottom: 6px;
        }
        .bs-topo-palette {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
        }
        @container topo (min-width: 480px) {
          .bs-topo-palette {
            grid-template-columns: 1fr 1fr 1fr;
          }
        }
        .bs-topo-pal-btn {
          width: 100%;
          min-height: 44px;
          padding: 10px 12px;
          text-align: left;
          font-family: var(--font-sans, system-ui);
          font-size: var(--text-ui);
          color: var(--color-text);
          border: 1px dashed var(--color-rule);
          border-radius: var(--radius-sm);
          background: transparent;
          cursor: pointer;
          transition: background 200ms, border-color 200ms, opacity 200ms;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .bs-topo-pal-btn:hover:not(:disabled) {
          background: color-mix(in oklab, var(--color-accent) 8%, transparent);
          border-color: color-mix(in oklab, var(--color-accent) 50%, var(--color-rule));
        }
        .bs-topo-pal-btn:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }
        .bs-topo-pal-btn:disabled {
          cursor: default;
          opacity: 0.45;
        }
        .bs-topo-pal-plus {
          color: var(--color-accent);
          font-family: var(--font-mono, ui-monospace);
          font-size: var(--text-ui);
        }
        .bs-topo-conns {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-height: 0;
        }
        .bs-topo-conn {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto auto;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-rule);
          background: color-mix(in oklab, var(--color-surface) 50%, transparent);
        }
        .bs-topo-conn-name {
          font-family: var(--font-sans, system-ui);
          font-size: var(--text-ui);
          color: var(--color-text);
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .bs-topo-conn-arrow {
          font-family: var(--font-mono, ui-monospace);
          font-size: var(--text-small);
          color: var(--color-accent);
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .bs-topo-toggle {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 32px;
          padding: 4px 10px;
          font-family: var(--font-mono, ui-monospace);
          font-size: var(--text-small);
          color: var(--color-text-muted);
          border: 1px solid var(--color-rule);
          border-radius: var(--radius-sm);
          background: transparent;
          cursor: pointer;
        }
        .bs-topo-toggle:hover { color: var(--color-text); }
        .bs-topo-toggle:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }
        .bs-topo-remove {
          min-width: 32px;
          min-height: 32px;
          padding: 4px 8px;
          border: 1px solid var(--color-rule);
          border-radius: var(--radius-sm);
          background: transparent;
          color: var(--color-text-muted);
          cursor: pointer;
          font-family: var(--font-mono, ui-monospace);
          font-size: var(--text-small);
        }
        .bs-topo-remove:hover { color: var(--color-text); }
        .bs-topo-remove:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }
        .bs-topo-reset {
          min-height: 36px;
          padding: 6px 14px;
          border: 1px solid var(--color-rule);
          border-radius: var(--radius-sm);
          background: transparent;
          color: var(--color-text-muted);
          font-family: var(--font-mono, ui-monospace);
          font-size: var(--text-small);
          cursor: pointer;
        }
        .bs-topo-reset:hover:not(:disabled) { color: var(--color-text); }
        .bs-topo-reset:disabled { cursor: default; opacity: 0.45; }
        .bs-topo-reset:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }
      `}</style>

      <div className="bs-topo">
        {/* Live region for a11y announcements */}
        <div
          ref={liveRef}
          aria-live="polite"
          className="sr-only"
        >
          {announce}
        </div>

        {/* HOST */}
        <div className="bs-topo-host" aria-label={`host: ${HOST_NAME}`}>
          <div className="bs-topo-host-head">
            <span className="bs-topo-host-name">{HOST_NAME}</span>
            <span className="bs-topo-host-tag">host</span>
          </div>

          <div className="bs-topo-clients" aria-label="clients inside the host">
            {conns.length === 0 ? (
              <span className="bs-topo-empty">
                no clients yet — pick a server below.
              </span>
            ) : (
              <AnimatePresence initial={false} mode="popLayout">
                {conns.map((c, i) => {
                  const def = SERVERS.find((s) => s.id === c.serverId);
                  return (
                    <motion.span
                      key={c.serverId}
                      className="bs-topo-client"
                      initial={
                        reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.96 }
                      }
                      animate={
                        reduce
                          ? { opacity: 1 }
                          : { opacity: 1, y: 0, scale: 1 }
                      }
                      exit={
                        reduce
                          ? { opacity: 0 }
                          : { opacity: 0, y: -6, scale: 0.96 }
                      }
                      transition={reduce ? { duration: 0 } : SPRING.smooth}
                    >
                      <span className="bs-topo-client-dot" aria-hidden />
                      client #{i + 1} → {def?.name}
                    </motion.span>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* CONNECTIONS — list of active server connections */}
        {conns.length > 0 ? (
          <div className="bs-topo-conns" aria-label="active connections">
            <div className="bs-topo-section-label">connections</div>
            <AnimatePresence initial={false}>
              {conns.map((c) => {
                const def = SERVERS.find((s) => s.id === c.serverId);
                if (!def) return null;
                const isLocal = c.transport === "local";
                return (
                  <motion.div
                    key={c.serverId}
                    className="bs-topo-conn"
                    initial={
                      reduce ? { opacity: 0 } : { opacity: 0, y: 6 }
                    }
                    animate={
                      reduce ? { opacity: 1 } : { opacity: 1, y: 0 }
                    }
                    exit={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
                    transition={reduce ? { duration: 0 } : SPRING.smooth}
                  >
                    <span className="bs-topo-conn-name">
                      <span className="bs-topo-conn-arrow" aria-hidden>
                        ↔ {isLocal ? <PipeIcon /> : <CloudIcon />}
                      </span>
                      {def.name}{" "}
                      <span
                        style={{
                          color: "var(--color-text-muted)",
                          fontFamily:
                            "var(--font-mono, ui-monospace)",
                          fontSize: "var(--text-small)",
                          marginLeft: 4,
                        }}
                      >
                        · {isLocal ? "stdio" : "HTTP"}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="bs-topo-toggle"
                      onClick={() => toggleTransport(c.serverId)}
                      aria-label={
                        isLocal
                          ? `${def.name} transport: local stdio. Tap to make remote.`
                          : `${def.name} transport: remote HTTP. Tap to make local.`
                      }
                    >
                      {isLocal ? "make remote" : "make local"}
                    </button>
                    <button
                      type="button"
                      className="bs-topo-remove"
                      onClick={() => removeServer(c.serverId)}
                      aria-label={`remove ${def.name} connection`}
                    >
                      ✕
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : null}

        {/* PALETTE */}
        <div>
          <div className="bs-topo-section-label">server palette</div>
          <div
            className="bs-topo-palette"
            role="group"
            aria-label="available servers"
          >
            {SERVERS.map((s) => {
              const taken = connectedIds.has(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  className="bs-topo-pal-btn"
                  onClick={() => addServer(s.id)}
                  disabled={taken}
                  aria-label={
                    taken
                      ? `${s.name} already connected`
                      : `add ${s.name} as a server (default ${s.defaultTransport})`
                  }
                >
                  <span className="bs-topo-pal-plus" aria-hidden>
                    {taken ? "✓" : "+"}
                  </span>
                  <span style={{ flex: 1 }}>{s.name}</span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono, ui-monospace)",
                      fontSize: "var(--text-small)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {s.defaultTransport}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </WidgetShell>
  );
}

export default TopologyBuilder;
