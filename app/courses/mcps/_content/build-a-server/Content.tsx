/**
 * Chapter 6 — Build a server, in the page.
 *
 * Server component. Composes the chapter prose around three widgets:
 *   1. ServerEditorQuiz — premise-quiz opener (voice §12.1).
 *   2. ServerEditor     — LOAD-BEARING. Tabbed registration form (tools |
 *                         resources | prompts) with a "try it" panel that
 *                         synthesizes JSON-RPC responses from the reader's
 *                         declarations. Parsed-stub approach (no eval).
 *   3. (LiveCallStrip is composed inside ServerEditor; not rendered here.)
 *
 * Voice §12 patterns honoured:
 *   - <Term> on first appearance of every spec word.
 *   - Mechanism-first reframe — registration as the mechanism; handler
 *     bodies as a downstream concern.
 *   - Just-in-time vocabulary, no glossary chapter.
 *   - Closer is still prose; loops back to the opener (descriptions matter).
 *   - VerticalCutReveal banned (per playbook).
 *
 * No <hr>, no <br>. Section breaks ride on <H2> + spacing rhythm.
 *
 * The chapter uses the parsed-stub approach (NOT sandboxed eval) per the
 * brainstormer's "Needs decision" call-out, decided in favour of safety
 * and ship-in-one-turn pragmatism. The reader still touches every part of
 * the registration surface — name, description, schema, URI template,
 * prompt arguments — and watches the JSON-RPC shape land live.
 */

import dynamic from "next/dynamic";
import Link from "next/link";
import { Callout, H2, H3, P, Term } from "@/components/prose";
import { CodeBlock } from "@/components/code/CodeBlock";

const ServerEditorQuiz = dynamic(() =>
  import("./widgets/ServerEditorQuiz").then((m) => m.ServerEditorQuiz),
);
const ServerEditor = dynamic(() =>
  import("./widgets/ServerEditor").then((m) => m.ServerEditor),
);

