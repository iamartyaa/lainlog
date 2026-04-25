import {
  Prose,
  H1,
  H2,
  P,
  Code,
  Callout,
  Dots,
  Em,
  Aside,
  A,
  FullBleed,
  HeroTile,
  Term,
} from "@/components/prose";
import { CodeBlock } from "@/components/code";
import { TextHighlighter, VerticalCutReveal } from "@/components/fancy";
import { OriginMatrix, RequestJourney, RequestClassifier } from "./widgets";
import { metadata, subtitle } from "./metadata";

export { metadata };

const HL_TRANSITION = { type: "spring" as const, duration: 0.9, bounce: 0 };
const HL_COLOR =
  "color-mix(in oklab, var(--color-accent) 28%, transparent)";
const HL_OPTS = { once: true, initial: false, amount: 0.55 } as const;

/** Highlight a load-bearing phrase. inView, spring, ltr swipe. */
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

export default function WhyFetchFailsOnlyInBrowser() {
  return (
    <Prose>
      <div className="pt-[var(--spacing-xl)]">
        <div className="mb-[var(--spacing-md)] hidden md:flex">
          <HeroTile slug="why-fetch-fails-only-in-browser" />
        </div>
        <H1>The server already said yes. The browser threw the answer away.</H1>
        <p
          className="mt-[var(--spacing-sm)] font-mono tabular-nums"
          style={{
            fontSize: "var(--text-small)",
            color: "var(--color-text-muted)",
          }}
        >
          <time dateTime="2026-04-19">apr 19, 2026</time>
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

        {/* §1 — the paradox */}
        <P>
          You call an API from the browser. The Network tab shows <Code>200 OK</Code>.
          The Console right below shows <Code>TypeError: Failed to fetch</Code>. You
          paste the same URL into a terminal, run <Code>curl</Code>, and get JSON back.{" "}
          <HL>Same URL, same server, same five-second window. One works. The other doesn&apos;t.</HL>
        </P>
      </div>

      <FullBleed>
        <div className="grid gap-[var(--spacing-md)] lg:grid-cols-[1fr_1fr]">
          <CodeBlock
            lang="bash"
            filename="terminal"
            code={`$ curl https://api.other.com/me
{"ok": true, "name": "you"}
# 200 OK — server answered.`}
          />
          <CodeBlock
            lang="javascript"
            filename="browser · devtools"
            code={`await fetch('https://api.other.com/me')
// Uncaught (in promise) TypeError:
//   Failed to fetch
// Access-Control-Allow-Origin missing.`}
          />
        </div>
      </FullBleed>

      <div>
        <P>
          Your browser rejected it. And it waited until the response was already
          in its hands before doing so.
        </P>
      </div>

      {/* §2 — same origin */}
      <div>
        <Dots />
        <H2>Same origin is three things, not one.</H2>
        <P>
          An <Term>origin</Term>{" "}is the triple{" "}
          <Code>(scheme, host, port)</Code>. Two URLs are the same origin only if
          all three match.
        </P>
      </div>

      <OriginMatrix />

      <div>
        <P>
          That triple is what the browser checks before it lets one page read
          another&apos;s response. CORS is the opt-in mechanism for relaxing
          that rule, narrowly.
        </P>
        <Aside>
          Your dev setup on <Code>localhost:3000</Code> and your API on{" "}
          <Code>localhost:4000</Code> are cross-origin. CORS is a localhost
          problem before it&apos;s a production one.
        </Aside>
      </div>

      {/* §3 — THE reveal */}
      <div>
        <Dots variant="centre-accent" />
        <H2>The browser is the enforcer, not the server.</H2>
        <P>
          Step through the widget below, then flip the server&apos;s allow-list
          toggle and step through it again. The network trace doesn&apos;t change.
          The only thing that changes is what JS gets back at the end.
        </P>
      </div>

      <RequestJourney />

      <div>
        <Dots />

        <p
          className="font-serif"
          style={{
            fontSize: "var(--text-body)",
            lineHeight: 1.55,
            marginBlock: "var(--spacing-lg)",
          }}
        >
          <VerticalCutReveal
            className="font-serif"
            transition={{ type: "spring", duration: 0.9, bounce: 0 }}
            useInViewOptions={{ once: true, initial: false, amount: 0.6 }}
            staggerDuration={0.035}
          >
            {"CORS does not block the request. It blocks the response."}
          </VerticalCutReveal>
        </p>

        <Aside>
          Phrasing: Ilija Eftimov,{" "}
          <A href="https://ieftimov.com/posts/deep-dive-cors-history-how-it-works-best-practices/">
            Deep dive on CORS
          </A>
          .
        </Aside>

        <P>
          That&apos;s why <Code>curl</Code> &ldquo;works.&rdquo; curl doesn&apos;t
          parse <Code>Access-Control-*</Code> headers. Neither does Postman, or
          Python&apos;s <Code>requests</Code>, or your backend calling your other
          backend.{" "}
          <HL>Outside the browser, there&apos;s no one listening.</HL>
        </P>

        <P>
          <HL>CORS isn&apos;t about your server. It&apos;s about the user&apos;s cookies.</HL>{" "}
          A page at <Code>evil.com</Code>, open in your user&apos;s tab, could
          otherwise use the cookies already in that browser to read a response
          from <Code>bank.com</Code>. The browser has the user&apos;s authority;
          CORS is what keeps one page from borrowing it to read another
          page&apos;s data.
        </P>
      </div>

      {/* §4 — preflight */}
      <div>
        <Dots />
        <H2>Some requests never leave the browser.</H2>
        <P>
          Some requests get this treatment. Others trigger a second request
          first — an <Code>OPTIONS</Code>, asking permission, before the real
          one is allowed to leave. The widget classifies which is which.
        </P>
      </div>

      <RequestClassifier />

      <div>
        <P>
          The <Em>preflight</Em>{" "}asks the server, in advance, whether the real
          request is allowed: its method, its custom headers. If the answer
          doesn&apos;t match, the real <Code>POST</Code> or <Code>DELETE</Code>{" "}
          never leaves the browser.{" "}
          <HL>This is the one case where CORS blocks the wire, not just the read.</HL>{" "}
          Browsers cache the <Code>OPTIONS</Code> result briefly via{" "}
          <Code>Access-Control-Max-Age</Code> so the handshake doesn&apos;t
          repeat on every call.
        </P>
        <Callout tone="warn">
          If your server reflects the request&apos;s <Code>Origin</Code> header
          back in <Code>Access-Control-Allow-Origin</Code> to support many
          origins, you must also send <Code>Vary: Origin</Code>. Without it, a
          CDN or shared proxy can serve origin A&apos;s allowed response to origin
          B&apos;s request. Looks fine in dev; breaks the first time a CDN
          promotes the wrong cached response.
        </Callout>
      </div>

      {/* §6 — closer */}
      <div>
        <Dots />
        <H2>Every CORS failure is one of three things.</H2>
        <Callout tone="note">
          Three things to check, in order. Which origin is your page? Is the
          server returning <Code>Access-Control-Allow-Origin</Code> matching
          that origin <Em>exactly</Em>? And if there&apos;s an{" "}
          <Code>OPTIONS</Code> row before your real request, does{" "}
          <Em>that</Em>{" "}response approve the method and headers you&apos;re
          about to send? Almost every CORS failure is one of those three, in that
          order.
        </Callout>
        <P>
          The browser isn&apos;t being rude. It&apos;s doing the thing that keeps
          every other tab from reading what you&apos;re logged into.{" "}
          <HL>The <Code>TypeError</Code> is that protection, showing up for you too.</HL>
        </P>
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
    </Prose>
  );
}
