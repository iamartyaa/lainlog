"use client";

/**
 * ProtocolVersionExplorer — version negotiation as a footnote, made felt.
 *
 * A two-tab toggle between "2024-11-05" (initial spec) and "2025-06-18"
 * (current). Each tab renders the initialize handshake JSON for that
 * version, side-by-side mentally; the differences are highlighted by a
 * subtle terracotta-tinted background on changed lines.
 *
 * No ad-hoc diff library — the change set is small, author-curated, and
 * keyed by line. The point is to show that protocolVersion is *negotiated*
 * (server returns its supported version; client decides whether to
 * proceed), not to teach a diff tool.
 *
 * Decisions:
 * - Reduced motion: snap; no transitions. Frame size is identical.
 * - One accent only — terracotta tint on changed lines.
 * - Mobile: tabs stack on top, JSON pane below. Width is fluid.
 * - aria-controls + aria-selected on the tablist.
 */

import { useId, useState } from "react";
import { useReducedMotion } from "motion/react";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { playSound } from "@/lib/audio";

type Version = "2024-11-05" | "2025-06-18";

type Line = {
  text: string;
  /** Marked as changed vs the *other* version. */
  changed?: boolean;
};

const SAMPLES: Record<Version, { request: Line[]; response: Line[] }> = {
  "2024-11-05": {
    request: [
      { text: "{" },
      { text: '  "jsonrpc": "2.0",' },
      { text: '  "id": 1,' },
      { text: '  "method": "initialize",' },
      { text: '  "params": {' },
      { text: '    "protocolVersion": "2024-11-05",', changed: true },
      { text: '    "clientInfo": {' },
      { text: '      "name": "claude-desktop",' },
      { text: '      "version": "0.6.0"' },
      { text: "    }," },
      { text: '    "capabilities": {' },
      { text: '      "roots": { "listChanged": true }' },
      { text: "    }" },
      { text: "  }" },
      { text: "}" },
    ],
    response: [
      { text: "{" },
      { text: '  "jsonrpc": "2.0",' },
      { text: '  "id": 1,' },
      { text: '  "result": {' },
      { text: '    "protocolVersion": "2024-11-05",', changed: true },
      { text: '    "serverInfo": {' },
      { text: '      "name": "filesystem-server",' },
      { text: '      "version": "0.4.0"' },
      { text: "    }," },
      { text: '    "capabilities": {' },
      { text: '      "tools": { "listChanged": true },' },
      { text: '      "resources": { "subscribe": true }' },
      { text: "    }" },
      { text: "  }" },
      { text: "}" },
    ],
  },
  "2025-06-18": {
    request: [
      { text: "{" },
      { text: '  "jsonrpc": "2.0",' },
      { text: '  "id": 1,' },
      { text: '  "method": "initialize",' },
      { text: '  "params": {' },
      { text: '    "protocolVersion": "2025-06-18",', changed: true },
      { text: '    "clientInfo": {' },
      { text: '      "name": "claude-desktop",' },
      { text: '      "version": "0.9.4"' },
      { text: "    }," },
      { text: '    "capabilities": {' },
      { text: '      "roots": { "listChanged": true },' },
      { text: '      "elicitation": {},', changed: true },
      { text: '      "_meta": { "client.timezone": "UTC" }', changed: true },
      { text: "    }" },
      { text: "  }" },
      { text: "}" },
    ],
    response: [
      { text: "{" },
      { text: '  "jsonrpc": "2.0",' },
      { text: '  "id": 1,' },
      { text: '  "result": {' },
      { text: '    "protocolVersion": "2025-06-18",', changed: true },
      { text: '    "serverInfo": {' },
      { text: '      "name": "filesystem-server",' },
      { text: '      "version": "1.2.0",' },
      { text: '      "title": "Local Filesystem"', changed: true },
      { text: "    }," },
      { text: '    "capabilities": {' },
      { text: '      "tools": { "listChanged": true },' },
      { text: '      "resources": { "subscribe": true },' },
      { text: '      "prompts": {}' },
      { text: "    }," },
      { text: '    "instructions": "Read-only by default; ask before writing."', changed: true },
      { text: "  }" },
      { text: "}" },
    ],
  },
};

