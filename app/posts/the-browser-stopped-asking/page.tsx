import {
  Prose,
  H1,
  H2,
  P,
  Code,
  Callout,
  Dots,
  Em,
  A,
  FullBleed,
  HeroTile,
  Term,
} from "@/components/prose";
import { PostBackLink } from "@/components/nav/PostBackLink";
import { PostNavCards } from "@/components/nav/PostNavCards";
import { CodeBlock } from "@/components/code";
import { TextHighlighter } from "@/components/fancy";
import {
  Polling,
  LongPoll,
  WebSocketStream,
  UpgradeHandshake,
  ReconnectGap,
  CostMatrix,
} from "./widgets";
import { metadata, subtitle } from "./metadata";

export { metadata };

const HL_TRANSITION = { type: "spring" as const, duration: 0.9, bounce: 0 };
const HL_COLOR =
  "color-mix(in oklab, var(--color-accent) 28%, transparent)";
const HL_OPTS = { once: true, initial: false, amount: 0.55 } as const;

/** Highlight a load-bearing phrase. Default ltr swipe, spring, inView once. */
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

export default function TheBrowserStoppedAsking() {
  return (
    <Prose>
      <div className="pt-[var(--spacing-xl)]">
        <PostBackLink />
        <div className="mt-[var(--spacing-md)] mb-[var(--spacing-md)] hidden md:flex flex-col items-start gap-[var(--spacing-md)] lg:flex-row lg:items-end">
          <HeroTile slug="the-browser-stopped-asking" />
        </div>
        <H1>WebSockets, SSE, and long-polling: how real-time web works</H1>
        <p
          className="mt-[var(--spacing-sm)] font-mono tabular-nums"
          style={{
            fontSize: "var(--text-small)",
            color: "var(--color-text-muted)",
          }}
        >
          <time dateTime="2026-04-20">apr 20, 2026</time>
          <span className="mx-2">·</span>
          <span>9 min read</span>
        </p>
        <p
          className="mt-[var(--spacing-md)]"
          style={{
            fontSize: "var(--text-medium)",
            color: "var(--color-text-muted)",
            fontStyle: "normal",
            maxWidth: "56ch",
            lineHeight: "1.45",
          }}
        >
          {subtitle}
        </p>

        {/* §0 — the scene */}
        <P>
          You open a Google Doc link a teammate sent you. In the top-right a tinted
          avatar appears — Jordan is in. A colored cursor labeled <Em>Jordan</Em>{" "}shows
          up inside the document. Jordan starts typing. The characters appear on your
          screen as they&apos;re typed — not on refresh, not after a click, not when
          you tab back in. They&apos;re just there.
        </P>
        <P>
          The moment is so mundane we forget that the web wasn&apos;t born able to do
          this. Rewind: <HL>what had to change about the web for Jordan&apos;s cursor
          to appear on your screen?</HL>
        </P>
      </div>

      {/* §1 — HTTP's only move */}
      <div>
        <Dots />
        <H2>HTTP&apos;s only move is request-and-reply</H2>
        <P>
          The web&apos;s original protocol has one shape: the browser asks, the server
          answers, the connection closes. That&apos;s it. A <Term>request</Term>{" "}
          leaves your machine, a <Term>response</Term>{" "}comes back, and whatever
          socket they travelled on is recycled or discarded. There is no protocol
          room for the server to say anything the browser didn&apos;t ask for.
        </P>
        <P>
          This isn&apos;t a style choice; it&apos;s baked in. HTTP/1.1{" "}
          <A href="https://www.rfc-editor.org/rfc/rfc9112#section-9.2">
            (RFC 9112 §9.2)
          </A>
          {" "}doesn&apos;t carry a request ID on the wire. Responses are matched to
          requests <Em>by arrival order</Em>. If the server ever spoke out of turn,
          the browser would have no way to know which request — if any — it was
          replying to.
        </P>
      </div>

      <FullBleed>
        <CodeBlock
          lang="http"
          filename="the shape everything else lives inside"
          code={`GET /doc/42 HTTP/1.1
Host: docs.example
Accept: text/html

HTTP/1.1 200 OK
Content-Type: text/html
Content-Length: 1432

<!doctype html>…`}
        />
      </FullBleed>

      <div>
        <P>
          The web&apos;s cell wall is that <HL>the client always speaks first</HL>. Everything
          that follows — every mechanism that makes Jordan&apos;s cursor appear on
          your screen — is a way to <Em>live inside that wall</Em>. None of them let
          the server initiate. They all turn the browser into something else: a
          listener, not an asker.
        </P>
      </div>

      {/* §2 — polling */}
      <div>
        <Dots />
        <H2>Just keep asking.</H2>
        <P>
          The most obvious answer is also the crudest. Fire a request every second
          and see if anything&apos;s new.
        </P>
      </div>

      <FullBleed>
        <CodeBlock
          lang="javascript"
          filename="polling.js"
          code={`setInterval(async () => {
  const res = await fetch('/doc/42/updates?since=' + lastSeen);
  const updates = await res.json();
  if (updates.length) applyUpdates(updates);
}, 1000);

// 60 requests / minute. Each carries ~500–2000 B of HTTP headers.
// At 1s intervals, that's ~120 KB / minute just to say: "anything new?"
// Most of the time the answer is: no.`}
        />
      </FullBleed>

      <div>
        <P>
          This <Term>polling</Term>{" "}loop honors HTTP&apos;s rule to the letter. It
          also pays for it. A full request-response round-trip isn&apos;t free:
          RFC 6202 notes that <Em>&ldquo;every long poll request and long poll
          response is a complete HTTP message and thus contains a full set of HTTP
          headers&rdquo;</Em> — the same is obviously true of short polling, where
          the headers show up 60 times a minute whether or not there&apos;s anything
          to say{" "}
          <A href="https://datatracker.ietf.org/doc/html/rfc6202#section-2.2">
            (RFC 6202 §2.2)
          </A>.
        </P>
        <P>
          Worse, your typing latency is bounded below by your polling interval.
          Jordan hits a key; you don&apos;t see it until your next tick. Make the
          interval shorter? You burn more bytes per minute. Make it longer? You watch
          letters arrive in clumps.
        </P>
        <Callout tone="note">
          Polling isn&apos;t dead. When updates are rare and tolerable latency is in
          seconds (build statuses, queue positions), it&apos;s genuinely the right
          shape. The trouble is what happens when you try to scale it to{" "}
          <Em>every cursor in every open document</Em>.
        </Callout>
      </div>

      {/* §3 — long polling + PipeCompare */}
      <div>
        <Dots />
        <H2>What if you asked once, and the server waited?</H2>
        <P>
          Here&apos;s the clever move. The client still asks — but the server
          doesn&apos;t reply until it has news. The request goes out, the TCP socket
          stays open, and the response sits there, a promise dangling on both
          sides of the wire. When something happens, the server writes the response
          and closes. The client reads it and immediately opens another.
        </P>
        <P>
          Ably calls this shape <A href="https://ably.com/topic/long-polling">&ldquo;bending HTTP slightly out of shape&rdquo;</A>.
          The format is preserved — still one ask, one answer — but a{" "}
          <Term>long-polling</Term>{" "}client fires and listens, sometimes for tens
          of seconds, before its single reply arrives.
        </P>
        <P>
          Alex Russell coined <Term>Comet</Term> — long polling as a family name —{" "}
          <A href="https://infrequently.org/2006/03/comet-low-latency-data-for-the-browser/">
            in March 2006
          </A>. <Em>Google Docs shipped on long polling for years</Em>: look inside
          Google&apos;s Closure Library and you&apos;ll still find{" "}
          <Code>goog.net.BrowserChannel</Code>, long polling over XHR with
          forever-iframe streaming as a fallback. Google never published it as an
          API, which is its own kind of tell — attribution comes from ex-Googlers
          and{" "}
          <A href="https://github.com/josephg/node-browserchannel">
            Joseph Gentle&apos;s node re-implementation
          </A>.
        </P>
      </div>

      <Polling />

      <div>
        <P>
          Polling burns most of its bytes saying nothing. The natural next
          move: don&apos;t hang up until there <Em>is</Em> news.
        </P>
      </div>

      <LongPoll />

      <div>
        <P>
          Long polling earns the latency back, but every reply still pays a
          full HTTP round-trip of overhead. The next move skips that.
        </P>
      </div>

      <WebSocketStream />

      <div>
        <P>
          Three frames cost 562 bytes; polling spent 7.5 KB <Em>asking</Em>.{" "}
          <HL>Refusing to finish the question</HL> is the move every later
          protocol inherits — long polling did it inside HTTP&apos;s rules,
          WebSocket did it by ending HTTP mid-socket.
        </P>
      </div>

      {/* §4 — WebSockets + UpgradeHandshake */}
      <div>
        <Dots />
        <H2>The line that ends HTTP mid-socket</H2>
        <P>
          WebSocket&apos;s move is to get HTTP to politely step aside. The client
          opens a regular HTTP request with three special headers that ask it to{" "}
          <Em>stop being HTTP</Em>. The server replies with a status code that
          was, until WebSocket came along, vanishingly rare —{" "}
          <Code>101 Switching Protocols</Code>{" "}— plus one header that proves it
          understood.
        </P>
      </div>

      <FullBleed>
        <div className="grid gap-[var(--spacing-md)] md:grid-cols-[1fr_1fr]">
          <CodeBlock
            lang="http"
            filename="client · opening request"
            code={`GET /chat HTTP/1.1
Host: docs.example
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13`}
          />
          <CodeBlock
            lang="http"
            filename="server · the 101 reply"
            code={`HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=`}
          />
        </div>
      </FullBleed>

      <div>
        <P>
          The proof header is a hash. The client sent a random key in the request;
          the server has to send one specific derivation of it back. The next widget
          runs that derivation <Em>in your browser</Em>{" "}against a fresh random key
          every time you press the button.
        </P>
      </div>

      <UpgradeHandshake />

      <div>
        <P>
          What you just watched was a SHA-1 over your random key with one very
          strange suffix glued on. That suffix is a literal string, written into
          the spec itself, identical for every server on earth:
        </P>
      </div>

      <FullBleed>
        <CodeBlock
          lang="text"
          filename="RFC 6455 §1.3 — the string, verbatim"
          code={`258EAFA5-E914-47DA-95CA-C5AB0DC85B11`}
        />
      </FullBleed>

      <div>
        <P>
          The whole algorithm fits on one line:
        </P>
      </div>

      <FullBleed>
        <CodeBlock
          lang="text"
          tone="output"
          code={`Sec-WebSocket-Accept = base64( sha1( Sec-WebSocket-Key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11" ) )`}
        />
      </FullBleed>

      <div>
        <P>
          The GUID is there so an unaware server can&apos;t accidentally reply{" "}
          <Em>&ldquo;yes, we&apos;re speaking WebSocket&rdquo;</Em>{" "}without having
          read the spec — the only way to produce the right accept header is to
          know exactly what string to glue on{" "}
          <A href="https://www.rfc-editor.org/rfc/rfc6455#section-1.3">
            (RFC 6455 §1.3)
          </A>. The widget runs the computation through your browser&apos;s Web
          Crypto API, so the <Code>Sec-WebSocket-Accept</Code>{" "}you see is the
          real SHA-1 your machine just computed. Nothing in the reveal is faked.
        </P>
        <P>
          After that reply is written and read, the same TCP socket is{" "}
          <Em>no longer speaking HTTP.</Em>{" "}It speaks WebSocket frames — 2 bytes
          of header for most messages, up to 14 at the far end. Either side can
          send, anytime, as long as both ends want the connection open. The client
          spoke first, exactly once, and then the conversation became something
          else.
        </P>
        <Callout tone="note">
          Frame opcodes are a four-bit field{" "}
          <A href="https://www.rfc-editor.org/rfc/rfc6455#section-5.2">
            (§5.2)
          </A>:{" "}<Code>0x1</Code> text, <Code>0x2</Code> binary,{" "}
          <Code>0x8</Code> close, <Code>0x9</Code> ping, <Code>0xA</Code> pong. The
          last two are load-bearing in production — NAT middleboxes silently drop
          idle TCP flows, so WebSocket servers send pings at a cadence shorter than
          the shortest NAT timeout on the path. Your socket looks healthy right up
          until the next write fails.
        </Callout>
      </div>

      {/* §5 — SSE + ReconnectGap */}
      <div>
        <Dots />
        <H2>One direction, with a safety net</H2>
        <P>
          WebSocket isn&apos;t the only way out. <Term>Server-Sent Events</Term>{" "}
          (SSE) are the one-way cousin: a regular HTTP response with{" "}
          <Code>Content-Type: text/event-stream</Code> that the server never closes.
          The browser hands each <Code>data: …\n\n</Code> chunk to{" "}
          <Code>onmessage</Code> as it arrives. An SSE handler can be eight lines
          of Node.
        </P>
      </div>

      <FullBleed>
        <CodeBlock
          lang="javascript"
          filename="server.js · the entire SSE handler"
          code={`app.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.flushHeaders();

  const send = (ev) => res.write(\`id: \${ev.id}\\ndata: \${JSON.stringify(ev)}\\n\\n\`);
  const off = bus.on('update', send);
  req.on('close', off);
});`}
        />
      </FullBleed>

      <div>
        <P>
          If WebSocket is &ldquo;HTTP steps aside,&rdquo; SSE is &ldquo;HTTP just
          never stops.&rdquo; No Upgrade, no magic GUID, no frame opcodes. Just one
          very patient HTTP response that keeps writing.
        </P>
        <P>
          Then why not use WebSocket for everything? Because SSE ships the one
          feature WebSocket doesn&apos;t:{" "}
          <Em>automatic reconnect, with state recovery.</Em> The browser
          remembers the last event&apos;s <Code>id:</Code>{" "}field, and when the
          stream drops, it reopens the connection with a{" "}
          <Code>Last-Event-ID</Code>{" "}header so the server can resume from that
          cursor{" "}
          <A href="https://html.spec.whatwg.org/multipage/server-sent-events.html#processing-model">
            (WHATWG HTML §9.2.3)
          </A>. WebSocket has none of this in the spec. The socket closes, you start
          over — from whatever <Code>ws://</Code>{" "}URL, with whatever auth, and
          whatever resume protocol you decided to build.
        </P>
      </div>

      <ReconnectGap />

      <div>
        <P>
          Drag the dropout in the widget. Both rows experience the same outage; only
          one of them quietly heals. This is why SSE is not a weaker WebSocket —
          it&apos;s a different trade. For one-way flows (notifications, logs,
          progress streams, a live leaderboard), SSE gives you resilience for free.
          For real two-way exchanges — say, sending Jordan&apos;s keystrokes back to
          Google&apos;s ack path — you need <Term>full-duplex</Term>, both ends
          talking at once instead of in turns. SSE can&apos;t give you that.
        </P>
      </div>

      {/* §6 — the catch */}
      <div>
        <Dots />
        <H2>The cost moved. It didn&apos;t vanish.</H2>
        <P>
          Three failure modes show up the moment you ship any of these to
          production. None are in the tutorials. The matrix below is one row per
          failure mode, one column per protocol — tap a row to read what each
          cell means. The pattern that falls out is the point of this section.
        </P>
      </div>

      <CostMatrix />

      <div>
        <P>
          Each row tells a different story. Proxies and corporate networks{" "}
          <A href="https://socket.io/docs/v4/how-it-works/">
            silently break the WebSocket Upgrade
          </A>
          , which is why Socket.IO still opens every connection on long polling
          first — the fallback isn&apos;t legacy; it&apos;s 2026 insurance. When
          a gateway blips, every long-poll and WebSocket client races back at
          the same instant: Discord&apos;s reconnect stampede{" "}
          <A href="https://discord.com/blog/how-discord-scaled-elixir-to-5-000-000-concurrent-users">
            took 17.5 seconds on a ring-lookup
          </A>{" "}
          until they cached, and Slack built{" "}
          <A href="https://slack.engineering/flannel-an-application-level-edge-cache-to-make-slack-scale/">
            Flannel
          </A>{" "}
          for the same shape. SSE alone has automatic resume on the protocol;
          the others need it written by hand. And on the third row, the hard
          part of real-time isn&apos;t holding the connection — it&apos;s the{" "}
          <Code>O(N)</Code>{" "}write on every event. Phoenix held two million
          idle sockets on one box; Discord&apos;s publish to a single
          30,000-member guild still took <strong>900 ms – 2.1 s</strong>{" "}
          before they parallelized fanout with Manifold.
        </P>

        <P>
          None of this kills the idea. It just means <HL>real-time is a system,
          not a primitive</HL>. The socket is the easy part.
        </P>
      </div>

      {/* §7 — back to the scene */}
      <div>
        <Dots />
        <H2>So when Jordan&apos;s cursor shows up on your screen…</H2>
        <P>
          …which of these is actually doing the work? Probably a WebSocket today.
          Was long polling, via BrowserChannel, for most of the last decade. Google
          doesn&apos;t publish which, and the honest answer is that most production
          systems have <Em>some layer of every mechanism in this post</Em>{" "}somewhere
          — polling for a heartbeat, long polling as a Socket.IO fallback, a
          WebSocket for the hot path, SSE for the log tail, a cache in front of it
          all so a reconnect storm doesn&apos;t take the site down.
        </P>
        <P>
          What they share is the move at the center of every one of them. The
          server never learned to speak first. <HL>The browser just stopped hanging up.</HL>
          A request goes out; it doesn&apos;t come back until it has something to
          say; it opens another the moment it does; or the socket simply never
          closes.
        </P>
        <p
          style={{
            fontSize: "1.125em",
            marginBlockStart: "1.5em",
            marginBlockEnd: "0.2em",
            lineHeight: 1.55,
          }}
        >
          <Em>
            Every &ldquo;real-time&rdquo; web app on your laptop right now is
            variations on a browser that refuses to finish its sentence.
          </Em>
        </p>
        <p
          className="font-sans"
          style={{
            fontSize: "var(--text-small)",
            color: "var(--color-text-muted)",
            marginBlockStart: "0.5em",
          }}
        >
          The title lied slightly: the browser didn&apos;t stop asking. It stopped
          ending the question.
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
      <PostNavCards slug="the-browser-stopped-asking" />
    </Prose>
  );
}
