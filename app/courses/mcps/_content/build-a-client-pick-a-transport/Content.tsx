/**
 * Chapter 7 — Build a client, pick a transport.
 *
 * Server component. Composes the chapter prose around four widgets:
 *   1. OAuthGate          — premise-quiz opener (voice §12.1).
 *   2. InitFlowAnimation  — six-step scripted stepper covering the full
 *                           connect-through-tools/list exchange.
 *   3. TransportPicker    — load-bearing scenario branch (4 deployments).
 *   4. (Comprehension check is plain prose with details/summary; no
 *      separate widget — the chapter already runs four interactive panels.)
 *
 * Voice §12 patterns honoured:
 *   - <Term> on first appearance of every spec word (transport, stdio,
 *     Streamable HTTP, session, SSE, HTTP+SSE, WWW-Authenticate, EOF).
 *   - Mechanism-first reframe — transport choice is downstream of trust,
 *     locality, and auth, not a free style choice.
 *   - Just-in-time vocabulary; no glossary chapter.
 *   - Closer loops back to the opener (server can ask back → ch 8).
 *   - VerticalCutReveal banned; closer is still prose.
 *
 * No <hr>, no <br>. Section breaks ride on <H2> + spacing rhythm.
 */

import dynamic from "next/dynamic";
import Link from "next/link";
import { Aside, Callout, H2, H3, P, Term } from "@/components/prose";
import { CodeBlock } from "@/components/code/CodeBlock";

const OAuthGate = dynamic(
  () => import("./widgets/OAuthGate").then((m) => m.OAuthGate),
);
const InitFlowAnimation = dynamic(
  () =>
    import("./widgets/InitFlowAnimation").then((m) => m.InitFlowAnimation),
);
const TransportPicker = dynamic(
  () => import("./widgets/TransportPicker").then((m) => m.TransportPicker),
);

