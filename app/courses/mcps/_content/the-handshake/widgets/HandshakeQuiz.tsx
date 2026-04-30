"use client";

/**
 * HandshakeQuiz — premise-quiz opener for chapter 4 (voice §12.1).
 *
 * The reader's instinct: "the server lists what it can do; the host calls
 * those things." The chapter's correction: capability negotiation is two-
 * sided. A server's offer of `tools` is moot if the client never declared
 * support for the matching client-side feature.
 *
 * The wrong-answer verdict creates the demand for the chapter's reframe —
 * the AND of both sides — which `CapabilityNegotiator` later makes tactile.
 *
 * Reuses the shipped <Quiz> primitive: radiogroup a11y, reduced-motion fall-
 * back, frame-stable verdict slot, one-accent terracotta highlight.
 */

import { Quiz } from "@/components/widgets/Quiz";
import { WidgetShell } from "@/components/viz/WidgetShell";

export function HandshakeQuiz() {
  return (
    <WidgetShell
      title="What does the server's offer actually license?"
      caption={
        <>
          Predict before you read on. The chapter exists because most readers
          arrive thinking capabilities are unilateral — a permission slip the
          server hands the host. They aren&apos;t.
        </>
      }
    >
      <div className="flex flex-col gap-[var(--spacing-md)]">
        <Quiz
          question={
            <p
              className="font-serif"
              style={{
                fontSize: "var(--text-body)",
                lineHeight: 1.55,
                margin: 0,
              }}
            >
              A server says, in its handshake reply: <em>I support tools,
              resources, and prompts.</em> The client, in its opening
              message, never advertised a{" "}
              <code style={{ fontFamily: "var(--font-mono)" }}>tools</code>{" "}
              capability of its own. What can the host actually invoke
              once the handshake completes?
            </p>
          }
          correctId="and-of-both"
          rightVerdict={
            <>
              Right. Capability negotiation is a mutual declaration —
              the AND of both sides. The server offered three; the client
              opted into none of them at the tools level, so tool calls
              never go on the wire.
            </>
          }
          wrongVerdict={
            <>
              Capability negotiation is two-sided — the host needs to{" "}
              <em>ask</em> for tools too. Without that, the server&apos;s
              offer is moot. What survives is the <em>AND</em> of what both
              sides advertised, which here is the empty set on the tool axis.
            </>
          }
          options={[
            {
              id: "server-only",
              label:
                "Whatever the server advertised — tools, resources, prompts. The server's declaration is the contract.",
            },
            {
              id: "and-of-both",
              label:
                "Only what BOTH sides advertised. The server offered three; the client didn't opt into tools, so tools are off the table.",
            },
            {
              id: "client-only",
              label:
                "Whatever the client asked for. The server's list is just availability — the client picks.",
            },
            {
              id: "everything",
              label:
                "Everything the spec defines. Once the handshake completes, all method names are valid; calls just fail at runtime if unsupported.",
            },
          ]}
        />
      </div>
    </WidgetShell>
  );
}

export default HandshakeQuiz;
