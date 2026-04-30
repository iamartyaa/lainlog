/**
 * Chapter 8 — When the server asks back: sampling, elicitation, roots.
 *
 * Server component. Composes the chapter prose around five widgets:
 *   1. ReverseQuiz           — premise-quiz opener (voice §12.1).
 *   2. ReverseFlowDiagram    — load-bearing three-tab diagram with HITL
 *                              gates and embedded sub-widgets.
 *   3. SamplingApproval      — standalone deep-dive on the gate UX.
 *   4. ElicitationForm       — schema → form → response payload.
 *   5. RootsManager          — declared-roots editor + envelope log.
 *
 * Voice §12 patterns honoured:
 *   - <Term> on first appearance of every spec word.
 *   - Mechanism-first reframe — "the protocol's other direction" is the
 *     mechanism, not a feature taxonomy.
 *   - Just-in-time vocabulary — no glossary chapter.
 *   - Closer loops back to the opener (two HITL gates on sampling).
 *   - VerticalCutReveal banned; closer is still prose.
 *
 * No <hr>, no <br>. Section breaks ride on <H2> + spacing rhythm.
 *
 * The "roots is coordination, not enforcement" sentence appears verbatim
 * in §3 — chapter 9 inherits it as the load-bearing claim.
 */

import dynamic from "next/dynamic";
import Link from "next/link";
import { Callout, H2, P, Term } from "@/components/prose";
import { CodeBlock } from "@/components/code/CodeBlock";

const ReverseQuiz = dynamic(
  () => import("./widgets/ReverseQuiz").then((m) => m.ReverseQuiz),
);
const ReverseFlowDiagram = dynamic(
  () =>
    import("./widgets/ReverseFlowDiagram").then((m) => m.ReverseFlowDiagram),
);
const SamplingApproval = dynamic(
  () => import("./widgets/SamplingApproval").then((m) => m.SamplingApproval),
);
const ElicitationForm = dynamic(
  () => import("./widgets/ElicitationForm").then((m) => m.ElicitationForm),
);
const RootsManager = dynamic(
  () => import("./widgets/RootsManager").then((m) => m.RootsManager),
);