const VERSIONS: Version[] = ["2024-11-05", "2025-06-18"];

export function ProtocolVersionExplorer() {
  const reduce = useReducedMotion();
  const [version, setVersion] = useState<Version>("2025-06-18");
  const tabsId = useId();

  const sample = SAMPLES[version];

  const select = (v: Version) => {
    if (v === version) return;
    playSound("Radio");
    setVersion(v);
  };

  const summary =
    version === "2025-06-18"
      ? "2025-06-18 added _meta on capabilities, an optional title on serverInfo, and a top-level instructions string the host can surface to the model. The reader sees them as faint terracotta-tinted lines below."
      : "2024-11-05 was the initial spec. clientInfo and serverInfo carry only name + version; capabilities are the bare set; no _meta, no instructions, no title.";

  return (
    <WidgetShell
      title="Two specs, side-by-side — what changed across protocol versions"
      measurements={`spec ${version}`}
      caption={summary}
      controls={
        <div
          role="tablist"
          aria-label="Protocol version"
          id={tabsId}
          className="inline-flex"
          style={{
            border: "1px solid var(--color-rule)",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            background: "var(--color-surface)",
          }}
        >
          {VERSIONS.map((v) => {
            const active = v === version;
            return (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={active}
                aria-current={active ? "true" : undefined}
                onClick={() => select(v)}
                className="font-mono"
                style={{
                  minHeight: 36,
                  padding: "6px 14px",
                  border: 0,
                  borderRight:
                    v === VERSIONS[0] ? "1px solid var(--color-rule)" : "0",
                  background: active
                    ? "color-mix(in oklab, var(--color-accent) 16%, transparent)"
                    : "transparent",
                  color: active ? "var(--color-accent)" : "var(--color-text-muted)",
                  fontSize: "12px",
                  cursor: "pointer",
                  transition: reduce ? "none" : "background 160ms, color 160ms",
                  letterSpacing: "0.02em",
                }}
              >
                {v}
              </button>
            );
          })}
        </div>
      }
    >
      <style>{`
        .bs-pve {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--spacing-md);
        }
        @container widget (min-width: 640px) {
          .bs-pve {
            grid-template-columns: 1fr 1fr;
          }
        }
        .bs-pve-pane {
          background: var(--color-surface);
          border: 1px solid var(--color-rule);
          border-radius: var(--radius-md);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .bs-pve-panehead {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          padding: 6px var(--spacing-md);
          border-bottom: 1px solid var(--color-rule);
        }
        .bs-pve-pre {
          margin: 0;
          padding: var(--spacing-sm) 0;
          font-family: var(--font-mono);
          font-size: 12px;
          line-height: 1.55;
          overflow-x: auto;
        }
        .bs-pve-line {
          display: block;
          padding: 0 var(--spacing-md);
          white-space: pre;
          color: var(--color-text);
        }
        .bs-pve-line[data-changed="true"] {
          background: color-mix(in oklab, var(--color-accent) 12%, transparent);
          border-left: 2px solid var(--color-accent);
          padding-left: calc(var(--spacing-md) - 2px);
        }
      `}</style>

      <div className="bs-pve">
        {(["request", "response"] as const).map((kind) => (
          <div key={kind} className="bs-pve-pane">
            <div className="bs-pve-panehead">
              {kind === "request" ? "client → server · initialize" : "server → client · initialize result"}
            </div>
            <pre className="bs-pve-pre" key={`${version}-${kind}`}>
              {sample[kind].map((ln, i) => (
                <span
                  key={i}
                  className="bs-pve-line"
                  data-changed={ln.changed ? "true" : undefined}
                >
                  {ln.text || " "}
                </span>
              ))}
            </pre>
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}

export default ProtocolVersionExplorer;
