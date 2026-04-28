import {
  Prose,
  H1,
  H2,
  P,
  Code,
  A,
  Aside,
  Callout,
  Dots,
  Term,
} from "@/components/prose";
import { PostBackLink } from "@/components/nav/PostBackLink";
import { PostNavCards } from "@/components/nav/PostNavCards";
import { TextHighlighter } from "@/components/fancy";
import { CodeBlock } from "@/components/code/CodeBlock";
import {
  PredictTheHandshake,
  RoleTopology,
  HandshakeWalkthrough,
  SixPrimitives,
  TransportToggle,
} from "./widgets";
import {
  INITIALIZE_REQUEST_SNIPPET,
  TRANSPORT_STDIO_SNIPPET,
  TRANSPORT_HTTP_SNIPPET,
} from "./widgets/snippets";
import { metadata } from "./metadata";

export { metadata };

const HL_TRANSITION = { type: "spring" as const, duration: 0.9, bounce: 0 };
const HL_COLOR = "color-mix(in oklab, var(--color-accent) 28%, transparent)";
const HL_OPTS = { once: true, initial: false, amount: 0.55 } as const;

/** Highlight a load-bearing phrase. ltr swipe, spring, in-view-once. */
function HL({
  children,
  direction = "ltr",
}: {
  children: React.ReactNode;
  direction?: "ltr" | "rtl" | "ttb" | "btt";
}) {
  return (
    <TextHighlighter
      transition={HL_TRANSITION}
      highlightColor={HL_COLOR}
      useInViewOptions={HL_OPTS}
      direction={direction}
      className="rounded-[0.2em] px-[1px]"
    >
      {children}
    </TextHighlighter>
  );
}

