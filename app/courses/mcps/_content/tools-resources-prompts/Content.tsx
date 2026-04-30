/**
 * Chapter 5 — Tools, resources, prompts: the server's three voices.
 *
 * Server component. The chapter's load-bearing widget IS the opener — per
 * the issue brief, the picker doubles as premise quiz and payoff because
 * the chapter's lesson is exactly the picking discipline. The chapter prose
 * paces to:
 *
 *   1. PrimitivePicker      (opener + spine)
 *   2. ControllerTable      (the reference shape)
 *   3. UriTemplateBuilder   (resources beat)
 *
 * Voice §12 anchors:
 *   §12.1 — premise quiz opener (`PrimitivePicker`'s first scenario sets
 *            the wrong-answer demand the chapter resolves).
 *   §12.2 — mechanism-first reframe — "everything is a tool" is named and
 *            corrected immediately.
 *   §12.5 — `<Term>` on first appearance of every spec word.
 *   §12.6 — every widget has a ramp + landing paragraph.
 *   §12.8 — closer loops back to the controller question and hands off to
 *            chapter 6.
 *
 * Bans observed: no <hr>, no <br>, no VerticalCutReveal, single accent only.
 */

import dynamic from "next/dynamic";
import Link from "next/link";
import { Callout, H2, H3, P, Term } from "@/components/prose";
import { CodeBlock } from "@/components/code/CodeBlock";

// Client widgets — lazy-imported so the chapter route is a server boundary
// and only the widget JS ships when it's hydrated. WidgetShell renders its
// dot scaffold on first paint; the canvas fades in on hydration.
const PrimitivePicker = dynamic(
  () => import("./widgets/PrimitivePicker").then((m) => m.PrimitivePicker),
);
const ControllerTable = dynamic(
  () => import("./widgets/ControllerTable").then((m) => m.ControllerTable),
);
const UriTemplateBuilder = dynamic(
  () =>
    import("./widgets/UriTemplateBuilder").then((m) => m.UriTemplateBuilder),
);

