"use client";

/**
 * ComprehensionCheck — end-of-chapter predict-and-reveal for chapter 2.
 *
 * "Cursor opens with three MCP servers configured. How many clients does
 * Cursor instantiate, and why?" Reuses the shared <Quiz> primitive. Voice
 * §12.6 — the comprehension check seals the chapter's load-bearing claim
 * (one client per server). Each wrong-answer verdict gently corrects the
 * specific misconception that option models.
 */

import { Quiz } from "@/components/widgets/Quiz";
import { WidgetShell } from "@/components/viz/WidgetShell";

const PROMPT = (
  <p
    className="font-serif"
    style={{
      fontSize: "var(--text-body)",
      lineHeight: 1.6,
      color: "var(--color-text)",
      margin: 0,
    }}
  >
    Cursor opens with three MCP servers configured in its settings. How
    many clients does Cursor instantiate, and why?
  </p>
);

const OPTIONS = [
  {
    id: "three",
    label: (
      <span>
        Three — one client per configured server, each managing its own
        connection state.
      </span>
    ),
  },
  {
    id: "one",
    label: <span>One — Cursor pools requests across servers.</span>,
  },
  {
    id: "six",
    label: (
      <span>Six — one client for sending and one for receiving per server.</span>
    ),
  },
  {
    id: "zero",
    label: (
      <span>
        Zero until the user invokes a tool — clients are lazy.
      </span>
    ),
  },
];

const RIGHT_VERDICT = (
  <span>
    Three. State, capabilities, and transport all live on the connection.
    Pooling them would lose the isolation the protocol depends on. Carry
    that picture into chapter 3.
  </span>
);

export function ComprehensionCheck() {
  return (
    <WidgetShell
      title="check · how many clients?"
      measurements="3 servers · ?"
      captionTone="muted"
      caption={<span>predict, then pick.</span>}
    >
      <div className="px-[var(--spacing-xs)] pt-[var(--spacing-xs)] pb-[var(--spacing-sm)]">
        <Quiz
          question={PROMPT}
          options={OPTIONS}
          correctId="three"
          rightVerdict={RIGHT_VERDICT}
          wrongVerdict={
            <span>
              The right answer is <strong>three</strong>. State,
              capabilities, and transport all live on the connection;
              pooling them would lose the isolation the protocol depends
              on. Pooling them would force the host to track per-server
              flags everywhere — and the per-client object{" "}
              <em>is</em> that state.
            </span>
          }
        />
      </div>
    </WidgetShell>
  );
}

export default ComprehensionCheck;
