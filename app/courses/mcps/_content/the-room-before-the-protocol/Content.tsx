/**
 * Chapter 1 — The room before the protocol.
 *
 * Server component. Renders the chapter's prose arc with the three widgets
 * threaded into the narrative beats called out in the brainstormer brief:
 *
 *   1. PreMcpQuiz opener (premise quiz, voice §12.1)
 *   2. Scene-setting prose
 *   3. Reframe paragraph (M·N adapters)
 *   4. MxNExplorer — the load-bearing widget
 *   5. "USB-C for AI" reveal
 *   6. AdapterTimeline — the four pre-MCP eras
 *   7. First glimpse of `tools/list` flying across stdio (visual only)
 *   8. IntegrationCountQuiz — comprehension check
 *   9. Cliffhanger to chapter 2
 *
 * Voice rules baked in: <Term> on first appearance of every spec word that
 * gets formal treatment later (MCP, host, client, server, tool, JSON-RPC,
 * tools/list); no <hr>, no <br>, no horizontal section dividers — section
 * pacing is carried by typography and widget placement only.
 */

import Link from "next/link";
import { P, H2, Term, Code } from "@/components/prose";
import { MxNExplorer } from "./widgets/MxNExplorer";
import { PreMcpQuiz } from "./widgets/PreMcpQuiz";
import { AdapterTimeline } from "./widgets/AdapterTimeline";
import { IntegrationCountQuiz } from "./widgets/IntegrationCountQuiz";

