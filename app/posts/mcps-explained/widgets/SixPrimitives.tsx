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

type PrimitiveId =
  | "tools"
  | "resources"
  | "prompts"
  | "sampling"
  | "roots"
  | "elicitation";

type PrimitiveDef = {
  id: PrimitiveId;
  name: string;
  side: "server" | "client";
  controlled: string;
  /** Direction of the primary call. */
  arrow: "client→server" | "server→client";
  envelope: string;
  detail: React.ReactNode;
};

const ARROW_LABEL: Record<PrimitiveDef["arrow"], string> = {
  "client→server": "client → server",
  "server→client": "server → client",
};

const PRIMITIVES: PrimitiveDef[] = [
  {
    id: "tools",
    name: "tools",
    side: "server",
    controlled: "model-controlled",
    arrow: "client→server",
    envelope: `// tools/call — the model decides to invoke
{ "method": "tools/call",
  "params": {
    "name": "search_files",
    "arguments": { "pattern": "auth.ts" }
  } }`,
    detail: (
      <>
        Tools are arbitrary code the server agrees to run on the model&apos;s
        behalf. Each declares a JSON Schema for its inputs (and, since{" "}
        <code className="font-mono">2025-06-18</code>, an{" "}
        <code className="font-mono">outputSchema</code> for{" "}
        <em>structured</em> tool output). Annotations like{" "}
        <code className="font-mono">readOnlyHint</code> or{" "}
        <code className="font-mono">destructiveHint</code> are{" "}
        <strong>advisory only</strong> — the spec says to treat them as
        untrusted unless the server itself is trusted.
      </>
    ),
  },
  {
    id: "resources",
    name: "resources",
    side: "server",
    controlled: "app-controlled",
    arrow: "client→server",
    envelope: `// resources/read — the host decides what to inject
{ "method": "resources/read",
  "params": { "uri": "file:///workspace/auth.ts" } }`,
    detail: (
      <>
        Resources are URI-keyed read-only context the host injects into the
        model&apos;s working set. The model doesn&apos;t request them; the host
        does (sometimes triggered by the user, sometimes by ambient policy).
        URIs follow RFC 6570 templates —{" "}
        <code className="font-mono">file:///&#123;path&#125;</code>,{" "}
        <code className="font-mono">git://&#123;repo&#125;/&#123;ref&#125;</code>, whatever the server
        defines. Subscriptions push{" "}
        <code className="font-mono">notifications/resources/updated</code> when
        the resource changes.
      </>
    ),
  },
  {
    id: "prompts",
    name: "prompts",
    side: "server",
    controlled: "user-controlled",
    arrow: "client→server",
    envelope: `// prompts/get — the user picks a slash-command
{ "method": "prompts/get",
  "params": {
    "name": "code_review",
    "arguments": { "lang": "typescript" }
  } }`,
    detail: (
      <>
        Prompts are templated chat seeds the user invokes deliberately —
        usually surfaced as slash-commands in the host UI. The server returns a{" "}
        <code className="font-mono">messages[]</code> array that becomes the
        opening of a fresh turn. They&apos;re user-controlled by design, which
        is why they&apos;re the safest of the three: nothing fires unless the
        user typed the slash.
      </>
    ),
  },
  {
    id: "sampling",
    name: "sampling",
    side: "client",
    controlled: "human-gated",
    arrow: "server→client",
    envelope: `// sampling/createMessage — the SERVER asks for a completion
{ "method": "sampling/createMessage",
  "params": {
    "messages": [{ "role": "user", "content": { "type": "text",
      "text": "Summarise this diff in one sentence." } }],
    "modelPreferences": {
      "hints": [{ "name": "claude-sonnet" }],
      "intelligencePriority": 0.6
    },
    "maxTokens": 256
  } }`,
    detail: (
      <>
        <strong>The surprising one.</strong> Sampling lets the server ask the
        host&apos;s model for a completion — and the request goes through{" "}
        <strong>two human-in-the-loop gates</strong> on the way:
        <ol
          className="mt-[var(--spacing-2xs)] pl-[var(--spacing-md)]"
          style={{ listStyle: "decimal" }}
        >
          <li>
            <strong>HITL #1 · before send.</strong> The client surfaces the
            request to the user — messages, system prompt, model preferences —
            and waits for approve / edit / reject.
          </li>
          <li>
            <strong>HITL #2 · before return.</strong> The model&apos;s response
            is shown to the user before it reaches the server. Same three
            options.
          </li>
        </ol>
        <p className="mt-[var(--spacing-2xs)]">
          <code className="font-mono">modelPreferences</code> are{" "}
          <em>hints</em>, not contracts. The host picks the actual model — a
          Sonnet-preferring server can wind up running on Haiku, or a hosted
          model the user pays for. The server never sees an API key. The
          server never sees the user&apos;s broader conversation unless it
          asks for{" "}
          <code className="font-mono">includeContext: &quot;thisServer&quot;</code>.
        </p>
      </>
    ),
  },
  {
    id: "roots",
    name: "roots",
    side: "client",
    controlled: "filesystem boundary",
    arrow: "server→client",
    envelope: `// roots/list — server asks "what may I touch?"
{ "method": "roots/list" }
// → response
{ "result": {
    "roots": [
      { "uri": "file:///workspace/api", "name": "api" },
      { "uri": "file:///workspace/web", "name": "web" }
    ] } }`,
    detail: (
      <>
        Roots are the filesystem boundary the client tells the server it&apos;s
        allowed to operate inside. URIs are always{" "}
        <code className="font-mono">file://</code>. When the user opens a new
        workspace the client fires{" "}
        <code className="font-mono">notifications/roots/list_changed</code>{" "}
        (sub-flag) so the server can refresh. A filesystem MCP server that
        ignores roots is a host-side bug waiting to happen.
      </>
    ),
  },
  {
    id: "elicitation",
    name: "elicitation",
    side: "client",
    controlled: "user form",
    arrow: "server→client",
    envelope: `// elicitation/create — server asks the user a follow-up
{ "method": "elicitation/create",
  "params": {
    "message": "Which calendar should I use?",
    "requestedSchema": {
      "type": "object",
      "properties": {
        "calendar": { "type": "string",
          "enum": ["personal", "work"] }
      } } } }`,
    detail: (
      <>
        Added in <code className="font-mono">2025-06-18</code>. Mid-tool-call,
        the server can ask the user a question with a JSON-Schema-shaped reply.
        The client renders a form, the user fills it, the client returns the
        reply. It lets servers ask for missing parameters without hard-coding
        every choice into the tool input schema. Schema is restricted to
        primitive types — string, number, boolean, enums — so the form is
        always render-able as a single screen.
      </>
    ),
  },
];