export default function MCPsExplained() {
  return (
    <Prose>
      <div className="pt-[var(--spacing-xl)]">
        <PostBackLink />
        <H1>MCPs Explained: What They Are and How They Work</H1>
        <p
          className="mt-[var(--spacing-sm)] font-mono tabular-nums"
          style={{
            fontSize: "var(--text-small)",
            color: "var(--color-text-muted)",
          }}
        >
          <time dateTime="2026-04-28">apr 28, 2026</time>
          <span className="mx-2">·</span>
          <span>17 min read</span>
        </p>

        {/* §0 — the premise quiz */}
        <P>
          Before we explain anything, look at the JSON below. A client just
          opened an MCP session by sending it. Read it once, then guess what
          the server sends back.{" "}
          <HL>
            The gap between option 1 and option 2 is the whole shape of MCP.
          </HL>
        </P>
      </div>

      <PredictTheHandshake
        codeSlot={
          <CodeBlock
            lang="json"
            filename="initialize · request"
            code={INITIALIZE_REQUEST_SNIPPET}
          />
        }
      />

      <div>
        <P>
          Most readers reach for option 1 — &ldquo;a list of tools&rdquo; — because
          they think of MCP as a manifest you load. It isn&apos;t. The server
          sends back a contract first: <em>here&apos;s the protocol version I
          speak, here are the capabilities I support.</em> The client confirms
          with a one-way <Code>notifications/initialized</Code>, and only{" "}
          <em>then</em> can either side ask the other for tools, resources,
          prompts, or anything else. The handshake doesn&apos;t list
          capabilities — it negotiates them.
        </P>
        <P>
          That negotiation is the entire spine of the protocol. Once you can
          read it, every other part of MCP becomes a corollary: how servers
          expose tools, how clients let servers ask the model for things, how
          the same dance survives over a subprocess pipe or a session-tracked
          HTTPS endpoint, why every published security incident reads as a
          host-side mistake. This post walks the spine, then the corollaries.
        </P>
      </div>

      {/* §1 — why MCP exists: N×M */}
      <div>
        <Dots />
        <H2>Why MCP exists: the N×M problem</H2>
        <P>
          Picture the world a year ago. You&apos;re using Claude Desktop to
          summarise a Notion page; the model can&apos;t see Notion, so you
          paste. You ask Cursor to scaffold a feature against your team&apos;s
          GitHub; the model can&apos;t see GitHub, so you paste. You wire a
          Linear plugin to ChatGPT, then a different Linear adapter to
          Cursor, then a third for Cline. Every host writes a one-off
          integration for every tool. The integration count grows as{" "}
          <em>N hosts × M tools</em>, and at some point the world gives up.
        </P>
        <P>
          Engineers have seen this shape before. Editors and language servers
          had the same nightmare: every IDE reimplemented Go-to-definition for
          every language, until Microsoft published the{" "}
          <A href="https://microsoft.github.io/language-server-protocol/">
            Language Server Protocol
          </A>{" "}
          in 2016. Each editor implemented LSP once. Each language wrote one
          server. The N×M cell-grid collapsed into a clean <em>N+M</em>: every
          host and every tool implements the protocol once, and they meet in
          the middle.{" "}
          <HL>
            Every host and every tool implements the protocol once → N+M.
          </HL>{" "}
          That is the entire structural reason MCP exists.
        </P>
        <P>
          The story has a person at the centre. David Soria Parra joined
          Anthropic in mid-2024 after a stretch building developer tools at
          Meta and Atlassian. He was, predictably, copy-pasting between Claude
          Desktop and his IDE. He had also worked on LSP at his previous job,
          and the structural symmetry hit him immediately. With Justin
          Spahr-Summers, he prototyped a JSON-RPC-shaped protocol that put a
          shared layer between any AI host and any tool. Roughly six weeks
          later — November 25, 2024 — Anthropic announced{" "}
          <A href="https://www.anthropic.com/news/model-context-protocol">
            the Model Context Protocol
          </A>{" "}
          as an open specification with reference servers, an SDK, and a
          permissive licence.
        </P>
        <P>
          By the time you are reading this — early 2026 — both OpenAI and
          Google Gemini ship native MCP support. The public ecosystem holds
          more than ten thousand servers; the JavaScript and Python SDKs pull
          something on the order of ninety-seven million downloads a month.
          The spec page calls MCP a <em>USB-C port for AI applications</em>.
          That metaphor isn&apos;t marketing — it&apos;s the right shape. One
          plug. One contract. Any host on one side, any capability on the
          other.
        </P>
        <Aside>
          The LSP comparison isn&apos;t just rhetorical. MCP&apos;s wire format
          is{" "}
          <A href="https://www.jsonrpc.org/specification">JSON-RPC 2.0</A>,
          which LSP also uses. If you&apos;ve ever shipped a language-server
          extension, you already speak two thirds of the protocol — only the
          methods change.
        </Aside>
      </div>

      {/* §2 — three roles, one boundary */}
      <div>
        <Dots />
        <H2>Three roles, one boundary</H2>
        <P>
          Before any wire format makes sense, you have to install the
          topology. MCP names exactly three roles, and the trust boundary
          lives between two of them.
        </P>
        <P>
          A <Term>host</Term> is the application the user trusts — Claude
          Desktop, Cursor, ChatGPT&apos;s desktop client, Cline. The host
          owns the model, the conversation, and the user&apos;s consent. A{" "}
          <Term>client</Term> is a small adapter that lives <em>inside</em> the
          host and speaks MCP on its behalf; one client per server, owned by
          the host. A <Term>server</Term> is a focused capability provider — a
          filesystem, a GitHub adapter, a Notion adapter — that does one thing
          and exposes it through a JSON-RPC endpoint.
        </P>
        <P>
          The split looks like over-engineering until you ask <em>where the
          user&apos;s trust lives.</em> It lives in the host. The host is the
          piece of software the user installed, granted permissions to,
          pointed at a model. Servers are configured later, often
          one-click-installs from a third-party registry. If the host let
          servers reach into the conversation directly, every tool install
          would be a credential install. So MCP separates them: the client
          is the sealed adapter, owned by the host, that lets the server
          speak <em>only</em> through the protocol surface. The host enforces
          the boundary at the protocol layer.
        </P>
      </div>

      <RoleTopology />

      <div>
        <P>
          Three things a server <em>cannot do</em>, and these are the
          load-bearing facts: it cannot see the user&apos;s ongoing
          conversation, it cannot see the other servers running alongside it,
          and it cannot call the model directly. Anything from those three
          buckets must come through the host — and the host gets to say no.
          That last clause is the entire security model, hiding in plain
          sight; we&apos;ll cash it in at §7.
        </P>
        <P>
          The host is the only thing on this canvas that knows the user. The
          servers are isolated by design — and because they&apos;re isolated,
          you can install a dozen of them without thinking about cross-tool
          contamination. That property is why <em>marketplace</em> energy
          actually works for MCP: each server is a self-contained capability
          behind a uniform pipe.
        </P>
      </div>

      {/* §3 — the handshake IS the protocol */}
      <div>
        <Dots />
        <H2>The handshake is the protocol</H2>
        <P>
          Now to the spine. Every MCP session starts with the same three
          messages, and after them, every later message — every tool call,
          every resource read, every sampling round-trip — is just JSON-RPC
          riding the same connection.
        </P>
        <P>
          Message one is the <Code>initialize</Code> request. The client
          declares which protocol version it speaks (the current stable
          baseline is <Code>2025-06-18</Code>), what capabilities it
          <em> can</em> offer to the server (roots, sampling, elicitation),
          and a small <Code>clientInfo</Code> tag for logs and crash reports.
          Note what&apos;s <em>not</em> in the request: any mention of tools,
          resources, or prompts. The client doesn&apos;t expose those — the
          server does. The handshake is asymmetric on purpose.
        </P>
        <P>
          Message two is the <Code>initialize</Code> response. The server
          echoes the version it&apos;ll commit to (it picks the latest
          version <em>both</em> sides understand, so an older client can
          still talk to a newer server), then declares <em>its</em>{" "}
          capabilities — the actual <Code>tools</Code>,{" "}
          <Code>resources</Code>, <Code>prompts</Code> primitives it offers,
          plus optional sub-flags like <Code>listChanged</Code> for change
          notifications. After this exchange, both sides are pinned to the
          intersection. The session has a contract.
        </P>
        <P>
          Message three is <Code>notifications/initialized</Code>: the client
          says &ldquo;I&apos;ve read your response, I&apos;m ready.&rdquo;
          It&apos;s a JSON-RPC <Term>notification</Term> — no <Code>id</Code>,
          no response expected. Until the server sees it, the spec forbids the
          server from sending anything but ping or logging. Until the client
          sees the response, the spec forbids the client from sending anything
          but ping. The handshake is a hard gate; nothing else moves until
          it&apos;s done.
        </P>
      </div>

      <HandshakeWalkthrough />

      <div>
        <P>
          What the handshake gives both sides is a kind of contract pinning.
          Neither side can be surprised later by a feature the other never
          declared. If the client doesn&apos;t advertise{" "}
          <Code>sampling</Code>, the server simply must not call it; the
          server&apos;s SDK won&apos;t even expose the method. If the server
          doesn&apos;t advertise <Code>tools</Code>, the client won&apos;t
          call <Code>tools/list</Code>. The intersection is the working set,
          and it&apos;s known up front. Capability mismatches are a startup
          error, not a runtime mystery.
        </P>
        <P>
          That is the whole protocol, structurally.{" "}
          <HL>
            The handshake is the protocol; everything after is JSON-RPC riding
            the negotiated session.
          </HL>{" "}
          <Code>tools/list</Code>, <Code>tools/call</Code>,{" "}
          <Code>resources/read</Code>, <Code>sampling/createMessage</Code>,{" "}
          <Code>elicitation/create</Code> — every later method is just a
          JSON-RPC envelope shaped to the contract. The next two sections walk
          those primitives one by one.
        </P>
        <Aside>
          Version mismatch isn&apos;t fatal. If the client requests a version
          the server can&apos;t serve, the server replies with JSON-RPC error{" "}
          <Code>-32602</Code> and a <Code>data.supported</Code> array listing
          versions it does serve. The client picks one and re-handshakes.
          That&apos;s the same pattern LSP uses, and the same one HTTP{" "}
          <Code>Upgrade</Code> uses for WebSocket, and the same one TLS uses
          for cipher selection. Long-lived protocols all eventually need to
          re-negotiate.
        </Aside>
      </div>

      {/* §4 — server primitives */}
      <div>
        <Dots />
        <H2>What servers expose: tools, resources, prompts</H2>
        <P>
          A server offers three kinds of things. They&apos;re all just JSON-RPC
          methods underneath, and they all ride the same negotiated session,
          but the protocol gives them three different names because{" "}
          <em>who pulls the trigger</em> is different in each case. That&apos;s
          the unifier. One axis, three points on it.
        </P>
        <P>
          <Term>Tools</Term> are <strong>model-controlled</strong>. The model,
          mid-turn, decides to call <Code>read_file</Code> or{" "}
          <Code>create_pull_request</Code>; the host routes the call through
          the client to the server, gets the result, and feeds it back into
          the model&apos;s next turn. The schema for inputs is plain JSON
          Schema — same shape OpenAI&apos;s function-calling API uses, same
          shape Anthropic&apos;s tool-use API uses. As of{" "}
          <Code>2025-06-18</Code>, tools can also declare an{" "}
          <Code>outputSchema</Code> and return <Code>structuredContent</Code>{" "}
          alongside the free-form <Code>content</Code> array, which lets the
          model parse results without prompt-engineering its way out of
          ambiguity.
        </P>
        <P>
          Tool descriptions are arbitrary text. The model reads them. The
          spec is explicit on this point: <strong>annotations like{" "}
          <Code>readOnlyHint</Code>, <Code>destructiveHint</Code>, or{" "}
          <Code>idempotentHint</Code> are advisory hints that hosts MUST treat
          as untrusted unless the server itself is trusted</strong>. A tool
          that says &ldquo;I&apos;m read-only&rdquo; in its annotations is a
          self-report; it isn&apos;t the protocol&apos;s job to verify it.
          That sentence will matter a lot in §7.
        </P>
        <P>
          <Term>Resources</Term> are <strong>app-controlled</strong>. Where a
          tool is something the model decides to invoke, a resource is
          something the host decides to inject — a file, a snippet, a piece
          of structured context, identified by a URI. The host might surface
          a resource in a UI affordance (&ldquo;attach this file to the
          chat&rdquo;), or pull resources in automatically based on the
          user&apos;s open workspace. URIs follow{" "}
          <A href="https://datatracker.ietf.org/doc/html/rfc6570">
            RFC 6570
          </A>{" "}
          templates: <Code>file:///{`{path}`}</Code>,{" "}
          <Code>git://{`{repo}`}/{`{ref}`}/{`{path}`}</Code>, whatever the
          server defines. <Code>resources/subscribe</Code> opts into a push
          notification when the resource changes — useful for IDE-shaped
          servers where the file you read three minutes ago is now stale.
        </P>
        <P>
          <Term>Prompts</Term> are <strong>user-controlled</strong>. They&apos;re
          templated chat-completion seeds the user invokes deliberately,
          usually surfaced as slash-commands in the host UI. A{" "}
          <Code>code_review</Code> prompt with a <Code>language</Code>{" "}
          argument; an <Code>incident_postmortem</Code> prompt with a{" "}
          <Code>severity</Code> argument. <Code>prompts/get</Code> returns a{" "}
          <Code>messages[]</Code> array that becomes the opening of a fresh
          turn. These are the safest of the three by construction: nothing
          fires unless the user typed the slash.
        </P>
        <P>
          Three primitives, one axis. <em>Tools, the model triggers.
          Resources, the host triggers. Prompts, the user triggers.</em>{" "}
          Every server-side capability you&apos;ll ever read about in the MCP
          ecosystem is one of these three, distinguished by who pulls the
          trigger. The widget below puts them on a single canvas with three
          more we haven&apos;t met yet — the ones the <em>client</em> exposes,
          and the reason this protocol is interesting.
        </P>
      </div>

      {/* §5 — client primitives, sampling deep */}
      <div>
        <Dots />
        <H2>What clients expose to servers: sampling, roots, elicitation</H2>
        <P>
          Here is the part that surprises people. Three of MCP&apos;s six
          primitives don&apos;t go from client to server at all. They go the
          other way. The client exposes them; the server invokes them. And
          one of the three is genuinely radical:{" "}
          <HL>
            servers can be agentic without ever owning a model.
          </HL>
        </P>
      </div>

      <SixPrimitives />

      <div>
        <P>
          Tap the <em>sampling</em> chip; that&apos;s where the protocol
          earns its &ldquo;ahead of its time&rdquo; reputation. The other two
          — roots and elicitation — are sharper-than-they-look but not
          surprising once you see them.
        </P>
        <H2 id="sampling">Sampling, in depth</H2>
        <P>
          <Term>Sampling</Term> lets the server ask the host&apos;s model for
          a completion. Method:{" "}
          <Code>sampling/createMessage</Code>. Direction: server → client.
          The server sends a <Code>messages[]</Code> array, an optional{" "}
          <Code>systemPrompt</Code>, optional <Code>modelPreferences</Code>{" "}
          (hints — name, intelligence priority, speed priority, cost
          priority), an optional{" "}
          <Code>includeContext</Code> flag (<Code>none</Code>,{" "}
          <Code>thisServer</Code>, or <Code>allServers</Code>), and a{" "}
          <Code>maxTokens</Code> ceiling. The client routes the request to
          whichever model the user picked, gets a response back, and returns
          it to the server.
        </P>
        <P>
          The radical move is who pays. The server doesn&apos;t need an
          OpenAI key, an Anthropic key, a Google key. It doesn&apos;t need
          a billing relationship with a model provider at all. The user&apos;s
          host already has one — the user is signed in to Claude Desktop,
          they pay Anthropic for tokens, the host charges <em>them</em>. The
          server gets an inference for free, on the user&apos;s dime, against
          the user&apos;s chosen model. That&apos;s a different shape than
          most agent frameworks, and it lets a server&apos;s author build
          something genuinely intelligent — multi-step orchestration,
          summarisation, classification, planning — without standing up any
          inference infrastructure of their own.
        </P>
        <P>
          Now the careful part: a model invocation that can be triggered by
          a server is, in the worst case, an attack vector. The server&apos;s
          messages could contain anything. Anything could come back. So
          sampling is wrapped in two human-in-the-loop gates the spec
          recommends and every reasonable host implements:
        </P>
        <P>
          <strong>HITL #1 — before send.</strong> When the server&apos;s{" "}
          <Code>sampling/createMessage</Code> arrives, the client doesn&apos;t
          forward it to the model immediately. It surfaces the request to the
          user — the messages, the system prompt, the requested model
          preferences — and lets the user approve, edit, or reject. The
          edit case is non-trivial: the user can rewrite a server&apos;s
          prompt before it hits their model. In practice most hosts make this
          a one-click approve, but the option to edit is the protocol&apos;s
          escape hatch against a malicious or buggy server.
        </P>
        <P>
          <strong>HITL #2 — before return.</strong> The model produces a
          response. Before that response leaves the client, the host shows
          it to the user. Approve, edit, or reject — same three options.
          That&apos;s the second gate: a server can&apos;t exfiltrate the
          model&apos;s output by simply asking the model nicely, because the
          user sees what comes back before the server does.
        </P>
        <P>
          Two gates, both labelled SHOULD in the spec rather than MUST, but
          all three of the major hosts that have shipped sampling treat them
          as MUST in practice. The protocol document is careful here: it
          describes the boundary the host should enforce, but acknowledges
          the host is the one doing the enforcing. Typical MCP rhythm.
        </P>
        <P>
          One subtle thing about <Code>modelPreferences</Code>: they are{" "}
          <em>hints</em>, not contracts. A server can express &ldquo;I&apos;d
          like a fast, cheap model — Haiku-class is fine&rdquo; via{" "}
          <Code>speedPriority: 0.8, costPriority: 0.7</Code>. The host might
          honour that, or it might route to Sonnet, or to a local
          llama.cpp build, or to whatever the user has configured as the
          default. The server gets back a <Code>model</Code> field telling it
          what was actually used, and a <Code>stopReason</Code>, and the
          <Code>content</Code> the model produced. Programming against
          sampling means programming for graceful degradation — your
          summariser shouldn&apos;t assume frontier-model quality just
          because you asked nicely.
        </P>
        <P>
          And there is one subtle thing about <Code>includeContext</Code>:
          it&apos;s a request, not a guarantee. <Code>none</Code> means the
          server&apos;s messages are the entire prompt — no user
          conversation history bleeds in. <Code>thisServer</Code> says the
          host may choose to attach context the user has already shared with
          this particular server. <Code>allServers</Code> reaches across the
          installed MCP graph. Hosts will, almost without exception, keep
          this gated: the default is <Code>none</Code>, escalation requires
          explicit user consent, and the user sees what context attached
          alongside the HITL #1 review.
        </P>
        <P>
          The honest hardship: sampling is underadopted. Claude Desktop ships
          it. A few open-source clients ship it. Most of the big general-
          purpose hosts that talk to MCP — including, as of late 2025, the
          ones from the largest model providers — gate sampling behind opt-in
          flags, ship partial implementations, or skip it altogether. The
          protocol exists; the ecosystem has not caught up. If you&apos;re
          building a server today and you want it to work for the broadest
          audience, you treat sampling as a nice-to-have augmentation, not a
          load-bearing feature. That&apos;s an honest place for the protocol
          to be — radical idea, gradual ecosystem.
        </P>
        <Aside>
          The economics of sampling are doing something quietly novel. Today
          most agent stacks bundle inference and orchestration into the same
          service, paid for by the same vendor. With sampling, an MCP server
          can ship as &ldquo;just orchestration logic plus data access,&rdquo;
          and the host pays for the model. That uncouples the agent layer
          from the inference layer in a way nothing else has. Whether the
          ecosystem leans into it or not is a question for 2026 and beyond.
        </Aside>
        <H2 id="roots">Roots</H2>
        <P>
          <Term>Roots</Term> are the filesystem boundary the client tells the
          server it&apos;s allowed to operate inside. <Code>roots/list</Code>{" "}
          goes server → client; the response is an array of <Code>file://</Code>{" "}
          URIs naming the workspace directories the user has authorised. When
          the user opens a new workspace or closes one, the client fires{" "}
          <Code>notifications/roots/list_changed</Code> as a sub-flag-gated
          notification, and the server is expected to refresh its sense of
          scope.
        </P>
        <P>
          The shape is IDE-shaped. An editor with three open workspaces
          declares three roots. A filesystem MCP server reads files inside
          those roots and refuses anything outside. Any server that ignores
          roots — that walks up <Code>../..</Code> looking for{" "}
          <Code>~/.ssh/id_rsa</Code> — is a host-side bug pretending to be a
          server feature. We&apos;ll see what happens when a host fails to
          enforce roots in §7.
        </P>
        <H2 id="elicitation">Elicitation</H2>
        <P>
          <Term>Elicitation</Term> is the newest of the six primitives, added
          in <Code>2025-06-18</Code>. It lets the server, mid-tool-call, ask
          the user a follow-up question. <Code>elicitation/create</Code>{" "}
          carries a <Code>message</Code> string and a{" "}
          <Code>requestedSchema</Code> — a JSON Schema (restricted to
          primitive types: string, number, boolean, plus enums) describing
          the shape of the expected reply. The client renders the schema as
          a form, the user fills it, the client returns the reply.
        </P>
        <P>
          What this lets servers do: stop hard-coding every choice into the
          tool input schema. A calendar tool can have a generic{" "}
          <Code>create_event</Code> tool and ask &ldquo;which calendar?&rdquo;
          when it&apos;s actually needed, instead of forcing the model to
          guess from a static enum. A deploy tool can ask &ldquo;production
          or staging?&rdquo; only when the model didn&apos;t specify. It&apos;s
          the protocol getting more conversational — and the schema
          restriction (primitive types only) is on purpose: the client must
          be able to render the form without an HTML engine.
        </P>
      </div>

      {/* §6 — transports */}
      <div>
        <Dots />
        <H2>Two transports: stdio and Streamable HTTP</H2>
        <P>
          The same JSON-RPC dance ships over two wire formats. They&apos;re
          the same protocol — same handshake, same primitives, same error
          codes. What changes is who lives where.
        </P>
        <P>
          Over <strong>stdio</strong>, the host launches the server as a
          subprocess and wires their stdio together. Stdin is{" "}
          client → server; stdout is server → client; stderr is the
          server&apos;s free-form log channel. Each JSON-RPC message is one
          line. The big stdio rule —{" "}
          <strong>messages MUST NOT contain embedded newlines, and the
          server MUST NOT write non-MCP bytes to stdout</strong> — exists
          because the framing <em>is</em> &ldquo;split on{" "}
          <Code>\n</Code>.&rdquo; A stray <Code>console.log</Code> printing
          to stdout will corrupt the next message. Server logs go to stderr
          for exactly this reason. Shutdown is by closing the subprocess&apos;s
          stdin and waiting; <Code>SIGTERM</Code> after a timeout, then{" "}
          <Code>SIGKILL</Code> if needed.
        </P>
        <P>
          Over <strong>Streamable HTTP</strong>, the server is a standalone
          web service the host connects to. Single endpoint —{" "}
          <Code>POST /mcp</Code> for client → server,{" "}
          <Code>GET /mcp</Code> with{" "}
          <Code>Accept: text/event-stream</Code> for server → client push.
          POSTs can return either a single JSON response (for cheap calls) or
          an SSE stream (for streaming responses or to deliver multiple
          notifications at once). The server assigns an{" "}
          <Term>Mcp-Session-Id</Term> on the initialize response; the client
          echoes it on every subsequent request. Lose the session id and the
          server returns 404. Reconnects use SSE event ids plus{" "}
          <Code>Last-Event-ID</Code> to replay any messages the client
          missed during disconnect — <em>resumability</em>, in spec
          parlance, and the reason the protocol survives flaky networks.
        </P>
      </div>

      <TransportToggle
        panes={{
          stdio: {
            node: (
              <CodeBlock
                lang="bash"
                filename="stdio · subprocess pipe"
                code={TRANSPORT_STDIO_SNIPPET}
              />
            ),
          },
          http: {
            node: (
              <CodeBlock
                lang="http"
                filename="Streamable HTTP · session-tracked"
                code={TRANSPORT_HTTP_SNIPPET}
              />
            ),
          },
        }}
      />

      <div>
        <P>
          Streamable HTTP also requires an{" "}
          <Code>MCP-Protocol-Version</Code> header on every post-init
          request (added in <Code>2025-06-18</Code>) so a load-balanced server
          can route to the correct version handler without re-running the
          handshake. And there are two security-critical client-side rules
          when you bind a local Streamable-HTTP server: validate the{" "}
          <Code>Origin</Code> header against an allowlist (DNS-rebinding
          mitigation — without this, a malicious web page could ask{" "}
          <Code>localhost:3000</Code> for a tool call), and bind to{" "}
          <Code>127.0.0.1</Code> rather than <Code>0.0.0.0</Code> so the
          server isn&apos;t discoverable from the rest of the network.
        </P>
        <P>
          The honest comparison is short. Stdio is zero infrastructure, dies
          with the host process, runs one client per server, and is wonderful
          for local capabilities — your filesystem, your git, your SQLite
          file. Streamable HTTP is shareable across clients, survives
          reconnects, can be load-balanced, and is the future for hosted
          servers. It needs auth, it needs origin checks, it needs session
          management. Most reference servers ship both transports; you pick
          based on whether the server needs to live in your editor or in the
          cloud.
        </P>
        <Aside>
          The 2024-11-05 revision of the spec carried a different transport
          called HTTP+SSE — two endpoints, one for POST and one for the SSE
          stream, with explicit endpoint discovery. It worked, but it was
          fragile. Streamable HTTP collapsed both endpoints into one and
          added the session id and event-id replay machinery, and the older
          transport was deprecated in <Code>2025-03-26</Code>. If you read
          older MCP guides, the &ldquo;HTTP+SSE&rdquo; phrase you&apos;ll see
          is this older shape; modern servers don&apos;t implement it.
        </Aside>
      </div>

      {/* §7 — security */}
      <div>
        <Dots />
        <H2>The boundary is the security model</H2>
        <P>
          Now we cash in §2&apos;s promise. A year of MCP shipping in
          production has produced a steady drip of security incidents — tool
          poisoning, rug-pulls, credential exfiltration, public data leaks.
          Every time, the same thing is true:{" "}
          <HL>
            every published attack on MCP is a host-side trust-boundary
            failure, not a protocol flaw.
          </HL>
        </P>
        <P>
          The protocol exposes the boundary; it does not enforce it. The
          host&apos;s job is to enforce it. Every published incident is a
          host that didn&apos;t. Three families:
        </P>
        <P>
          <strong>
            Tool poisoning (Invariant Labs, April 2025).
          </strong>{" "}
          A malicious server hides instructions in the tool{" "}
          <Code>description</Code> or in the advisory annotations the spec
          warns are untrusted. The model reads the description in full when
          deciding whether to call the tool; the user, in most host UIs, sees
          only the tool name and a short summary. The hidden instruction is
          legible to the model, invisible to the user. The model follows it.
          That is a host-side disclosure failure: the host showed the user a
          truncated view of something the model was being asked to trust.
        </P>
        <P>
          <strong>Rug-pulls.</strong> A server changes its tool description
          after the user installed it. The user originally approved&nbsp;
          <em>tool X with description X</em>; the model now sees{" "}
          <em>tool X with description Y</em>. Some hosts surface the diff;
          most don&apos;t. The protocol&apos;s <Code>listChanged</Code>{" "}
          notification gives the host the trigger it needs to surface a
          change — the host has to actually use it.
        </P>
        <P>
          <strong>
            Cursor <Code>mcp.json</Code> exfiltration (Check Point, 2025).
          </strong>{" "}
          A poisoned filesystem MCP server tricks the host into reading{" "}
          <Code>~/.cursor/mcp.json</Code> — which contains every other
          server&apos;s credentials — plus <Code>~/.ssh/</Code>. The user&apos;s
          declared roots didn&apos;t include either path. The server asked
          anyway. The host, configured permissively, complied. That is a
          roots-violation, full stop: the host let one server reach for
          files outside its declared scope.
        </P>
        <Callout tone="warn">
          The pattern across all three is what Simon Willison called the{" "}
          <Term>lethal trifecta</Term> in his July 2025 essay on the
          Supabase / Cursor incident: <em>privileged data, untrusted input,
          external communication.</em> A privileged service-role token
          processed an untrusted issue body that contained SQL injection
          instructions; the agent used the token to read sensitive rows and
          then wrote them to a public thread. None of those three legs is a
          protocol flaw. Each is an architectural choice the host made.{" "}
          <strong>The host&apos;s job is to break at least one leg of that
          triangle.</strong> Read his original essay at{" "}
          <A href="https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/">
            simonwillison.net
          </A>{" "}
          if you haven&apos;t — it&apos;s the rubric the entire ecosystem
          should be using.
        </Callout>
        <P>
          What does &ldquo;break at least one leg&rdquo; look like in
          practice? On <em>privileged data</em>: scope tokens to the minimum
          needed; never give an agent a service-role token when a row-level
          read-only token will do. On <em>untrusted input</em>: treat
          everything from a server — descriptions, annotations, resource
          contents, sampling responses — as data, never as instructions; if
          the agent reads a comment from an untrusted source, it must not
          act on instructions inside it without explicit user consent. On{" "}
          <em>external communication</em>: gate the side-effect actions —
          posting, emailing, opening pull requests — behind a confirmation
          step the user has to physically click. Any one of those three,
          enforced rigorously, breaks the chain.
        </P>
        <P>
          MCP didn&apos;t invent any of these problems. They&apos;re the
          same pattern every privileged-agent system has had to learn the
          hard way, since long before LLMs. What MCP did was make the
          boundary <em>visible</em> — three roles, one negotiated session,
          one enforcement seam. That visibility is also why every MCP
          incident reads as predictable in retrospect: you can see exactly
          which leg of the trifecta the host failed to break.
        </P>
      </div>

      {/* §8 — closer */}
      <div>
        <Dots />
        <H2>One handshake, six primitives, one boundary</H2>
        <P>
          Scroll back up to the opener. The four options aren&apos;t a
          riddle anymore — option 2 was the entire shape of the protocol,
          compressed into one message. The server replies with capabilities;
          the client confirms; everything else rides what they agreed.
        </P>
        <P>
          <em>Tools, resources, prompts, sampling, roots, elicitation —
          six names for messages riding one negotiated session.</em> Two
          transports for the wire, one boundary the host enforces, one
          handshake to start every conversation. That is the whole protocol
          — and once you can see it, the ecosystem stops looking like magic
          and starts looking like, well, a protocol.
        </P>
        <p
          className="mt-[var(--spacing-md)] font-serif"
          style={{
            fontStyle: "italic",
            fontSize: "var(--text-medium)",
            textAlign: "center",
            color: "var(--color-text)",
            maxWidth: "44ch",
            marginInline: "auto",
            lineHeight: 1.45,
          }}
        >
          The model didn&apos;t get smarter. The conversation did.
        </p>
        <p
          aria-hidden
          className="font-mono text-center select-none"
          style={{
            marginBlock: "var(--spacing-xl)",
            color: "var(--color-accent)",
            opacity: 0.8,
            fontSize: "var(--text-body)",
            letterSpacing: "0.2em",
          }}
        >
          ·
        </p>
      </div>
      <PostNavCards slug="mcps-explained" />
    </Prose>
  );
}