export function Content() {
  return (
    <>
      <P>
        You have the wire from chapter 3, the handshake from chapter 4, and
        the three primitives — tools, resources, prompts — from chapter 5.
        What you don&apos;t have, yet, is a server. The four-message
        exchange that&apos;s been flying through the diagrams was always
        between two real processes; one of them is what this chapter
        builds. The build is small enough to fit in one page, and you
        won&apos;t leave this tab to do it.
      </P>

      <P>
        Before we open the editor, a quick check on what the host actually
        sees when your server replies. Most readers arrive thinking the
        tool name does the heavy lifting. The spec disagrees — and so will
        your model.
      </P>

      <ServerEditorQuiz />

      <H2>The frame, in one paragraph</H2>

      <P>
        An MCP server is a process that registers a small set of named
        primitives and answers JSON-RPC requests about them. The official{" "}
        <Term>SDK</Term> — <code style={{ fontFamily: "var(--font-mono)" }}>@modelcontextprotocol/sdk</code>{" "}
        in TypeScript — does the JSON-RPC plumbing for you: you call{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>registerTool</code>,{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>registerResource</code>,
        and <code style={{ fontFamily: "var(--font-mono)" }}>registerPrompt</code>;
        the SDK turns those calls into the responses for{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>tools/list</code>,{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>resources/list</code>,{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>prompts/list</code>{" "}
        and their corresponding read / call / get methods. No socket code,
        no JSON parsing — you describe what the server has, and the SDK
        carries it onto the wire.
      </P>

      <CodeBlock
        lang="typescript"
        filename="currency-server.ts (the shape, not the prose)"
        code={`import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";
import { z } from "zod";

const server = new McpServer({ name: "currency-server", version: "0.1.0" });

server.registerTool(
  "convert",
  {
    description: "Convert an amount from one currency to another.",
    inputSchema: { from: z.string(), to: z.string(), amount: z.number() },
  },
  async ({ from, to, amount }) => {
    const rate = await rates.get(from, to);
    return { content: [{ type: "text", text: String(rate * amount) }] };
  },
);

server.registerResource("rates", "rates://{date}", {
  mimeType: "application/json",
  description: "FX rates for an ISO date.",
}, async ({ date }) => ({ contents: [{ uri: \`rates://\${date}\`, mimeType: "application/json", text: JSON.stringify(await rates.snapshot(date)) }] }));

server.registerPrompt("recommend-currency-mix", {
  description: "Suggest a multi-currency holding split.",
  arguments: [{ name: "country", required: true }, { name: "horizon" }],
}, async ({ country, horizon }) => ({
  messages: [{ role: "user", content: { type: "text", text: \`Recommend a mix for \${country} over \${horizon ?? "12m"}.\` } }],
}));

await server.connect(new StdioServerTransport());`}
      />

      <P>
        That listing is the end-state — the file you&apos;d write outside
        this page. We&apos;ll build it with our hands in a second. The
        widget below isn&apos;t this exact file in a sandbox, but a{" "}
        <em>parsed-stub equivalent</em> — you fill in registrations through
        a small form, and the page synthesizes the JSON-RPC responses the
        SDK <em>would</em> emit from those declarations. The lesson is
        registration: what the model sees, what the host validates against,
        what the URI template addresses. Handler bodies are a downstream
        concern — you can write them in a real editor after the chapter,
        and the file above is your starting point.
      </P>

      <Callout tone="note">
        We&apos;re not running JavaScript in your browser. The editor below
        synthesizes responses from the registration metadata — the same
        metadata the SDK uses to satisfy{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>tools/list</code>,{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>resources/list</code>,
        and <code style={{ fontFamily: "var(--font-mono)" }}>prompts/list</code>.
        This is the part of the SDK the model actually <em>reads</em>.
      </Callout>

      <H2>A server in your hands</H2>

      <P>
        Open it up. The editor starts with the worked example loaded — a{" "}
        <Term>currency-server</Term> exposing one tool (
        <code style={{ fontFamily: "var(--font-mono)" }}>convert</code>),
        one resource (
        <code style={{ fontFamily: "var(--font-mono)" }}>rates://&#123;date&#125;</code>),
        and one prompt (
        <code style={{ fontFamily: "var(--font-mono)" }}>recommend-currency-mix</code>).
        Edit any of the three, then fire a request from the &quot;try
        it&quot; panel. The response is what a real host would receive over
        stdio.
      </P>

      <ServerEditor />

      <P>
        Three things land while you&apos;re poking at it. First — calling{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>tools/list</code>{" "}
        returns the description text verbatim. That&apos;s the model&apos;s
        only signal for when to call your tool; if you blank it out and
        re-run the call, the entry shows up but reads as a black box.
        Second — calling <code style={{ fontFamily: "var(--font-mono)" }}>tools/call</code>{" "}
        without a required argument doesn&apos;t reach a handler. The host
        validates the arguments against the schema first; the synthesizer
        echoes the validation error the SDK would have thrown. Third — a{" "}
        <Term>URI template</Term> like{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>rates://&#123;date&#125;</code>{" "}
        isn&apos;t a list endpoint. There&apos;s no{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>rates://list</code>{" "}
        — discovery is{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>resources/list</code>,
        access is <code style={{ fontFamily: "var(--font-mono)" }}>resources/read</code>{" "}
        with a substituted URI, and the spec keeps those two surfaces
        cleanly apart.
      </P>

      <H3>One tool, end to end</H3>

      <P>
        Pick the <strong>tools</strong> tab. The{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>convert</code> tool
        carries a name, a description, and an input schema with three
        required fields. Switch the &quot;try it&quot; method to{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>tools/list</code>{" "}
        and send. Note what the model gets back — a{" "}
        <Term>JSON Schema</Term> describing each input, plus your
        description. The schema isn&apos;t Zod on the wire; the SDK
        translates Zod into JSON Schema so any client can validate against
        it without a runtime dependency on Zod itself. Now switch to{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>tools/call</code>,
        pick <code style={{ fontFamily: "var(--font-mono)" }}>convert</code>,
        and fill in the three fields. The synthesized response is a{" "}
        <Term>content array</Term> — the SDK&apos;s canonical reply shape
        for tool calls — with a single text item describing what your
        handler would have returned.
      </P>

      <H3>One resource</H3>

      <P>
        Switch to the <strong>resources</strong> tab. The reader will see{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>rates://&#123;date&#125;</code>{" "}
        — a URI template, not a concrete URI. The placeholder in braces
        becomes a parameter the host substitutes when it asks to read.
        Send a <code style={{ fontFamily: "var(--font-mono)" }}>resources/list</code>{" "}
        and you&apos;ll see the template, the MIME type, and the
        description. Now switch to{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>resources/read</code>{" "}
        and replace the placeholder with{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>2026-04-30</code>.
        The synthesizer matches your URI back against the template and
        synthesizes a response the application would feed to the model.
        Try a URI that doesn&apos;t match — the response carries an error,
        not a list. Resources are <em>content-addressable</em>, not
        enumerable.
      </P>

      <H3>One prompt</H3>

      <P>
        The <strong>prompts</strong> tab carries{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>recommend-currency-mix</code>{" "}
        — the user-controlled surface from chapter 5&apos;s controller
        table. A prompt has a name, a description, an argument list, and a
        body template with{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>&#123;arg&#125;</code>{" "}
        substitutions. Switch to{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>prompts/get</code>,
        pick the prompt, fill in{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>country=JP</code>{" "}
        and <code style={{ fontFamily: "var(--font-mono)" }}>horizon=6m</code>,
        and send. The response is a{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>messages</code>{" "}
        array — pre-formed conversation turns the user invokes via a slash
        command in their host.
      </P>

      <H2>The discipline behind the shapes</H2>

      <P>
        Three rules survive when you peel away the form and look at the
        bytes on the wire. <strong>Descriptions matter</strong>: they&apos;re
        the only thing the <Term>model</Term> reads to decide which tool to
        call. An empty description registers cleanly and is invisible in
        practice; a misleading one hijacks the model&apos;s decisions
        (chapter 9 will cash this in as an attack surface).{" "}
        <strong>Schemas matter</strong>: the <Term>host</Term> validates
        arguments against the input schema before the handler runs.
        Validation errors are the spec&apos;s — not yours; you don&apos;t
        write them.{" "}
        <strong>URI templates matter</strong>: a resource isn&apos;t a
        named record but a content-addressable shape. Hosts list templates
        with <code style={{ fontFamily: "var(--font-mono)" }}>resources/list</code>{" "}
        and read concrete URIs with{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>resources/read</code>{" "}
        — discovery is one method, access is another, and the spec is
        explicit about the separation.
      </P>

      <Callout tone="note">
        In real life, you connect the server to a transport with{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>await server.connect(new StdioServerTransport())</code>.
        Stdio is the right choice when the host spawns the server as a
        subprocess on the same machine. Chapter 7 picks up here — when the
        server lives somewhere else, stdio gives way to streamable HTTP.
      </Callout>

      <H2>Comprehension check</H2>

      <P>
        You register a resource at{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>notes://&#123;id&#125;</code>{" "}
        and the user asks the host to call{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>notes/list</code>.
        What happens?
      </P>

      <details
        className="font-serif"
        style={{
          marginTop: "1em",
          marginBottom: "1em",
          background: "var(--color-surface)",
          padding: "var(--spacing-md)",
          borderRadius: "var(--radius-md)",
          fontSize: "var(--text-body)",
          lineHeight: 1.6,
          border: "1px solid var(--color-rule)",
        }}
      >
        <summary
          style={{
            cursor: "pointer",
            color: "var(--color-text-muted)",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-small)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          reveal answer
        </summary>
        <P>
          Nothing — there is no{" "}
          <code style={{ fontFamily: "var(--font-mono)" }}>notes/list</code>{" "}
          method in the spec. Discovery on the resource axis is{" "}
          <code style={{ fontFamily: "var(--font-mono)" }}>resources/list</code>,
          which returns your template; access is{" "}
          <code style={{ fontFamily: "var(--font-mono)" }}>resources/read</code>{" "}
          with a concrete URI like{" "}
          <code style={{ fontFamily: "var(--font-mono)" }}>notes://abc</code>.
          The two surfaces are deliberately separate: one for &quot;what do
          you have?&quot;, the other for &quot;give me this specific
          thing.&quot; A host that conflates them gets{" "}
          <code style={{ fontFamily: "var(--font-mono)" }}>-32601 method not found</code>{" "}
          — and the spec is right to refuse.
        </P>
      </details>

      <H2>The server is standing. Now what?</H2>

      <P>
        You registered three things, fired six requests, and watched the
        JSON-RPC shapes land. The descriptions on your tools are what the
        model reads; the schemas are what the host enforces; the URI
        templates address content the application can fetch on the
        model&apos;s behalf. Nothing in there is mysterious — the SDK
        handles the wire, you handle the registrations, and the four-
        message handshake from chapter 4 carries the menu across.
      </P>

      <P>
        Which leaves the question we&apos;ve been deferring since chapter
        3. The server is standing. Who&apos;s <em>calling</em> it? The
        host spawned a process and got bytes back over a pipe. We need a
        client — and we need to pick a transport while we&apos;re at it.{" "}
        <Link
          href="/courses/mcps/build-a-client-pick-a-transport"
          className="font-sans"
          style={{ color: "var(--color-accent)" }}
        >
          That&apos;s chapter 7.
        </Link>
      </P>
    </>
  );
}

export default Content;
