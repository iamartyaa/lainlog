/**
 * Chapter 3 — JSON-RPC, the wire that carries it.
 *
 * Server-rendered prose component. Client-only widgets live under
 * `./widgets/`; their `"use client"` boundaries scope hydration to the
 * widget itself so the surrounding prose stays in the RSC graph.
 *
 * The chapter's spine is `JsonRpcSandbox`. Everything before it readies
 * the reader to edit JSON-RPC; everything after pivots — the prose
 * references what the reader can DO with the sandbox.
 *
 * Voice §12 anchors:
 *   §12.1 — premise quiz opener (`JsonRpcQuiz`).
 *   §12.2 — mechanism-first (the four fields, then the consequences).
 *   §12.5 — `<Term>` on first appearance of every spec word.
 *   §12.6 — every widget has a ramp + landing paragraph.
 *   §12.8 — closer loops back to the opener (notifications/cancelled).
 *
 * Bans observed: no <hr>, no <br>, no VerticalCutReveal, single accent only.
 */

import { Term, Code, Em, Aside, A } from "@/components/prose";
import { TextHighlighter } from "@/components/fancy";
import { CodeBlock } from "@/components/code/CodeBlock";
import {
  JsonRpcSandbox,
  FieldDecoder,
  RequestVsNotification,
  JsonRpcQuiz,
} from "./widgets";

const HL_TX = { type: "spring" as const, duration: 0.9, bounce: 0 };
const HL_COLOR = "color-mix(in oklab, var(--color-accent) 28%, transparent)";
const HL_OPTS = { once: true, initial: false, amount: 0.55 } as const;

/** Highlight a load-bearing phrase. Default ltr swipe, spring, inView once. */
function HL({ children }: { children: React.ReactNode }) {
  return (
    <TextHighlighter
      transition={HL_TX}
      highlightColor={HL_COLOR}
      useInViewOptions={HL_OPTS}
      className="rounded-[0.2em] px-[1px]"
    >
      {children}
    </TextHighlighter>
  );
}

const PROSE_P_STYLE: React.CSSProperties = {
  margin: "var(--spacing-md) 0",
  fontSize: "var(--text-body)",
  lineHeight: 1.7,
  color: "var(--color-text)",
};

const H2_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontWeight: 600,
  fontSize: "var(--text-h2)",
  letterSpacing: "-0.015em",
  margin: "var(--spacing-2xl) 0 var(--spacing-md) 0",
  lineHeight: 1.2,
};

const SAMPLE_FOUR_MESSAGES = `// 1. client → server
{ "jsonrpc": "2.0", "id": 1, "method": "initialize",
  "params": { "protocolVersion": "2025-06-18",
              "capabilities": { "elicitation": {} },
              "clientInfo": { "name": "demo-client", "version": "0.1.0" } } }

// 2. server → client
{ "jsonrpc": "2.0", "id": 1,
  "result": { "protocolVersion": "2025-06-18",
              "capabilities": { "tools": {}, "resources": {} },
              "serverInfo": { "name": "demo-server", "version": "0.1.0" } } }

// 3. client → server  (no id — it's a notification)
{ "jsonrpc": "2.0", "method": "notifications/initialized" }

// 4. client → server
{ "jsonrpc": "2.0", "id": 2, "method": "tools/list" }`;

const SAMPLE_ERRORS = `// parse error — the bytes weren't valid JSON
{ "jsonrpc": "2.0", "id": null,
  "error": { "code": -32700, "message": "Parse error" } }

// invalid request — JSON parsed, but the shape was wrong
{ "jsonrpc": "2.0", "id": null,
  "error": { "code": -32600, "message": "Invalid Request" } }

// method not found — the server doesn't expose that method
{ "jsonrpc": "2.0", "id": 4,
  "error": { "code": -32601, "message": "Method not found" } }

// invalid params — the method exists, the arguments don't match
{ "jsonrpc": "2.0", "id": 5,
  "error": { "code": -32602, "message": "Invalid params" } }`;

