"use client";

/**
 * RoleQuiz — premise-quiz opener for chapter 2 of the MCPs course.
 *
 * Asks "in Cursor, when you ask the AI to grep your codebase, who's the
 * host, who's the client, who's the server?" Four plausible options — each
 * modelling a real wrong mental model the reader walks in with. The wrong
 * verdict creates demand for the rest of the chapter; voice-profile §12.1.
 *
 * Wraps the shared <Quiz> primitive (components/widgets/Quiz). All a11y,
 * frame-stability, reduced-motion handling lives there. This file owns the
 * teaching content only.
 */

import { Quiz } from "@/components/widgets/Quiz";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { Code } from "@/components/prose";

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
    You open Cursor and ask the AI to grep your codebase. Behind the scenes,
    Cursor talks to a filesystem MCP server through a small connection
    manager. Map the three roles — <strong>host</strong>,{" "}
    <strong>client</strong>, <strong>server</strong> — to the three actors.
  </p>
);

const OPTIONS = [
  {
    id: "correct",
    label: (
      <span>
        host = <Code>Cursor</Code>; client = the in-Cursor connection
        manager; server = the filesystem process.
      </span>
    ),
  },
  {
    id: "cursor-server",
    label: (
      <span>
        host = your code; client = <Code>Cursor</Code>; server = the
        Anthropic API.
      </span>
    ),
  },
  {
    id: "llm-client",
    label: (
      <span>
        host = the OS; client = the LLM; server = <Code>Cursor</Code>.
      </span>
    ),
  },
  {
    id: "fs-host",
    label: (
      <span>
        host = the filesystem process; client = <Code>Cursor</Code>; server
        = the LLM.
      </span>
    ),
  },
];

const RIGHT_VERDICT = (
  <span>
    Right. The host is the <em>application</em> the human looks at; the
    client is what the host instantiates per server; the server is the
    process that exposes a capability. Three roles, one connection — and
    that connection is what the rest of the chapter is about.
  </span>
);

const WRONG_VERDICT = (
  <span>
    Most readers miss this. The host is the application the human looks at
    (Cursor, Claude Desktop, VS Code); the client is what the host
    instantiates per server — a small connection manager living{" "}
    <em>inside</em> the host; the server is a separate process or remote
    service. The LLM is on the host's side of the wall, not on the
    server's. Read on.
  </span>
);

export function RoleQuiz() {
  return (
    <WidgetShell
      title="role quiz · who's who?"
      measurements="3 roles · 1 connection"
      captionTone="prominent"
      caption={
        <span>
          Pick the mapping you'd give a teammate. The wrong answers each
          model a confusion most readers walk in with.
        </span>
      }
    >
      <div className="px-[var(--spacing-xs)] pt-[var(--spacing-xs)] pb-[var(--spacing-sm)]">
        <Quiz
          question={PROMPT}
          options={OPTIONS}
          correctId="correct"
          rightVerdict={RIGHT_VERDICT}
          wrongVerdict={WRONG_VERDICT}
        />
      </div>
    </WidgetShell>
  );
}

export default RoleQuiz;
