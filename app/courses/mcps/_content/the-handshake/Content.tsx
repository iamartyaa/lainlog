/**
 * Chapter 4 — The handshake.
 *
 * Server component. Composes the chapter prose around four widgets:
 *   1. HandshakeQuiz       — premise-quiz opener (voice §12.1).
 *   2. HandshakeStepper    — load-bearing scripted stepper (the three
 *                            messages in motion).
 *   3. CapabilityNegotiator — make the AND tactile.
 *   4. ProtocolVersionExplorer — version negotiation as footnote.
 *
 * Voice §12 patterns honoured:
 *   - <Term> on first appearance of every spec word.
 *   - Mechanism-first reframe — handshake as machine, not ceremony.
 *   - Just-in-time vocabulary — no glossary chapter.
 *   - Closer loops back to the opener (capability AND).
 *   - VerticalCutReveal banned; closer is still prose.
 *
 * No <hr>, no <br>. Section breaks ride on <H2> + spacing rhythm.
 */

import dynamic from "next/dynamic";
import Link from "next/link";
import { Callout, H2, H3, P, Term } from "@/components/prose";
import { CodeBlock } from "@/components/code/CodeBlock";

// Widgets are client components; lazy-load them so the chapter route stays
// a server boundary and the JS only ships when the reader scrolls into
// each widget. We let Next render an SSR placeholder for the widget shell
// (children of "use client" widgets render their first frame on the
// server) — the real interactive canvas appears on hydration via
// WidgetShell's built-in dot-then-canvas scaffold.
const HandshakeQuiz = dynamic(
  () => import("./widgets/HandshakeQuiz").then((m) => m.HandshakeQuiz),
);
const HandshakeStepper = dynamic(
  () => import("./widgets/HandshakeStepper").then((m) => m.HandshakeStepper),
);
const CapabilityNegotiator = dynamic(
  () =>
    import("./widgets/CapabilityNegotiator").then(
      (m) => m.CapabilityNegotiator,
    ),
);
const ProtocolVersionExplorer = dynamic(
  () =>
    import("./widgets/ProtocolVersionExplorer").then(
      (m) => m.ProtocolVersionExplorer,
    ),
);