export function Content() {
  return (
    <>
      <P>
        Every message we&apos;ve followed in this course has gone the same
        way — client opens the session, client lists tools, client calls
        them. The server has been the one being asked. But MCP isn&apos;t
        one-way. There are three messages that flow the other direction,
        each with its own checkpoint, and one of them has{" "}
        <em>two</em>. Before we explain anything, try the opener.
      </P>

      <ReverseQuiz />

      <H2>The flip — three reverse messages</H2>

      <P>
        Until now the client has been driving. Sometimes the server needs
        to. Three primitives reverse the direction:{" "}
        <Term>sampling</Term> (server asks the host&apos;s LLM for a
        completion), <Term>elicitation</Term> (server asks the user a
        structured question), and <Term>roots</Term> (server asks the
        client what directories it&apos;s allowed to operate inside). Each
        is named in the client&apos;s capability declaration from chapter
        4 — the server can only ask back for what the client opted into.
      </P>

      <P>
        Two of the three involve the user directly; all three pass through
        the host before anything reaches a model or a filesystem. The
        host&apos;s job here is the{" "}
        <Term>human-in-the-loop</Term> gate — the spec&apos;s claim that
        the user is the one who decides, not the model and not the server.
        The diagram below plays the three flows side by side; the gates
        appear as terracotta diamonds.
      </P>

      <ReverseFlowDiagram />

      <P>
        Three tabs, three flows. The arrows are the wire; the diamonds are
        the host. Now zoom on each one.
      </P>

      <H2>Sampling — the server wants your model</H2>

      <P>
        Most servers don&apos;t ship their own LLM. A flight-search server
        wants to summarise; a Slack server wants to draft a reply; a SQL
        server wants to explain a query plan. Building inference into every
        server would mean every server pays for compute, every server
        chooses a model, every server has to be updated when a new model
        ships. The flip is cleaner: the server asks the host to use{" "}
        <em>its</em> model. Same protocol, same session, no extra credentials.
      </P>

      <P>
        The method is{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>
          sampling/createMessage
        </code>
        . The body carries messages, an optional{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>systemPrompt</code>,
        a{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>maxTokens</code>{" "}
        ceiling, and{" "}
        <Term>modelPreferences</Term> — hints at speed/cost/quality the host
        is free to honour or ignore.
      </P>

      <CodeBlock
        lang="json"
        filename="sampling/createMessage (request body)"
        code={`{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "sampling/createMessage",
  "params": {
    "messages": [
      { "role": "user", "content": {
        "type": "text",
        "text": "Summarise these 47 flights in three lines."
      } }
    ],
    "systemPrompt": "You are a concise travel assistant.",
    "modelPreferences": {
      "hints": [{ "name": "claude-3-5-sonnet" }],
      "speedPriority": 0.4,
      "costPriority": 0.3,
      "intelligencePriority": 0.3
    },
    "maxTokens": 512
  }
}`}
      />

      <P>
        Then the gate. The host pauses, shows the user the prompt, and
        asks. Three buttons. Three different sessions downstream — the
        request only reaches the model if the user lets it.
      </P>

      <SamplingApproval />

      <P>
        Sampling has{" "}
        <em>two</em> human-in-the-loop gates, not one — that&apos;s the
        opener&apos;s payload. The first gate fires before the prompt
        reaches the LLM. The second fires before the completion goes back
        to the server: the host can show the user what the model said and
        ask whether it can be sent back. The user controls both ends. A
        server that wanted to exfiltrate data through a sampling response
        would still have to pass the second gate — which is the
        spec&apos;s safety claim made architectural.
      </P>

      <H2>Elicitation — the server asks the user</H2>

      <P>
        The pattern: a server is mid-flow and needs a piece of information
        only the user has. A booking server doesn&apos;t know your seat
        preference. A timezone-aware server doesn&apos;t know your
        timezone. Hard-coding a failure path (<em>error: missing
        information</em>) would force the user to start over. Hard-coding a
        guess would be worse. The protocol&apos;s answer is to{" "}
        <em>ask</em>.
      </P>

      <P>
        The method is{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>
          elicitation/create
        </code>
        . The server sends a JSON-Schema fragment — a small subset, just
        enough for primitive types and enums — describing the form it
        wants. The host renders the form. The user fills it. The values
        come back as the elicitation response, with an{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>action</code>{" "}
        field that&apos;s one of{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>accept</code>,{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>decline</code>,
        or{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>cancel</code>.
      </P>

      <ElicitationForm />

      <P>
        Elicitation has exactly one HITL gate, because the gate is the
        answer. Sampling routes a model around the user; elicitation
        routes the user&apos;s input around a model. The user{" "}
        <em>is</em> the response.
      </P>

      <H2>Roots — the boundaries the client declares</H2>

      <P>
        The third flip is quieter. Roots are file:// URIs the client tells
        the server about: <em>operate inside these directories.</em> A
        filesystem server told its roots are{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>
          /Users/ada/projects/bytesize
        </code>{" "}
        and{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>
          /Users/ada/Documents/specs
        </code>{" "}
        knows not to read{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>
          ~/.ssh
        </code>
        . Two methods carry it:{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>roots/list</code>{" "}
        is a request the server can make at any time; the client&apos;s{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>
          notifications/roots/list_changed
        </code>{" "}
        fires when the user moves the workspace.
      </P>

      <RootsManager />

      <P>
        The thing to feel about roots is what they aren&apos;t.{" "}
        <strong>
          Roots are coordination, not enforcement.
        </strong>{" "}
        The server <em>SHOULD</em> respect the list — that&apos;s the
        spec&apos;s normative word. Nothing on the wire stops a malicious
        server from reading whatever the host&apos;s process can read; the
        roots message just makes the boundary legible. The enforcement has
        to come from the host process itself: sandboxing, OS-level
        permissions, capability tokens. Chapter 9 inherits this directly.
      </P>

      <H2>Why these three exist</H2>

      <P>
        Without sampling, every server needs its own model. Without
        elicitation, every missing field is a hard error. Without roots,
        every server has to guess what it&apos;s allowed to touch. Agentic
        flows — the chains where one tool call leads to another, and the
        model needs more information halfway through — collapse without
        these. A single forward call can&apos;t carry an agent through a
        booking with three branching questions; the server has to be able
        to ask back.
      </P>

      <P>
        And in all three cases, the trust boundary stays with the client.
        The server can request; the client can deny. The host is the
        bottleneck on purpose — a deny on the sampling gate is a deny full
        stop, and a closed elicitation form is an{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>action: cancel</code>{" "}
        on the wire. The asymmetry from chapter 5 (server primitives are
        controlled by model / app / user) holds here in mirror: client
        primitives add a fourth invariant — the human is in the loop on
        every one that touches data.
      </P>

      <H2>Comprehension check</H2>

      <P>
        A server requests sampling. The host has no LLM available — maybe
        the user is offline, maybe the host shipped without a model. What
        does the client return? Predict before revealing.
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
          The client returns a JSON-RPC error response, paired by id, with
          a code that signals the LLM is unavailable —{" "}
          <code style={{ fontFamily: "var(--font-mono)" }}>-32603</code>{" "}
          (internal error) is the catch-all the spec falls back to, with a
          message describing the cause. A well-built server catches the
          error and either retries with a backoff, falls back to its own
          best-effort heuristic, or returns its own error to the client
          that opened the session. Sampling is a request; requests can
          fail; failure has a code.
        </P>
      </details>

      <Callout tone="note">
        Capability check, while we&apos;re here: a server can only call{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>
          sampling/createMessage
        </code>{" "}
        if the client declared{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>sampling</code>{" "}
        in its handshake capabilities. Same for{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>elicitation</code>{" "}
        and{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>roots</code>. A
        server that asks back for something the client never offered gets{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>
          -32601 method not found
        </code>{" "}
        — the same shape as chapter 4&apos;s{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>tools/list</code>{" "}
        on a server that didn&apos;t advertise tools.
      </Callout>

      <H2>The protocol&apos;s two directions, complete</H2>

      <P>
        Now you know both directions. Client → server got us through
        chapters 3 through 7: the handshake, the primitives, the build-a-
        server / build-a-client tour. Server → client gets us through
        sampling, elicitation, and roots — the surface that lets agents do
        anything beyond a single forward call. Two HITL gates on sampling,
        one on elicitation, zero on roots (because roots is coordination,
        not enforcement). Scroll back to the opener: the gate count
        isn&apos;t a riddle anymore.
      </P>

      <P>
        Every message we&apos;ve followed has been polite. The server
        asked nicely, the client answered nicely, the host gated nicely.
        The wild has teeth.{" "}
        <Link
          href="/courses/mcps/how-mcp-gets-attacked"
          className="font-sans"
          style={{ color: "var(--color-accent)" }}
        >
          That&apos;s chapter 9.
        </Link>
      </P>
    </>
  );
}

export default Content;