export function Content() {
  return (
    <>
      <P>
        The handshake closed. Both sides agreed on a version, the capability
        sets locked in, and the server&apos;s reply listed what it offers:{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>tools</code>,{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>resources</code>,{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>prompts</code>. Three
        names. Three primitives. And a load-bearing question the spec settles
        but most readers arrive without an answer to: <em>which of these
        should this thing be?</em>
      </P>

      <P>
        Pick wrong and the integration <em>feels</em> wrong. A{" "}
        <Term>tool</Term> that should have been a <Term>resource</Term> gets
        called too aggressively. A resource that should have been a{" "}
        <Term>prompt</Term> never surfaces to the user. The chapter&apos;s
        whole job is the picking discipline. Start with it.
      </P>

      <PrimitivePicker />

      <P>
        If your first reflex on most of those scenarios was{" "}
        <em>tool</em> — that&apos;s the OpenAI function-calling habit
        talking. Function-calling normalised a world where every server-side
        capability is something the model invokes, with typed parameters,
        when it decides to. MCP says: <em>that&apos;s one of three</em>. The
        other two have different controllers. Naming them is the rest of the
        chapter.
      </P>

      <H2>The first instinct is wrong</H2>

      <P>
        &ldquo;Everything is a tool&rdquo; is the function-calling brain
        defaulting. It&apos;s the most common mistake new MCP server authors
        make, and it&apos;s the lesson the picker just exposed. The fix is a
        single question, asked of every integration sketch:
      </P>

      <p
        className="font-serif"
        style={{
          paddingLeft: "1.4em",
          borderLeft: "2px solid var(--color-accent)",
          margin: "1em 0",
          fontStyle: "italic",
          fontSize: "var(--text-body)",
          lineHeight: 1.6,
          color: "var(--color-text)",
        }}
      >
        Who decides when this fires?
      </p>

      <P>
        Three answers, three primitives. The model decides → it&apos;s a tool.
        The host application decides → it&apos;s a resource. The user decides
        → it&apos;s a prompt. That&apos;s the <Term>controller</Term> axis,
        and it&apos;s the only axis that matters for picking.
      </P>

      <H2>Tools — model-controlled</H2>

      <P>
        A tool is a function the LLM can invoke during reasoning. The server
        registers it with a name, a description, and a <Term>JSON Schema</Term>{" "}
        for its parameters; the host advertises{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>tools/list</code>{" "}
        results to the model; the model decides when to call. The wire
        methods are exactly two:
      </P>

      <ul
        className="font-serif"
        style={{
          fontSize: "var(--text-body)",
          lineHeight: 1.6,
          paddingLeft: "1.4em",
          margin: "1em 0",
        }}
      >
        <li style={{ marginBottom: "0.4em" }}>
          <code style={{ fontFamily: "var(--font-mono)" }}>tools/list</code>{" "}
          — the host asks for the catalogue; the server returns the names,
          descriptions, and input schemas.
        </li>
        <li>
          <code style={{ fontFamily: "var(--font-mono)" }}>tools/call</code>{" "}
          — the host invokes a named tool with arguments; the server runs it
          and returns a structured{" "}
          <code style={{ fontFamily: "var(--font-mono)" }}>content</code> array
          (text, images, or references to resources).
        </li>
      </ul>

      <P>
        The mental model: tools are <em>verbs</em> the model gets to use.{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>search_flights</code>,{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>convert_currency</code>,{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>send_email</code>.
        Each has a clear input contract; each does something. The model fires
        them when it judges it useful — eagerly, sometimes too eagerly. That
        eagerness is the cost of the model-controlled axis, and it&apos;s why
        not everything should be a tool.
      </P>

      <H2>Resources — application-controlled</H2>

      <P>
        A <Term>resource</Term> is a piece of read-only data the server
        exposes — but the LLM doesn&apos;t fetch it. The host application
        decides when to surface a resource as context. The reader can think
        of resources as the server&apos;s catalogue of <em>things to read</em>;
        the host folds the right thing into the conversation when the moment
        calls for it.
      </P>

      <P>
        Resources are addressed by a <Term>URI template</Term>: a short
        scheme-and-path with named slots that get filled at request time. The
        host calls{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>resources/templates/list</code>{" "}
        to learn the templates, substitutes values, and reads the concrete
        URI with{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>resources/read</code>.
        Try it.
      </P>

      <UriTemplateBuilder />

      <P>
        The slot syntax is borrowed from RFC 6570 — minus most of its
        operators; MCP uses the simple{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>{"{name}"}</code>{" "}
        form. The point is that resources aren&apos;t one URL each — they&apos;re
        a parametrised <em>shape</em>. A calendar server doesn&apos;t list one
        URI per year; it lists a template (
        <code style={{ fontFamily: "var(--font-mono)" }}>calendar://events/{"{year}"}</code>
        ) and the host reads whichever year fits the conversation. The full
        method set:
      </P>

      <ul
        className="font-serif"
        style={{
          fontSize: "var(--text-body)",
          lineHeight: 1.6,
          paddingLeft: "1.4em",
          margin: "1em 0",
        }}
      >
        <li style={{ marginBottom: "0.4em" }}>
          <code style={{ fontFamily: "var(--font-mono)" }}>resources/list</code>{" "}
          — the concrete resources currently available (no slots).
        </li>
        <li style={{ marginBottom: "0.4em" }}>
          <code style={{ fontFamily: "var(--font-mono)" }}>resources/templates/list</code>{" "}
          — the parametrised templates the server exposes.
        </li>
        <li style={{ marginBottom: "0.4em" }}>
          <code style={{ fontFamily: "var(--font-mono)" }}>resources/read</code>{" "}
          — read a concrete URI; returns content with a MIME type.
        </li>
        <li>
          <code style={{ fontFamily: "var(--font-mono)" }}>resources/subscribe</code>{" "}
          — optionally subscribe to changes (named here; deep-dive later).
        </li>
      </ul>

      <P>
        The mental model: resources are <em>nouns</em> the host gets to read.
        They&apos;re passive context, not invocations. The host owns the
        decision; the model never reaches for them directly.
      </P>

      <H2>Prompts — user-controlled</H2>

      <P>
        A prompt is a templated message the user invokes — typically as a{" "}
        <Term>slash command</Term> in the host&apos;s chat input. The server
        registers a prompt with a name, a description, and an optional
        argument list; the host surfaces it as an autocomplete-able command;
        when the user picks it, the host calls{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>prompts/get</code>{" "}
        with arguments and the server returns the expanded message text the
        user is about to send.
      </P>

      <P>
        Prompts are how servers <em>teach</em> users to start complex
        requests.{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>/plan-vacation</code>{" "}
        with{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>destination</code>{" "}
        and{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>budget</code>{" "}
        arguments expands into a paragraph the user can edit and send. The
        method set is small:
      </P>

      <ul
        className="font-serif"
        style={{
          fontSize: "var(--text-body)",
          lineHeight: 1.6,
          paddingLeft: "1.4em",
          margin: "1em 0",
        }}
      >
        <li style={{ marginBottom: "0.4em" }}>
          <code style={{ fontFamily: "var(--font-mono)" }}>prompts/list</code>{" "}
          — the catalogue: names, descriptions, argument schemas.
        </li>
        <li>
          <code style={{ fontFamily: "var(--font-mono)" }}>prompts/get</code>{" "}
          — expand a prompt with arguments; returns the message the user is
          about to send.
        </li>
      </ul>

      <P>
        The mental model: prompts are <em>discoverable starting points</em>.
        The user is the controller; tools and resources are not directly
        discoverable to them, prompts are.
      </P>

      <H2>The controller table — the shape to remember</H2>

      <P>
        Three primitives, three controllers. The single table the rest of
        the course leans on:
      </P>

      <ControllerTable />

      <P>
        The whole chapter compresses to the cells of that table. Memorise
        the controller column especially — it&apos;s the question to ask of
        every integration sketch you&apos;ll see in chapter 6, every threat
        model you&apos;ll see in chapter 9, and every client-side primitive
        you&apos;ll see in chapter 8.
      </P>

      <H2>The travel server, all three at once</H2>

      <P>
        A worked sketch. A travel-planning server registers one of each
        primitive: a tool to search flights, a resource for the user&apos;s
        upcoming trips, and a prompt to start a vacation plan. In TypeScript,
        against the official SDK, the surface looks like this:
      </P>

      <CodeBlock
        lang="typescript"
        filename="travel-server.ts (sketch)"
        code={`import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const server = new McpServer({
  name: "travel-server",
  version: "0.1.0",
});

// 1. Tool — model-controlled. The LLM decides when to invoke.
server.registerTool(
  "search_flights",
  {
    title: "Search flights",
    description: "Find flights between two airports on a date.",
    inputSchema: {
      from: z.string().length(3),
      to: z.string().length(3),
      date: z.string(),
    },
  },
  async ({ from, to, date }) => ({
    content: [
      { type: "text", text: \`flights \${from} → \${to} on \${date}\` },
    ],
  }),
);

// 2. Resource — application-controlled. URI-template addressed.
server.registerResource(
  "trips",
  "trips://upcoming/{year}",
  { title: "Upcoming trips", mimeType: "application/json" },
  async (uri, { year }) => ({
    contents: [{ uri: uri.href, text: \`{ "year": "\${year}", "trips": [] }\` }],
  }),
);

// 3. Prompt — user-controlled. Surfaced as a slash-command in the host.
server.registerPrompt(
  "plan-vacation",
  {
    title: "Plan a vacation",
    description: "Scaffold a vacation plan from destination + budget.",
    argsSchema: { destination: z.string(), budget: z.string() },
  },
  async ({ destination, budget }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: \`Plan a trip to \${destination} on a \${budget} budget.\`,
        },
      },
    ],
  }),
);`}
      />

      <P>
        Three registrations, three controllers, one server. Chapter 6
        extends this same shape into a working server you can ping in the
        page; this is the silhouette to keep in mind on the way there.
      </P>

      <H2>Why three, not one</H2>

      <P>
        A reasonable instinct, looking at the three: <em>couldn&apos;t I just
        make resources tools that return data?</em> Couldn&apos;t I just make
        prompts tools that return a string?
      </P>

      <P>
        Yes, technically. And you&apos;d be lying about who controls them.
        The cost of that lie shows up in three places:
      </P>

      <H3>Cost</H3>

      <P>
        Tool calls fire on the model&apos;s decision, and models call them
        eagerly. A weather <em>tool</em> gets invoked on every turn that
        touches travel; a weather <em>resource</em> gets surfaced once, by
        the host, when the conversation actually needs it. The token cost
        compounds across a session. Same data, very different behaviour.
      </P>

      <H3>Privacy</H3>

      <P>
        Resources stay under the host&apos;s control — the host chooses what
        to fold into context, and can redact, summarise, or skip entirely
        based on the user&apos;s settings. Tools delegate that decision to
        the model. If the data is sensitive, the controller axis is a
        privacy boundary, not a stylistic preference.
      </P>

      <H3>UX</H3>

      <P>
        Prompts are discoverable to users — they show up in the chat
        input&apos;s slash-command menu. Tools and resources are not. If
        you want a user to find and start a workflow, it&apos;s a prompt.
        Hide it behind a tool name and only the model will ever invoke it.
      </P>

      <Callout tone="note">
        The controller boundary is also where most of the security model
        lives. Tools — model-initiated, with side effects — are the
        primitive most often abused (chapter 9 spends time on{" "}
        <em>tool poisoning</em>). Resources and prompts have their own risks,
        but the asymmetric trust on tools is the headline.
      </Callout>

      <H2>Comprehension check</H2>

      <P>
        A travel server exposes three things:{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>search_flights</code>{" "}
        (a tool),{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>trips://upcoming/2026</code>{" "}
        (a resource), and{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>/summarize-trip</code>{" "}
        (a prompt). The user types{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>/summarize-trip</code>{" "}
        in the chat input. Walk through who invokes what next, in two
        sentences.
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
          The host catches the slash-command, calls{" "}
          <code style={{ fontFamily: "var(--font-mono)" }}>prompts/get</code>{" "}
          on the server with the prompt&apos;s arguments, and inserts the
          expanded message into the conversation. Once the model is
          reasoning about that message, it may decide to call{" "}
          <code style={{ fontFamily: "var(--font-mono)" }}>tools/call</code>{" "}
          on{" "}
          <code style={{ fontFamily: "var(--font-mono)" }}>search_flights</code>{" "}
          (model-controlled), and the host may fold in{" "}
          <code style={{ fontFamily: "var(--font-mono)" }}>trips://upcoming/2026</code>{" "}
          via{" "}
          <code style={{ fontFamily: "var(--font-mono)" }}>resources/read</code>{" "}
          (application-controlled) when the model&apos;s reply touches
          scheduling. Three controllers, in order — user → model →
          application — across a single turn.
        </P>
      </details>

      <H2>The three voices, named. Now build one.</H2>

      <P>
        The chapter cataloged what a server can show: tools the model fires,
        resources the host surfaces, prompts the user invokes. Three
        primitives, three controllers, three sets of methods on the wire.
      </P>

      <P>
        That&apos;s the silhouette of every MCP server you&apos;ll ever
        meet. The next chapter sharpens the silhouette into something
        running.{" "}
        <Link
          href="/courses/mcps/build-a-server"
          className="font-sans"
          style={{ color: "var(--color-accent)" }}
        >
          Chapter 6 — build a server, in the page.
        </Link>
      </P>
    </>
  );
}

export default Content;