export default async function Chapter3Content() {
  // Pre-render the two static samples through Shiki here so the RSC graph
  // does the highlighting and the client never imports the highlighter.
  const fourMessages = await CodeBlock({
    code: SAMPLE_FOUR_MESSAGES,
    lang: "json",
    filename: "the four-message exchange",
  });
  const errorSamples = await CodeBlock({
    code: SAMPLE_ERRORS,
    lang: "json",
    filename: "the four standard error codes",
  });

  return (
    <div>
      {/* §0 — premise-quiz opener (voice §12.1) */}
      <p style={PROSE_P_STYLE}>
        Two messages on the wire. One has an <Code>id</Code>. One
        doesn&rsquo;t. Read both, then guess which one expects a response.
        Most readers don&rsquo;t notice the difference on a first pass &mdash;{" "}
        <HL>and that one missed field is the lesson</HL>.
      </p>

      <JsonRpcQuiz />

      {/* §1 — the reframe */}
      <h2 style={H2_STYLE}>MCP didn&rsquo;t invent a wire. It picked a calm one.</h2>
      <p style={PROSE_P_STYLE}>
        <Term>JSON-RPC</Term> predates MCP by 15+ years. Ethereum nodes speak
        it. WebSocket libraries lean on it. Half the desktop applications you
        ran in 2014 had a JSON-RPC server somewhere in their guts. When the
        designers of MCP sat down to pick a wire format,{" "}
        <HL>they didn&rsquo;t reach for novelty</HL> &mdash; they reached for
        something the rest of the industry already understood.
      </p>
      <p style={PROSE_P_STYLE}>
        The trade was deliberate. JSON-RPC has no schema language, no streams,
        no codegen, no batching anyone uses in practice. What it does have is{" "}
        <Em>four fields</Em> and a <Em>pairing rule</Em>. That&rsquo;s the
        whole protocol. If you can read those four fields by sight,{" "}
        you can read every message in the rest of this course.
      </p>

      {/* §2 — the four fields */}
      <h2 style={H2_STYLE}>The four fields</h2>
      <p style={PROSE_P_STYLE}>
        Every message MCP puts on the wire is a JSON object with at most four
        keys. <Code>jsonrpc</Code> says <Em>which version of the wire format
        this is</Em>; it&rsquo;s always the literal string{" "}
        <Code>&quot;2.0&quot;</Code>. <Code>id</Code> says <Em>which conversation
        this message belongs to</Em>. <Code>method</Code> says <Em>what the
        sender is asking for</Em>. <Code>params</Code> carries{" "}
        <Em>the inputs</Em> &mdash; or, on the way back, the response uses{" "}
        <Code>result</Code> for success and <Code>error</Code> for failure.
      </p>
      <p style={PROSE_P_STYLE}>
        Hover the keys below to read what each one does.
      </p>

      <FieldDecoder />

      <p style={PROSE_P_STYLE}>
        Four fields. Two outcomes per response. <HL>That&rsquo;s the entire
        surface area</HL> &mdash; everything else is a method name and the
        shape of its <Code>params</Code>.
      </p>

      {/* §3 — request → response, paired by id */}
      <h2 style={H2_STYLE}>Request and response, paired by <Code>id</Code></h2>
      <p style={PROSE_P_STYLE}>
        A <Term>request</Term> goes out with an <Code>id</Code>; a{" "}
        <Term>response</Term> comes back carrying the same <Code>id</Code>.
        That&rsquo;s the pairing rule, and it&rsquo;s the reason MCP can run
        many requests in flight on a single connection without confusing
        them. The client picks the id, the server echoes it &mdash; the two
        sides never have to agree on order, only on identity.
      </p>
      <p style={PROSE_P_STYLE}>
        Here&rsquo;s the four-message handshake from the spec, verbatim. Read
        it once; we&rsquo;ll come back to it when we open the sandbox.
      </p>

      {fourMessages}

      <p style={PROSE_P_STYLE}>
        Messages 1 and 2 are paired by <Code>id: 1</Code>. Message 4 is a
        fresh request waiting on its own response (which would carry{" "}
        <Code>id: 2</Code>). Message 3{" "}
        <HL>has no id, and that means something specific</HL>.
      </p>

      {/* §4 — notifications */}
      <h2 style={H2_STYLE}>The one without an <Code>id</Code></h2>
      <p style={PROSE_P_STYLE}>
        A message without an <Code>id</Code> is a <Term>notification</Term>.
        The receiver acts on it; the receiver does not reply. Notifications
        are how MCP carries events &mdash; <Em>the tool list changed</Em>,{" "}
        <Em>cancel that long-running call</Em>, <Em>I&rsquo;m initialized
        and ready</Em>. There&rsquo;s no id because there&rsquo;s no
        response to pair with.
      </p>
      <p style={PROSE_P_STYLE}>
        Toggle the widget below. Same shape on the wire, one missing field;
        watch the right pane go quiet.
      </p>

      <RequestVsNotification />

      <p style={PROSE_P_STYLE}>
        The round-trip count only ticks on requests. Notifications are{" "}
        <HL>fire-and-forget</HL> &mdash; the wire goes one way, and the
        sender moves on.
      </p>

      {/* §5 — JsonRpcSandbox: the chapter's spine */}
      <h2 style={H2_STYLE}>The wire, in your hands</h2>
      <p style={PROSE_P_STYLE}>
        Reading is one thing. Editing is another. The widget below puts a
        live JSON-RPC request in the left pane and a deterministic server
        stub in the right. The reader edits the request &mdash;{" "}
        <HL>the response shape changes as you type</HL>. There&rsquo;s no
        network here; the stub is a small switch on <Code>method</Code> that
        produces the same response a real server would.
      </p>

      <JsonRpcSandbox />

      <p style={PROSE_P_STYLE}>
        From here on, the chapter pivots. We&rsquo;re not going to{" "}
        <Em>describe</Em> the protocol any more &mdash; we&rsquo;re going to
        ask you to <Em>do</Em> things with it. Try editing the{" "}
        <Code>method</Code> from <Code>tools/list</Code> to{" "}
        <Code>tools/cull</Code> and watch the response come back as a{" "}
        <Code>-32601</Code>. Delete the closing brace and watch the wire
        flunk before the server even sees the message. Drop the{" "}
        <Code>id</Code> field and watch the response pane go quiet &mdash;
        you&rsquo;ve just turned a request into a notification.
      </p>

      {/* §6 — error codes */}
      <h2 style={H2_STYLE}>The four codes a server can refuse with</h2>
      <p style={PROSE_P_STYLE}>
        When something is wrong, JSON-RPC has a small dictionary of negative
        numbers it speaks. You&rsquo;ll see the same four codes in every MCP
        debugger, in every error log, in every spec page from now on.
      </p>
      <p style={PROSE_P_STYLE}>
        <Code>-32700</Code> is a <Term>parse error</Term> &mdash; the bytes
        weren&rsquo;t valid JSON. <Code>-32600</Code> is{" "}
        <Em>invalid request</Em> &mdash; the JSON parsed, but the shape
        wasn&rsquo;t a JSON-RPC message. <Code>-32601</Code> is{" "}
        <Em>method not found</Em> &mdash; the shape was right, but the
        server doesn&rsquo;t expose that method. <Code>-32602</Code> is{" "}
        <Em>invalid params</Em> &mdash; the method exists, the arguments
        don&rsquo;t match.
      </p>

      {errorSamples}

      <p style={PROSE_P_STYLE}>
        The sandbox above will produce each of these on demand. Mangle the
        JSON for <Code>-32700</Code>. Drop <Code>jsonrpc</Code> for{" "}
        <Code>-32600</Code>. Rename the method for <Code>-32601</Code>.
      </p>

      <Aside>
        There&rsquo;s a fifth code, <Code>-32603</Code>, for{" "}
        <Em>internal error</Em> &mdash; the server received a valid request
        but failed while handling it. We&rsquo;ll see that one in chapter 6
        when handlers throw. For now: four codes is enough to read every
        well-formed exchange in the spec.
      </Aside>

      {/* §7 — what it isn't */}
      <h2 style={H2_STYLE}>What it isn&rsquo;t</h2>
      <p style={PROSE_P_STYLE}>
        It&rsquo;s not REST. There are no resources, no verbs, no path
        templates. It&rsquo;s not GraphQL &mdash; the client doesn&rsquo;t
        shape its query, the server names the operation. It&rsquo;s not gRPC
        either; no protobuf, no HTTP/2 multiplexing required.{" "}
        It&rsquo;s <HL>stateful</HL> &mdash; the connection carries context,
        and that context is what makes the next chapter&rsquo;s handshake
        even necessary.
      </p>

      {/* §8 — comprehension check */}
      <h2 style={H2_STYLE}>One last read</h2>
      <p style={PROSE_P_STYLE}>
        Here&rsquo;s a message from a real MCP session:
      </p>
      <pre
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-mono)",
          lineHeight: 1.55,
          background: "var(--color-surface)",
          border: "1px solid var(--color-rule)",
          borderRadius: "var(--radius-sm)",
          padding: "var(--spacing-md)",
          color: "var(--color-text)",
          whiteSpace: "pre",
          overflowX: "auto",
          margin: "var(--spacing-md) 0",
        }}
      >
{`{
  "jsonrpc": "2.0",
  "method": "notifications/cancelled",
  "params": { "requestId": 42, "reason": "user pressed escape" }
}`}
      </pre>
      <p style={PROSE_P_STYLE}>
        The server processes it and... what? The answer falls out of the
        rules you already have. There&rsquo;s no <Code>id</Code>, so this is
        a notification &mdash; the server acts on it but{" "}
        <HL>doesn&rsquo;t reply</HL>. The server cancels the request whose
        id was 42 (probably a long-running tool call), and the wire stays
        quiet. No response. No error. No round-trip.
      </p>

      {/* §9 — cliffhanger */}
      <h2 style={H2_STYLE}>What&rsquo;s next</h2>
      <p style={PROSE_P_STYLE}>
        Four fields can carry anything. So <Em>what</Em> does MCP carry
        across them &mdash; and how do two strangers, fresh to a session,
        agree on what&rsquo;s in scope?{" "}
        <HL>That&rsquo;s the handshake</HL>, and it&rsquo;s the next chapter:{" "}
        <A href="/courses/mcps/the-handshake">The handshake</A>.
      </p>

      <div
        aria-hidden
        style={{
          margin: "var(--spacing-2xl) auto var(--spacing-lg)",
          width: 6,
          height: 6,
          background: "var(--color-accent)",
        }}
      />
    </div>
  );
}