const SERVER_PRIMITIVES = PRIMITIVES.filter((p) => p.side === "server");
const CLIENT_PRIMITIVES = PRIMITIVES.filter((p) => p.side === "client");

/**
 * SixPrimitives (§4–§5) — the unifying canvas. Six chips, tap any to expand
 * its detail. Top group: server-side trio (tools / resources / prompts).
 * Bottom group: client-side trio (sampling / roots / elicitation). The
 * single canvas keeps the "six names for one mechanism" frame visible the
 * whole time (voice-profile §12.3).
 *
 * Frame stability (R6): the detail pane has a reserved min-height. The
 * outer frame never grows or shrinks during interaction — only opacity
 * and content swaps move. Mobile-first: chips stack 1×3 on narrow widths,
 * 3×2 on wider widget breakpoints.
 *
 * Audio: `Click` on chip expand/collapse (Tier-1 per audio playbook).
 *
 * Accessibility: chips are buttons in a `role="group"`. Active state via
 * `aria-pressed` plus a leading "▸" mark — never colour alone.
 */
export function SixPrimitives() {
  const [active, setActive] = useState<PrimitiveId | null>(null);
  const def = active ? PRIMITIVES.find((p) => p.id === active) ?? null : null;

  return (
    <WidgetShell
      title="six primitives · one session"
      measurements={
        active ? `viewing · ${active}` : "tap a primitive"
      }
      captionTone="prominent"
      caption={
        def ? (
          <>
            <CaptionCue>
              {def.name} · {def.controlled}
            </CaptionCue>{" "}
            <span style={{ color: "var(--color-text-muted)" }}>
              ({ARROW_LABEL[def.arrow]})
            </span>
          </>
        ) : (
          <>
            <CaptionCue>Three each direction.</CaptionCue> Tap any chip to see
            its envelope shape and who pulls the trigger. Servers offer tools,
            resources, and prompts. Clients offer sampling, roots, and
            elicitation. Same JSON-RPC, six different gestures.
          </>
        )
      }
    >
      <style>{`
        .bs-six-grid {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }
        .bs-six-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--spacing-2xs);
        }
        @container widget (min-width: 480px) {
          .bs-six-row {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        .bs-six-eyebrow {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--color-text-muted);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding-bottom: 4px;
        }
        .bs-six-chip {
          min-height: 64px;
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-rule);
          background: color-mix(in oklab, var(--color-surface) 60%, transparent);
          color: var(--color-text);
          text-align: left;
          cursor: pointer;
          transition: opacity 220ms, border-color 220ms, background 220ms;
        }
        .bs-six-chip:hover:not(:disabled) {
          border-color: color-mix(in oklab, var(--color-accent) 50%, var(--color-rule));
        }
        .bs-six-chip:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }
        .bs-six-detail {
          min-height: 320px;
          border-radius: var(--radius-sm);
          background: color-mix(in oklab, var(--color-surface) 40%, transparent);
          border: 1px dashed var(--color-rule);
          padding: var(--spacing-sm) var(--spacing-md);
        }
        .bs-six-detail-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--spacing-md);
        }
        @container widget (min-width: 720px) {
          .bs-six-detail-grid {
            grid-template-columns: minmax(0, 0.45fr) minmax(0, 0.55fr);
          }
        }
        .bs-six-envelope {
          font-family: var(--font-mono);
          font-size: 11px;
          line-height: 1.5;
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          background: var(--color-bg);
          border: 1px solid var(--color-rule);
          color: var(--color-text);
          white-space: pre;
          overflow-x: auto;
        }
      `}</style>

      <div className="bs-six-grid">
        {/* Server-side trio */}
        <div role="group" aria-label="server-side primitives">
          <div className="bs-six-eyebrow">
            servers expose · client → server
          </div>
          <div className="bs-six-row">
            {SERVER_PRIMITIVES.map((p) => (
              <Chip
                key={p.id}
                p={p}
                isActive={active === p.id}
                isDimmed={active !== null && active !== p.id}
                onClick={() => {
                  playSound("Click");
                  setActive((prev) => (prev === p.id ? null : p.id));
                }}
              />
            ))}
          </div>
        </div>

        {/* Client-side trio */}
        <div role="group" aria-label="client-side primitives">
          <div className="bs-six-eyebrow">
            clients expose · server → client
          </div>
          <div className="bs-six-row">
            {CLIENT_PRIMITIVES.map((p) => (
              <Chip
                key={p.id}
                p={p}
                isActive={active === p.id}
                isDimmed={active !== null && active !== p.id}
                onClick={() => {
                  playSound("Click");
                  setActive((prev) => (prev === p.id ? null : p.id));
                }}
              />
            ))}
          </div>
        </div>

        {/* Detail pane — fixed min-height; content swaps inside it. */}
        <div className="bs-six-detail">
          <AnimatePresence mode="wait" initial={false}>
            {def ? (
              <motion.div
                key={def.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={SPRING.smooth}
                className="bs-six-detail-grid"
              >
                <div className="bs-six-envelope">{def.envelope}</div>
                <div
                  className="font-serif"
                  style={{
                    fontSize: "var(--text-body)",
                    lineHeight: 1.55,
                    color: "var(--color-text)",
                  }}
                >
                  {def.detail}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={SPRING.smooth}
                className="font-sans flex items-center justify-center"
                style={{
                  color: "var(--color-text-muted)",
                  fontSize: "var(--text-small)",
                  textAlign: "center",
                  paddingBlock: "var(--spacing-sm)",
                }}
              >
                <span>
                  Pick any chip. The sampling chip is the longest read.
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </WidgetShell>
  );
}

function Chip({
  p,
  isActive,
  isDimmed,
  onClick,
}: {
  p: PrimitiveDef;
  isActive: boolean;
  isDimmed: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      aria-pressed={isActive}
      onClick={onClick}
      className="bs-six-chip"
      animate={{ opacity: isDimmed ? 0.4 : 1 }}
      transition={SPRING.smooth}
      style={{
        borderColor: isActive ? "var(--color-accent)" : "var(--color-rule)",
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
            color: isActive ? "var(--color-accent)" : "var(--color-text)",
            fontWeight: 600,
          }}
        >
          <span aria-hidden style={{ marginRight: 6 }}>
            {isActive ? "▸" : "·"}
          </span>
          {p.name}
        </span>
      </div>
      <div
        className="mt-[var(--spacing-2xs)] font-mono"
        style={{
          fontSize: 11,
          color: "var(--color-text-muted)",
        }}
      >
        {p.controlled}
      </div>
    </motion.button>
  );
}