export function Chapter1Content() {
  return (
    <>
      {/* 1. Premise-quiz opener — voice §12.1. The reader earns agency
          before they earn explanation. */}
      <PreMcpQuiz />

      {/* 2. Scene. Second-person, present tense, one short paragraph. */}
      <P>
        You ask Claude to summarise your Notion doc. Two months ago it
        couldn&apos;t. What changed wasn&apos;t the model — it was the wiring
        between the model and your data.
      </P>

      <P>
        And if you read this as <em>"oh, function-calling, but newer"</em>,
        you&apos;re missing what the wiring used to cost.
      </P>

      <H2>The bill nobody added up</H2>

      <P>
        Before late 2024, every pairing of an AI app and an external system
        was a custom adapter. Cursor wanted to read your filesystem? Cursor
        wrote that adapter. Claude Desktop wanted the same? Anthropic&apos;s
        team wrote a different one. Your internal Slack bot wanted it? You
        wrote a third.
      </P>

      <P>
        With <em>M</em> hosts and <em>N</em> tools, you got{" "}
        <em>M × N</em> adapters. Three hosts × five tools is fifteen
        integrations to author and — quietly worse — fifteen integrations to
        keep alive when any one of them changes shape.
      </P>

      {/* 4. Load-bearing widget — the felt aha. */}
      <MxNExplorer />

      <P>
        Crank M to 4 and N to 9 — a small team with a handful of
        SaaS surfaces — and the count is 36. Toggle the protocol on and it
        collapses to 13. Same hosts. Same tools. One layer between them.
      </P>

      <H2>USB-C for AI</H2>

      <P>
        That&apos;s the elevator pitch the spec leans on, and the metaphor is
        load-bearing. <Term>MCP</Term> — the Model Context Protocol — is the
        single shared shape that sits between hosts and tools, so every host
        learns the protocol once and every tool exposes itself once. The
        cable in the middle does the translation. Anthropic shipped the open
        spec in November 2024; by Q1 2026 the supported-clients list reads
        like the AI tools page of a current laptop: Claude, ChatGPT, VS
        Code, Cursor, Zed, Replit, Codeium, Sourcegraph.
      </P>

      <P>
        The metaphor breaks where you&apos;d expect — USB-C carries power and
        bytes; MCP carries <em>capabilities</em>, and capabilities have to be
        negotiated. We&apos;ll get there. For now, hold onto the shape: one
        protocol, M + N integrations, every host and every tool meeting in
        the middle.
      </P>

      <H2>How we got here</H2>

      <P>
        The protocol didn&apos;t arrive in a vacuum. Each of the four pre-MCP
        eras moved <em>some</em> of the burden — but the M × N never
        collapsed.
      </P>

      {/* 6. AdapterTimeline. */}
      <AdapterTimeline />

      <P>
        Read those panels in order and a pattern shows up: every era moved
        the burden one layer further from the application code, but always
        stopped short of the boundary that mattered. Schemas got typed but
        stayed inside one host&apos;s SDK. Frameworks abstracted vendors but
        stayed inside one runtime. The integration point — the place where
        a host meets a tool — kept getting re-implemented per host.
      </P>

      <P>
        MCP closes that boundary by naming three roles — a{" "}
        <Term>host</Term> (Claude Desktop, Cursor, VS Code), a{" "}
        <Term>client</Term> (the per-server connection manager that lives
        inside the host), and a <Term>server</Term> (the process that exposes
        a tool, a resource, or a prompt). Chapter 2 formalises these. For
        now, it&apos;s enough to know that one protocol speaks across all
        three.
      </P>

      <H2>First glimpse: a message on the wire</H2>

      <P>
        You won&apos;t learn the wire here — that&apos;s chapter 3 — but
        it&apos;s worth seeing one message before we go further. When a host
        first connects to a server, one of the earliest things it asks is{" "}
        <Code>tools/list</Code>: <em>what can you do?</em>
      </P>

      {/* Inline visual-only glimpse of the tools/list message. Not a real
          JSON-RPC document — just the shape, framed as a card so the eye
          knows it's a screenshot of the wire, not body prose. */}
      <div
        className="my-[var(--spacing-lg)] font-mono"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-rule)",
          borderRadius: "var(--radius-md)",
          padding: "var(--spacing-md)",
          fontSize: "var(--text-small)",
          lineHeight: 1.55,
          overflowX: "auto",
        }}
      >
        <div
          style={{
            color: "var(--color-text-muted)",
            fontSize: "0.7rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "0.5em",
          }}
        >
          host → server, over stdio
        </div>
        <pre style={{ margin: 0, color: "var(--color-text)" }}>
{`{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list"
}`}
        </pre>
      </div>

      <P>
        Four fields. <Term>JSON-RPC</Term> 2.0, fifteen years older than the
        protocol that uses it. The server replies with the list of tools it
        offers, each described in a shape the client can render. We&apos;ll
        read that response apart in chapter 3, decode it inside the
        capability handshake in chapter 4, and watch a server hand-author
        one in chapter 6.
      </P>

      <P>
        For this chapter, what matters is that <em>this same message</em>{" "}
        works whether the host is Claude or Cursor or your Slack bot, and
        whether the tool is filesystem search or a Postgres query or a
        flight-booking API. The cable in the middle no longer cares.
      </P>

      <H2>Predict the count</H2>

      <P>
        One last check before we move on. A new SaaS API ships tomorrow.
        Your team — Claude Desktop, Cursor, and an internal Slack bot — wants
        to use it. Pick the integration count, then read the verdict.
      </P>

      {/* 8. Comprehension check. */}
      <IntegrationCountQuiz />

      <P>
        That ratio — one server, N hosts — is what makes MCP a protocol
        instead of a framework. A framework lives inside one runtime. A
        protocol crosses runtimes by naming the shape they have to share.
      </P>

      <H2>What&apos;s next</H2>

      <P>
        We&apos;ve named the problem and watched it collapse. Now: what does
        the solution actually look like at the wire — what are the parts,
        what does each one do, and who talks to whom?{" "}
        <Link
          href="/courses/mcps/host-client-server"
          style={{
            color: "var(--color-accent)",
            textDecoration: "underline",
            textUnderlineOffset: "3px",
          }}
        >
          Chapter 2: three roles, one connection →
        </Link>
      </P>
    </>
  );
}

export default Chapter1Content;
