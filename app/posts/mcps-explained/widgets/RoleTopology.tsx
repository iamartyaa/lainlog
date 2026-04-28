"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { TextHighlighter } from "@/components/fancy";
import { SPRING } from "@/lib/motion";
import { playSound } from "@/lib/audio";

const HL_COLOR = "color-mix(in oklab, var(--color-accent) 28%, transparent)";
const HL_TX = { type: "spring" as const, duration: 0.9, bounce: 0 };

function CaptionCue({ children }: { children: React.ReactNode }) {
  return (
    <TextHighlighter
      triggerType="auto"
      transition={HL_TX}
      highlightColor={HL_COLOR}
      className="rounded-[0.2em] px-[1px]"
    >
      {children}
    </TextHighlighter>
  );
}

type ServerId = "fs" | "github" | "notion" | "slack";

type Server = {
  id: ServerId;
  name: string;
  caps: string;
};

const SERVERS: Server[] = [
  { id: "fs", name: "Filesystem", caps: "tools · resources · roots" },
  { id: "github", name: "GitHub", caps: "tools · resources" },
  { id: "notion", name: "Notion", caps: "tools · prompts · sampling" },
  { id: "slack", name: "Slack", caps: "tools · prompts" },
];

const VERDICTS: Record<ServerId, React.ReactNode> = {
  fs: (
    <>
      <CaptionCue>Filesystem can&apos;t see anything else.</CaptionCue> Not the
      conversation, not GitHub, not Notion, not Slack. Its world is the JSON-RPC
      pipe and the roots it was given.
    </>
  ),
  github: (
    <>
      <CaptionCue>GitHub can&apos;t see Notion.</CaptionCue> Each server runs in
      its own client envelope — the host is the only piece of software that
      sees both at once.
    </>
  ),
  notion: (
    <>
      <CaptionCue>Notion can request a model completion.</CaptionCue> But via
      sampling, gated by the host. It never reaches the model directly, and it
      never sees what you typed before invoking it.
    </>
  ),
  slack: (
    <>
      <CaptionCue>Slack can&apos;t see your conversation.</CaptionCue> Each
      tool call is a fresh JSON-RPC envelope — no scrollback, no hidden
      context unless the host explicitly attaches it.
    </>
  ),
};

/**
 * RoleTopology (§2) — host / client / server topology with scan-reveal. The
 * host card sits on top with the model glyph; four client pipes run inside;
 * four server cards sit outside. Tap any server: that server highlights, the
 * conversation pane and the other servers visibly grey out via opacity. The
 * frame stays the same size; only opacity moves (DESIGN.md §9 — no
 * width/height animations).
 *
 * Mobile-first: the layout is a flex column at narrow widths (host on top,
 * servers stacked below as a chip strip). At 600 px container width and up,
 * a CSS grid puts host above and servers in a 4-up row. The outer frame
 * height is reserved for the largest layout so the page never reflows.
 *
 * Audio: `Click` on server-tap (Tier-1 audio cue per audio playbook).
 *
 * Accessibility: server cards are buttons inside `role="group"`; the
 * highlight is conveyed via opacity AND a leading "▸" mark (not colour
 * alone — DESIGN.md a11y).
 */
