/**
 * Chapter 2 — "Three roles, one connection" — body content.
 *
 * Server component. Imports its three widgets (which are "use client").
 * Prose voice follows voice-profile.md §12.1 (premise-quiz opener) +
 * §12.2 (mechanism-first) + §12.6 (widget-prose ramp). No <hr>, no <br>,
 * no horizontal section dividers (post-r4 rule).
 *
 * One <Aside> for the spec-name pedantry per the issue brief; the rest of
 * the prose is the load-bearing path. Code sample is a 6-line Claude
 * Desktop config showing two servers (filesystem + postgres). The TS-only
 * default doesn't apply to this snippet — the file format is JSON; we
 * render it with `lang="json"` (registered in lib/shiki.ts).
 */

import {
  P,
  H2,
  Code,
  Em,
  Aside,
  Term,
} from "@/components/prose";
import { CodeBlock } from "@/components/code/CodeBlock";
import { TextHighlighter } from "@/components/fancy/text-highlighter";
import { RoleQuiz } from "./widgets/RoleQuiz";
import { TopologyBuilder } from "./widgets/TopologyBuilder";
import { SessionLifecycleStrip } from "./widgets/SessionLifecycleStrip";
import { ComprehensionCheck } from "./widgets/ComprehensionCheck";
import { ChapterCliffhanger } from "./widgets/ChapterCliffhanger";

const HL_TRANSITION = { type: "spring" as const, duration: 0.9, bounce: 0 };
const HL_COLOR =
  "color-mix(in oklab, var(--color-accent) 28%, transparent)";
const HL_OPTS = { once: true, initial: false, amount: 0.55 } as const;

/** Highlight a load-bearing phrase. Default ltr swipe, spring, inView once. */
function HL({ children }: { children: React.ReactNode }) {
  return (
    <TextHighlighter
      transition={HL_TRANSITION}
      highlightColor={HL_COLOR}
      useInViewOptions={HL_OPTS}
      className="rounded-[0.2em] px-[1px]"
    >
      {children}
    </TextHighlighter>
  );
}

const CONFIG_SNIPPET = `{
  "mcpServers": {
    "filesystem": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/me/code"] },
    "postgres":   { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-postgres", "postgres://localhost/dev"] }
  }
}`;