export function Content() {
  return (
    <>
      <P>
        You&apos;ve built a server in chapter 6 — a small{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>currency-server</code>{" "}
        that exposes one tool and waits for someone to call it. The server
        sits there ready. Nothing happens until a consumer shows up. Most
        readers arrive thinking the consumer is the LLM. It isn&apos;t —
        the consumer is a <Term>client</Term>, and the client&apos;s first
        choice is also its hardest one: which <Term>transport</Term> does
        it speak.
      </P>

      <P>
        The 2025-06-18 spec leaves you with two answers. There used to be
        three; one of them was deprecated this round, and the chapter exists
        partly to keep you from tripping over old tutorials that still
        reach for it. Before any of that, the opener — what does the spec
        say a remote MCP server should do when a request shows up without
        credentials?
      </P>

      <OAuthGate />

      <H2>The client&apos;s job, in three sentences</H2>

      <P>
        A client opens a <Term>session</Term> with one server, drives the
        lifecycle, and exposes the discovered surface to the host. It
        speaks JSON-RPC over a transport you pick at construction time;
        every later request and notification rides that wire. One host,
        many clients — one per server, and that&apos;s the whole shape.
      </P>

      <P>
        The smallest version that works fits on the back of an envelope.
        A name, a transport, a connect, a list, a call. Everything else
        is convenience.
      </P>

      <CodeBlock
        lang="typescript"
        filename="minimal-client.ts (stdio)"
        code={`import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["./currency-server.js"],
});

const client = new Client({ name: "minimal-client", version: "0.1.0" });
await client.connect(transport);

const { tools } = await client.listTools();
const result = await client.callTool({
  name: "convert",
  arguments: { amount: 100, from: "USD", to: "EUR" },
});`}
      />

      <P>
        The interesting line is{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>
          client.connect(transport)
        </code>
        . Under the hood it runs the three-message handshake from chapter 4
        — same{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>initialize</code>{" "}
        request, same response, same{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>
          notifications/initialized
        </code>
        . Capability negotiation, version pinning, the gate before the
        session opens — all hidden behind one await. After it resolves,{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>listTools</code>{" "}
        and{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>callTool</code>{" "}
        are the two methods you reach for first.
      </P>

      <P>
        The widget below shows what those five lines look like on the
        wire — the transport opens, the handshake runs, then{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>tools/list</code>{" "}
        pulls the menu. Six messages, then your client has something to
        call.
      </P>

      <InitFlowAnimation />

      <H2>The transport question</H2>

      <P>
        The 2025-06-18 spec gives you two transports: <Term>stdio</Term>{" "}
        for same-machine, and <Term>Streamable HTTP</Term> for
        everywhere else. They&apos;re not interchangeable; each picks a
        different set of trade-offs about trust, locality, and auth.
      </P>

      <H3>stdio</H3>

      <P>
        The client spawns the server as a child process and pipes
        JSON-RPC over stdin and stdout. Logs go to stderr. The session
        is bound to the process lifetime — when the process exits, you
        get an <Term>EOF</Term> on the read side and the session is
        over. No port to open, no TLS to terminate, no auth header to
        forge: same machine, same user, no boundary. It&apos;s the
        cheapest wire there is.
      </P>

      <P>
        The trade-off lands on reach. stdio servers are single-instance,
        single-tenant, local-only. There&apos;s no way for a stdio
        server to be discovered, load-balanced, or accessed from a
        different machine. If your client and server share a process
        boundary, that&apos;s a feature; if they don&apos;t, it&apos;s
        a wall.
      </P>

      <H3>Streamable HTTP</H3>

      <P>
        The client sends JSON-RPC over a single HTTP endpoint — usually
        a <code style={{ fontFamily: "var(--font-mono)" }}>POST</code>{" "}
        — and the server replies with either a normal JSON response or
        a streamed{" "}
        <Term>SSE</Term> body when it has more than one message to
        deliver (think a long-running tool call that wants to push
        progress notifications mid-flight). Auth is the same auth your
        web infra already speaks: an{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>Authorization</code>{" "}
        header, OAuth scoping, an HTTP-layer session id.
      </P>

      <P>
        The session identity moves out of the process and into a header.
        The server hands the client a session id on the response to{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>initialize</code>
        ; every subsequent request carries it. That&apos;s how a
        load-balanced, multi-instance, multi-tenant deployment can route
        a tool call back to the same logical conversation — whichever
        instance happens to take the next request can hydrate state from
        the id.
      </P>

      <CodeBlock
        lang="typescript"
        filename="minimal-client.ts (Streamable HTTP variant)"
        code={`import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const transport = new StreamableHTTPClientTransport(
  new URL("https://api.example.com/mcp"),
  { requestInit: { headers: { Authorization: \`Bearer \${token}\` } } },
);

const client = new Client({ name: "minimal-client", version: "0.1.0" });
await client.connect(transport);`}
      />

      <P>
        Same client, same{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>connect</code>,
        same handshake under the hood. The only thing that changed is
        the transport constructor — a URL and a header in place of a
        command and args. That&apos;s by design: the SDK keeps the
        client surface identical, so your call sites don&apos;t care
        which wire you picked.
      </P>

      <H2>The HTTP+SSE deprecation, named</H2>

      <P>
        Earlier MCP specs shipped a different remote transport — call it{" "}
        <Term>HTTP+SSE</Term>. Two endpoints: a{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>POST</code>{" "}
        endpoint the client wrote to, and a separate SSE endpoint the
        client kept open to receive server-initiated messages. It
        worked, but it asked every deployment to keep two paths in sync,
        with auth scoping at two boundaries instead of one. The 2025-06-18
        spec deprecated the pairing in favour of{" "}
        <Term>Streamable HTTP</Term> — one endpoint, optional streaming
        on response. If a tutorial sends you toward{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>/sse</code> and{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>/messages</code>{" "}
        as separate paths, it&apos;s pointed at the deprecated shape.
      </P>

      <Aside>
        The full auth story — PKCE, dynamic client registration, token
        refresh — is out of scope for this chapter; OAuth gets a closer
        look later in the course. For now the load-bearing fact is the
        one the opener was about: 401 with a{" "}
        <Term>WWW-Authenticate</Term> header is the spec&apos;s
        recommended response to an unauthenticated request, and the
        client follows the header to find the auth metadata.
      </Aside>

      <H2>Pick a transport for your scenario</H2>

      <P>
        Trust, locality, and auth are the three axes the choice sits on.
        Same machine, same user, no auth boundary — stdio. Off-machine,
        multi-tenant, or auth lives at HTTP — Streamable HTTP. The
        widget below walks four real deployments. Pick the transport
        you&apos;d ship; wrong picks reveal what would actually break.
      </P>

      <TransportPicker />

      <H2>Operational concerns, in two paragraphs</H2>

      <P>
        Transports fail. With stdio the failure mode is loud and
        process-shaped: the child crashes, the read pipe gets an EOF,
        the client surfaces a transport error. There&apos;s nothing to
        retry — the session is gone with the process. With Streamable
        HTTP the failure mode is quieter: a connection drops, a load
        balancer reaps an idle session, a server instance restarts. The
        client typically re-issues the request; the spec&apos;s session
        header is what makes the retry idempotent across instances.
      </P>

      <P>
        Session expiration is the second thing to budget for. A
        long-lived stdio session lives as long as the process; if you
        kill the parent host, the children die with it. A Streamable
        HTTP session lives as long as the server agrees — minutes, often
        — and a stale session id will get a fresh{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>401</code> or{" "}
        a{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>404</code>{" "}
        depending on the server&apos;s policy. Either way, the client
        has to be willing to re-handshake. It&apos;s the same shape as
        re-establishing any other web session.
      </P>

      <H2>Comprehension check</H2>

      <P>
        Your remote MCP server is behind a load balancer. A client
        connects, sends{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>initialize</code>,
        and gets back an LB-assigned session id. Twenty minutes later it
        sends{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>tools/call</code>
        . What happens?
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
          It depends on the load balancer&apos;s session affinity. If
          the LB pins the session id to the same instance, the request
          lands on the instance that holds the conversation state and
          succeeds. If it doesn&apos;t — round-robin, instance died,
          deploy rotated — the request lands on a fresh instance that
          has never seen this session id and either rejects with a{" "}
          <code style={{ fontFamily: "var(--font-mono)" }}>404</code>{" "}
          (or 401, depending on the server&apos;s policy) or hydrates
          state from a shared store. This is precisely why the spec
          carries a session header and why session resumption matters
          — Streamable HTTP makes the routing problem explicit so the
          deployment can solve it instead of pretending the session
          lives in process memory.
        </P>
      </details>

      <H2>The session is open. Now what?</H2>

      <P>
        You&apos;ve got a server, a client, a transport, and the
        primitives the host can reach for. Most messages flow
        client-to-server: the host asks for the catalogue, calls a tool,
        reads a resource. But sometimes the server has to ask back —
        when it needs the LLM to complete a prompt, when it needs the
        user to answer a question, when it needs the host to widen its
        filesystem scope. The client&apos;s capability declarations are
        the licence for those reverse calls. {" "}
        <Link
          href="/courses/mcps/when-the-server-asks-back"
          className="font-sans"
          style={{ color: "var(--color-accent)" }}
        >
          That&apos;s chapter 8.
        </Link>
      </P>
    </>
  );
}

export default Content;