export function Content() {
  return (
    <>
      <P>
        A host process starts. A server process starts. Neither knows what
        the other can do, what version of the protocol the other speaks, or
        whether either is even ready to take a request. Before any tool
        gets called, before any resource gets read, three messages cross
        the wire. Get them wrong and nothing else works.
      </P>

      <P>
        That three-message exchange is the <Term>handshake</Term>. Most
        readers arrive thinking <Term>capabilities</Term> are a permission
        slip the server hands the host. They aren&apos;t. They&apos;re a
        mutual declaration — the AND of what both sides advertised. The
        opener below makes the misconception specific.
      </P>

      <HandshakeQuiz />

      <H2>The three messages, named</H2>

      <P>
        The handshake is exactly three messages, in this order:
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
          <strong>client → server</strong> · the{" "}
          <Term>initialize</Term> request, carrying the version the client
          speaks, who the client is, and what the client can do.
        </li>
        <li style={{ marginBottom: "0.4em" }}>
          <strong>server → client</strong> · the response, paired by id,
          carrying the server&apos;s version, who the server is, and the
          menu the server offers.
        </li>
        <li>
          <strong>client → server</strong> · a final{" "}
          <Term>notification</Term> — <code style={{ fontFamily: "var(--font-mono)" }}>notifications/initialized</code>{" "}
          — with no id, no body to speak of, and no reply expected.
        </li>
      </ul>

      <P>
        Two requests would be one too many. The third message is a
        notification because the client has nothing more to <em>ask</em>;
        it&apos;s just acknowledging the server&apos;s reply so the
        session can begin. The widget below plays the three in order — the
        load-bearing visual for the rest of the chapter.
      </P>

      <HandshakeStepper />

      <H2>What the initialize request carries</H2>

      <P>
        Three fields land in <code style={{ fontFamily: "var(--font-mono)" }}>params</code>{" "}
        on the opening message: <Term>protocolVersion</Term>,{" "}
        <Term>clientInfo</Term>, and <Term>capabilities</Term>. Each is
        load-bearing in a different way.
      </P>

      <H3>protocolVersion</H3>

      <P>
        A date string — the version of the spec the client speaks.
        Today&apos;s spec is{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>2025-06-18</code>;
        an earlier widely-deployed spec is{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>2024-11-05</code>.
        The client puts down what it speaks; the server puts down what it
        accepts. If the server can&apos;t speak the client&apos;s version,
        it returns the version it <em>does</em> support — and the client
        decides whether to retry, downgrade, or terminate. We come back to
        this at the end.
      </P>

      <H3>clientInfo</H3>

      <P>
        Who the client is — a name and a version. <code style={{ fontFamily: "var(--font-mono)" }}>{"{ \"name\": \"claude-desktop\", \"version\": \"0.9.4\" }"}</code>.
        Servers use this for diagnostics and for occasional version-gated
        behaviour (an old client may not handle a newer notification
        type). It&apos;s metadata; it doesn&apos;t change what messages
        are valid.
      </P>

      <H3>capabilities</H3>

      <P>
        What the client can <em>do</em> — its side of the contract.
        Client-side capabilities are things the server can ask of the
        client mid-session: <code style={{ fontFamily: "var(--font-mono)" }}>roots</code>{" "}
        (filesystem scope), <code style={{ fontFamily: "var(--font-mono)" }}>sampling</code>{" "}
        (server can ask the client&apos;s LLM to complete a prompt),{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>elicitation</code>{" "}
        (server can ask the user a question through the client). Each is a
        promise the client makes about the future shape of the session.
      </P>

      <H2>What the response adds</H2>

      <P>
        The server&apos;s reply mirrors the request: its{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>protocolVersion</code>,{" "}
        a <Term>serverInfo</Term> with name and version, and{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>capabilities</code>{" "}
        — but this time, the server&apos;s side of the menu:{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>tools</code>,{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>resources</code>,{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>prompts</code>,{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>logging</code>.
        Each top-level key may carry sub-flags — <code style={{ fontFamily: "var(--font-mono)" }}>tools.listChanged</code>{" "}
        is the server saying <em>I will send a notification when my tool
        list changes</em>; the client&apos;s acceptance of the handshake
        is its agreement to receive that notification.
      </P>

      <CodeBlock
        lang="json"
        filename="initialize response (2025-06-18)"
        code={`{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2025-06-18",
    "serverInfo": {
      "name": "filesystem-server",
      "version": "1.2.0"
    },
    "capabilities": {
      "tools": { "listChanged": true },
      "resources": { "subscribe": true },
      "prompts": {}
    }
  }
}`}
      />

      <P>
        That&apos;s the menu. The next widget makes the rule that follows
        from it tactile.
      </P>

      <H2>
        <Term>Capability negotiation</Term> — what survives the AND
      </H2>

      <P>
        Each side advertises its own vocabulary; only what a side declared
        on its axis survives on that axis. A server that offers{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>tools</code>{" "}
        without declaring it never had it; a client that wants{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>sampling</code>{" "}
        without offering it can&apos;t be sampled from. Toggle either side
        — watch the negotiated session change.
      </P>

      <CapabilityNegotiator />

      <P>
        The thing to feel here is that calling{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>tools/list</code>{" "}
        on a server that didn&apos;t advertise{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>tools</code>{" "}
        won&apos;t hang or ping or get rate-limited — it&apos;ll come back{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>-32601 method not found</code>,
        every time. The handshake is where that future error gets
        decided.
      </P>

      <H2>Why the third message is a notification</H2>

      <P>
        After the server replies, the client sends one more thing:{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>notifications/initialized</code>.
        It looks like ceremony. It isn&apos;t.
      </P>

      <P>
        The client and server agreed on a version and a capability set in
        the first two messages; what they haven&apos;t agreed on is{" "}
        <em>when the session is open</em>. The server doesn&apos;t know if
        the client is still parsing the response, deciding to terminate,
        or about to send the next request. The notification is the
        client&apos;s way of saying <em>I have no further question; just
        acknowledging your reply.</em> A request would expect a response,
        which would loop. A notification doesn&apos;t.
      </P>

      <P>
        Until the server receives that third message, it{" "}
        <strong>SHOULD NOT</strong> send any other notifications and{" "}
        <strong>MUST NOT</strong> send requests other than{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>ping</code>. The
        notification is the gate. Past it, the negotiated set is live.
      </P>

      <H2>Version negotiation, in the margins</H2>

      <P>
        The <code style={{ fontFamily: "var(--font-mono)" }}>protocolVersion</code>{" "}
        field is the smallest moving part of the handshake — and the one
        readers tend to over-think. The rule is short: the client puts
        down what it speaks, the server replies with the version it
        supports, and if they don&apos;t match the client decides whether
        to proceed or terminate. Compare:
      </P>

      <ProtocolVersionExplorer />

      <P>
        The diff is small on the surface — an{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>_meta</code>{" "}
        field on capabilities, an optional{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>title</code> on{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>serverInfo</code>,
        a top-level <code style={{ fontFamily: "var(--font-mono)" }}>instructions</code>{" "}
        string the host can surface to the model. The point of the widget
        isn&apos;t the diff; it&apos;s the shape — version is a date the
        spec mints, both sides put down what they know, and the protocol
        terminates the session if they have nothing in common.
      </P>

      <Callout tone="note">
        The spec is explicit: when a server doesn&apos;t support the
        client&apos;s requested version, it returns a version it{" "}
        <em>does</em> support; the client then either retries with that
        version or terminates the connection. There is no automatic
        downgrade — the client decides.
      </Callout>

      <H2>Comprehension check</H2>

      <P>
        A client opens with{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>protocolVersion: &quot;2024-11-05&quot;</code>.
        The server only supports{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>2025-06-18</code>.
        Walk through what happens next, in two sentences: what does the
        server return, and what does the client do?
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
          The server returns its initialize response with{" "}
          <code style={{ fontFamily: "var(--font-mono)" }}>protocolVersion: &quot;2025-06-18&quot;</code>{" "}
          — i.e., the version it <em>does</em> support. The client then
          either retries the handshake with{" "}
          <code style={{ fontFamily: "var(--font-mono)" }}>2025-06-18</code>{" "}
          (if it can speak it), or terminates the connection. There is no
          automatic downgrade and no silent fallback; the client owns the
          decision.
        </P>
      </details>

      <H2>The session is open. Now what?</H2>

      <P>
        Three messages crossed the wire. Both sides agreed on a version
        and a capability set, and the client&apos;s notification said{" "}
        <em>go.</em> The session is stateful from here on — the
        capabilities are locked, the version is fixed, and every later
        request leans on what the handshake decided.
      </P>

      <P>
        Which leaves the question we&apos;ve been deferring. The server
        listed{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>tools</code>,{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>resources</code>,{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>prompts</code>.
        What <em>are</em> these primitives the two sides keep promising
        each other — and how does the host pick which to invoke?{" "}
        <Link
          href="/courses/mcps/tools-resources-prompts"
          className="font-sans"
          style={{ color: "var(--color-accent)" }}
        >
          That&apos;s chapter 5.
        </Link>
      </P>
    </>
  );
}

export default Content;