export function RoleTopology() {
  const [active, setActive] = useState<ServerId | null>(null);

  const verdict = active ? VERDICTS[active] : null;

  return (
    <WidgetShell
      title="three roles · one boundary"
      measurements={active ? `viewing · ${active}` : "tap a server"}
      captionTone="prominent"
      caption={
        active ? (
          verdict
        ) : (
          <>
            <CaptionCue>Tap a server</CaptionCue> to see what it can&apos;t see.
            Each server lives behind its own client; the host is the only piece
            of software that holds the user&apos;s trust and the model.
          </>
        )
      }
    >
      <style>{`
        .bs-rt-grid {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }
        .bs-rt-servers {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-sm);
        }
        @container widget (min-width: 600px) {
          .bs-rt-servers {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        .bs-rt-server {
          min-height: 78px;
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-rule);
          background: color-mix(in oklab, var(--color-surface) 60%, transparent);
          color: var(--color-text);
          text-align: left;
          cursor: pointer;
          transition: opacity 220ms, border-color 220ms, background 220ms;
        }
        .bs-rt-server:hover:not(:disabled) {
          border-color: color-mix(in oklab, var(--color-accent) 50%, var(--color-rule));
        }
        .bs-rt-server:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }
        .bs-rt-host {
          min-height: 96px;
          padding: var(--spacing-sm) var(--spacing-md);
          border-radius: var(--radius-md);
          border: 1px solid var(--color-rule);
          background: color-mix(in oklab, var(--color-accent) 6%, var(--color-surface));
          transition: opacity 220ms;
        }
        .bs-rt-conv {
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          background: var(--color-bg);
          border: 1px dashed var(--color-rule);
          color: var(--color-text-muted);
          font-size: var(--text-small);
          line-height: 1.4;
          transition: opacity 220ms;
        }
      `}</style>

      <div className="bs-rt-grid">
        {/* Host card with model + conversation. Dims when a server is active. */}
        <motion.div
          className="bs-rt-host"
          animate={{ opacity: active ? 0.45 : 1 }}
          transition={SPRING.smooth}
        >
          <div
            className="flex items-baseline justify-between"
            style={{ fontSize: "var(--text-small)" }}
          >
            <span
              className="font-mono"
              style={{
                color: "var(--color-text-muted)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              host · Claude Desktop
            </span>
            <span
              className="font-mono"
              style={{ color: "var(--color-accent)" }}
              aria-label="model"
            >
              ◆ Sonnet 4.5
            </span>
          </div>
          <div
            className="bs-rt-conv mt-[var(--spacing-2xs)] font-serif"
            aria-label="user conversation"
          >
            <em>“Summarise yesterday&apos;s commits to the auth repo.”</em>
          </div>
          <div
            className="mt-[var(--spacing-2xs)] flex flex-wrap gap-[var(--spacing-2xs)] font-mono"
            style={{ fontSize: 11, color: "var(--color-text-muted)" }}
            aria-label="four MCP clients, one per server"
          >
            <span>· client → fs</span>
            <span>· client → github</span>
            <span>· client → notion</span>
            <span>· client → slack</span>
          </div>
        </motion.div>

        {/* Server row. Each card a button — tap to scan-reveal. */}
        <div
          role="group"
          aria-label="MCP servers"
          className="bs-rt-servers"
        >
          {SERVERS.map((s) => {
            const isActive = active === s.id;
            const isDimmed = active !== null && !isActive;
            return (
              <motion.button
                key={s.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  playSound("Click");
                  setActive((prev) => (prev === s.id ? null : s.id));
                }}
                className="bs-rt-server"
                animate={{
                  opacity: isDimmed ? 0.3 : 1,
                }}
                transition={SPRING.smooth}
                style={{
                  borderColor: isActive
                    ? "var(--color-accent)"
                    : "var(--color-rule)",
                  background: isActive
                    ? "color-mix(in oklab, var(--color-accent) 12%, transparent)"
                    : undefined,
                }}
              >
                <div
                  className="flex items-baseline justify-between font-mono"
                  style={{ fontSize: "var(--text-small)" }}
                >
                  <span
                    style={{
                      color: isActive
                        ? "var(--color-accent)"
                        : "var(--color-text)",
                      fontWeight: 600,
                    }}
                  >
                    <span aria-hidden style={{ marginRight: 6 }}>
                      {isActive ? "▸" : "·"}
                    </span>
                    {s.name}
                  </span>
                </div>
                <div
                  className="mt-[var(--spacing-2xs)] font-mono"
                  style={{
                    fontSize: 11,
                    color: "var(--color-text-muted)",
                  }}
                >
                  {s.caps}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Isolation envelope — what the active server can't see. Only mounts
            when a server is active so unanimated state stays minimal. */}
        <div style={{ minHeight: 56 }}>
          <AnimatePresence mode="wait" initial={false}>
            {active ? (
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={SPRING.smooth}
                className="font-mono"
                style={{
                  fontSize: 11,
                  color: "var(--color-text-muted)",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px dashed color-mix(in oklab, var(--color-accent) 50%, var(--color-rule))",
                  background:
                    "color-mix(in oklab, var(--color-accent) 4%, transparent)",
                }}
              >
                <span style={{ color: "var(--color-accent)" }}>cannot see</span>
                {"  "}
                <span>
                  · the conversation · the other three servers · the model (except
                  via sampling, which the host gates)
                </span>
              </motion.div>
            ) : (
              <span aria-hidden style={{ display: "block", height: 0 }} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </WidgetShell>
  );
}