export function Content() {
  return (
    <>
      {/* §0 — premise-quiz opener (voice §12.1) */}
      <P>
        Before we define anything, try this. You open Cursor and ask the AI
        to grep your codebase. Three things have to happen on the wire — and
        most readers can't name <em>which</em> piece is which.{" "}
        <HL>The gap between your guess and the truth is the rest of this chapter.</HL>
      </P>

      <RoleQuiz />

      {/* §1 — the misconception */}
      <H2>"MCP is like an API." It isn't.</H2>

      <P>
        Almost every reader walks in with the same wrong mental model: MCP
        is just an API the LLM calls. It's the closest thing they have to
        an analogy, so it sticks. The trouble is: APIs are <em>stateless</em>
        . You hit an endpoint, the server answers, the conversation is over.
        Two requests in a row don't know about each other unless you carry
        the state yourself.
      </P>

      <P>
        MCP is the opposite. <HL>An MCP exchange is a stateful session</HL>{" "}
        between three named roles — host, client, and server — that lasts as
        long as your editor is open. The session begins with a handshake,
        the two sides agree on a protocol version and what each is capable
        of, and from then on every message is interpreted in the context of
        that agreement. Drop the connection and you've lost the agreement;
        you can't pick up where you left off without re-handshaking.
      </P>

      <Aside>
        The spec word for this is a <Term>stateful session</Term>. The
        2025-06-18 specification of the Model Context Protocol calls it that
        in §<Code>basic.lifecycle</Code>; we'll see the handshake's actual
        JSON in chapter 4. For this chapter, it's enough to know that{" "}
        <em>stateful</em> means the wire remembers — and that the rest of
        the protocol is built on top of that memory.
      </Aside>

      {/* §2 — the host */}
      <H2>The host is what the human looks at.</H2>

      <P>
        A <Term>host</Term> is the application sitting in front of a human
        user — Claude Desktop, VS Code, Cursor, Zed, Replit, Codeium,
        Sourcegraph. It owns the LLM call. It owns the chat UI. It owns the
        user's trust posture: when a tool wants to write to disk, it's the
        host that asks "are you sure?". <HL>Whatever runs the model and
        renders the conversation — that's the host.</HL>
      </P>

      <P>
        The reader's first wrong guess almost always lives here: people
        suspect the LLM <em>itself</em> is the host. It isn't. The LLM is a
        callable resource the host owns; from MCP's point of view, the LLM
        sits on the host's side of the wall, not on the wire. MCP doesn't
        define how the host talks to the model. That's the host's business.
        MCP only defines how the host talks to <em>everything else</em>.
      </P>

      {/* §3 — the server */}
      <H2>The server is a separate process or service.</H2>

      <P>
        A <Term>server</Term> is anything outside the host that exposes a
        capability the host wants. A <Code>filesystem</Code> server is a
        small Node process that knows how to read and write files. A{" "}
        <Code>postgres</Code> server speaks SQL to a local database. A{" "}
        <Code>sentry</Code> server is a remote service that knows how to
        fetch error events from your account. <HL>Local or remote, in-house
        or third-party — from the host's view it's just "a server".</HL>
      </P>

      <P>
        Servers don't run inside the host. That's deliberate. A server is a{" "}
        <em>different process</em>, possibly on a different machine, often
        written by a different team. It crashes independently. It's
        upgraded independently. It can be replaced without touching the host
        — which is how Anthropic's marketing line "USB-C for AI" earns its
        keep: change the peripheral, the device doesn't care.
      </P>

      {/* §4 — the client */}
      <H2>The client is the connection, living inside the host.</H2>

      <P>
        Here's the piece readers most often miss. The <Term>client</Term> is
        not a separate program; it's not the LLM; it's not a network
        library. <HL>The client is a small connection-manager object the
        host instantiates — one per server.</HL> If the host has three
        servers configured, the host spins up three clients on launch. Each
        client owns one connection, one session, one negotiated set of
        capabilities, one live tool list. Two servers, two clients. Five
        servers, five clients.
      </P>

      <P>
        This is the load-bearing claim of the chapter and it's worth saying
        once more: <em>one client per server, exactly</em>. Not one shared
        client that fans out. Not a pool. A dedicated, in-memory connection
        manager per configured server, all of them living inside the same
        host process.
      </P>

      <H2>Why one client per server?</H2>

      <P>
        Three reasons, all paid off in later chapters. First, <em>state
        isolation</em>: each connection negotiates its own protocol version
        and capabilities at startup. The filesystem server might support
        prompts; the Postgres one might not. Mixing those into a single
        client would force the host to track per-server flags everywhere —
        the per-client object <em>is</em> that state.
      </P>

      <P>
        Second, <Term>capability negotiation</Term>. We'll dissect the
        handshake in chapter 4; for now: each session begins with the
        client and server telling each other what they can do, and the
        result of that exchange becomes the rules for the rest of the
        session. Sharing one client across two servers would mean two
        different rule-sets fighting over the same object.
      </P>

      <P>
        Third, <Term>transport</Term> isolation. One server might run
        locally over a Unix pipe; another might run remotely over HTTP.
        Pooling them would force one side to know about the other's wire
        format. Keeping them separate lets the host treat both the same
        way: <em>here is a client, ask it things</em>.
      </P>

      {/* §5 — load-bearing widget: TopologyBuilder */}
      <P>
        The widget below makes this concrete. There's a host card with no
        servers attached. Tap a server in the palette: a client badge
        appears inside the host, an arrow connects it to the server, and
        the status badge updates. Toggle the server between local and
        remote — notice the host doesn't move. <HL>Transport is the
        server's concern, not the host's.</HL>
      </P>

      <TopologyBuilder />

      <P>
        Three servers on the canvas, three clients inside the host, three
        live connections. Mark that picture: it's the picture every chapter
        from here forward draws on top of. When chapter 5 introduces tools,
        resources, and prompts, those primitives all live on{" "}
        <em>one of these arrows</em>. When chapter 7 chooses a transport,
        it's choosing what one of these arrows is made of.
      </P>

      {/* §6 — the lifecycle */}
      <H2>What happens on a single connection, in time.</H2>

      <P>
        We've drawn the topology — <em>where</em> the pieces are. Now zoom
        in on one of those arrows and ask: <em>what does it carry, and
        when?</em> Every client–server connection moves through five
        ticks. Step through them.
      </P>

      <SessionLifecycleStrip />

      <P>
        Tick three is the load-bearing one and it's where chapter 4 will
        live. <HL>What gets agreed during <em>initialize</em> is what the
        rest of the session is allowed to do.</HL> Skip the handshake and
        nothing else works; corrupt the handshake and chapter 9's attack
        classes get their opening. For now, it's enough to see that
        <em> exchange</em> sits on top of <em>initialize</em> — the order
        is not optional.
      </P>

      {/* §7 — the canonical config */}
      <H2>The mental model fits in a config file.</H2>

      <P>
        If the topology builder is the picture, this is the same picture in
        text. Most hosts read a JSON config keyed by server name; each block
        is one server, and on launch the host instantiates one client per
        block. Two entries means two clients. The shape is the model:
      </P>

      <CodeBlock
        code={CONFIG_SNIPPET}
        lang="json"
        filename="claude_desktop_config.json"
      />

      <P>
        Two servers configured, two clients spawned at startup, two
        independent sessions live for as long as the host is open. The
        config doesn't mention transports because the host figures that out
        from the entry's shape — a <Code>command</Code> means a local
        process over stdio; a <Code>url</Code> would mean a remote service
        over HTTP. Same JSON shape; different wire on the other side of the
        client.
      </P>

      {/* §8 — comprehension check */}
      <H2>Check your read.</H2>

      <P>
        One question to lock the topology in. Predict, then reveal.
      </P>

      <ComprehensionCheck />

      {/* §9 — cliffhanger */}
      <ChapterCliffhanger />
    </>
  );
}

export default Content;
