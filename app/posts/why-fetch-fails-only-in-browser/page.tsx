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
  Term,
} from "@/components/prose";
import { CodeBlock } from "@/components/code";
import { OriginMatrix, RequestJourney, RequestClassifier } from "./widgets";
import { metadata } from "./metadata";

export { metadata };

export default function WhyFetchFailsOnlyInBrowser() {
  return (
    <Prose>
      <div className="pt-[var(--spacing-xl)]">
        <H1 style={{ fontSize: "clamp(2.5rem, 2rem + 3.5vw, 4rem)" }}>
          Why <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500, letterSpacing: "-0.01em" }}>fetch</span> works in curl but the browser blocks it
        </H1>
        <p
          className="mt-[var(--spacing-sm)] font-mono tabular-nums"
          style={{
            fontSize: "var(--text-small)",
            color: "var(--color-text-muted)",
          }}
        >
          <time dateTime="2026-04-19">apr 19, 2026</time>
          <span className="mx-2">·</span>
          <span>7 min read</span>
        </p>

        {/* §1 — the paradox */}
        <P>
          You call an API from the browser. The Network tab shows <Code>200 OK</Code>.
          The Console right below shows <Code>TypeError: Failed to fetch</Code>. You
          paste the same URL into a terminal, run <Code>curl</Code>, and get JSON back.
          Same URL, same server, same five-second window. One works. The other doesn&apos;t.
        </P>
      </div>

      <FullBleed>
        <div className="grid gap-[var(--spacing-md)] md:grid-cols-[1fr_1.3fr]">
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
          Almost every explanation of CORS gets the shape of this wrong. The server
          didn&apos;t reject anything. Your browser did. And it waited until the
          response was already in its hands before doing it.
        </P>
      </div>

      {/* §2 — same origin */}
      <div>
        <Dots />
        <H2>What &ldquo;same origin&rdquo; actually means</H2>
        <P>
          Before the mechanism makes sense, the vocabulary has to. An <Term>origin</Term>{" "}
          is the triple <Code>(scheme, host, port)</Code>. Two URLs are the{" "}
          <Em>same origin</Em> only if all three match. Path doesn&apos;t count.
          Subdomains don&apos;t match. And yes, <Code>http</Code> vs <Code>https</Code>{" "}
          on the exact same hostname is cross-origin — TLS changes the trust boundary.
          Hover any row below to see which part differs.
        </P>
      </div>

      <OriginMatrix />

      <div>
        <P>
          The <Em>same-origin policy</Em> is the browser&apos;s default. JS running in
          one origin can&apos;t read a response from another. Loading assets across
          origins — an <Code>&lt;img&gt;</Code>, a <Code>&lt;script&gt;</Code>, a
          stylesheet — has always been allowed, which is why the restriction feels
          arbitrary until you notice what <Em>is</Em> forbidden: reading a response
          from JS. CORS is the opt-in mechanism for punching holes in that wall.
        </P>
        <Callout tone="note">
          Subdomains are cross-origin. <Code>api.example.com</Code> and{" "}
          <Code>app.example.com</Code> are as foreign to each other as{" "}
          <Code>example.com</Code> and <Code>evil.com</Code> under the same-origin
          rule.
        </Callout>
      </div>

      {/* §3 — THE reveal */}
      <div>
        <Dots />
        <H2>The browser is the enforcer, not the server</H2>
        <P>
          Here&apos;s the shape most posts miss. Step through the widget below,
          then flip the <Code>Access-Control-Allow-Origin</Code> pill and step through
          it again. The network trace doesn&apos;t change. The only thing that
          changes is what JS gets back at the end.
        </P>
      </div>

      <RequestJourney />

      <div>
        <P>
          Walk that back slowly. The fetch left the browser. The request reached
          the server. The server ran its handler — the same code it runs for any
          other client. It returned <Code>200 OK</Code> with a real body. The
          response arrived in the browser. Only then, <Em>after</Em> the whole
          round trip, did the browser look at the response headers, fail to find
          an invitation for your page&apos;s origin, and throw the body away.
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
            CORS does not block the request. It blocks the response.
          </Em>
        </p>
        <Aside>
          That phrasing is Ilija Eftimov&apos;s, from his{" "}
          <A href="https://ieftimov.com/posts/deep-dive-cors-history-how-it-works-best-practices/">
            deep dive on CORS
          </A>
          . It&apos;s the one sentence that collapses the whole mechanism into a
          usable mental model.
        </Aside>
        <P>
          That&apos;s why <Code>curl</Code> &ldquo;works.&rdquo; curl doesn&apos;t
          parse <Code>Access-Control-*</Code> headers. Neither does Postman, or
          Python&apos;s <Code>requests</Code>, or your backend calling your other
          backend. CORS is a contract between a server&apos;s response headers and
          a <Em>browser&apos;s</Em> JS sandbox. Outside the browser, there&apos;s no
          one listening.
        </P>
        <P>
          And the point of the contract isn&apos;t to stop people from reaching
          your server. It&apos;s to stop a page at <Code>evil.com</Code>, open in
          your user&apos;s tab, from using the cookies already in that browser to
          read a response from <Code>bank.com</Code>. The browser has the user&apos;s
          authority; CORS is what keeps one page from borrowing it to read another
          page&apos;s data.
        </P>
      </div>

      {/* §4 — preflight */}
      <div>
        <Dots />
        <H2>Not every request even leaves the browser</H2>
        <P>
          The &ldquo;server runs, browser redacts&rdquo; rule holds for <Em>simple</Em>{" "}
          requests — roughly, what an HTML form could have sent without JS: a{" "}
          <Code>GET</Code>, or a plain <Code>POST</Code> with one of three
          old content types (<Code>text/plain</Code>,{" "}
          <Code>application/x-www-form-urlencoded</Code>, or{" "}
          <Code>multipart/form-data</Code>) and no custom headers. For anything
          else, the browser sends a second, silent request first — an{" "}
          <Code>OPTIONS</Code>, asking permission. If permission is denied, the
          real request is never sent.
        </P>
        <P>
          Flip the controls below and watch the verdict change.
        </P>
      </div>

      <RequestClassifier />

      <div>
        <P>
          The <Em>preflight</Em> carries <Code>Origin</Code>, the method the real
          request will use, and any non-safelisted headers it plans to send. The
          server answers with a matching <Code>Access-Control-Allow-Methods</Code>{" "}
          and <Code>Access-Control-Allow-Headers</Code>, and <Em>only then</Em> does
          the browser let the real request go. If any of those don&apos;t line up,
          the real <Code>POST</Code>, <Code>DELETE</Code>, or <Code>PATCH</Code>{" "}
          never reaches your backend. This is the one case where CORS genuinely
          blocks the wire, not just the read.
        </P>
        <P>
          The practical consequence is blunt: switching a request from{" "}
          <Code>text/plain</Code> to <Code>application/json</Code>, or adding an{" "}
          <Code>Authorization</Code> header, doesn&apos;t just change whether JS can
          read the reply — it changes whether the <Code>POST</Code> arrives at all.
          Every modern JSON API preflights every call. Browsers cache the{" "}
          <Code>OPTIONS</Code> result briefly (seconds to a couple of hours) via{" "}
          <Code>Access-Control-Max-Age</Code> so the handshake doesn&apos;t repeat for
          every request.
        </P>
        <Aside>
          If your server reflects the request&apos;s <Code>Origin</Code> header back
          in <Code>Access-Control-Allow-Origin</Code> to support many origins, you
          must also send <Code>Vary: Origin</Code>. Without it, a CDN or shared
          proxy can serve origin A&apos;s allowed response to origin B&apos;s
          request. It looks fine in dev and breaks on Tuesday.
        </Aside>
      </div>

      {/* §5 — credentials */}
      <div>
        <Dots />
        <H2>Cookies don&apos;t tag along by default</H2>
        <P>
          <Code>fetch</Code> to a cross-origin URL does <Em>not</Em> send cookies or
          HTTP auth unless you ask. You opt in; the server opts in separately. Both
          sides have to agree.
        </P>
      </div>

      <FullBleed>
        <CodeBlock
          lang="javascript"
          filename="client"
          code={`// client opt-in
await fetch('https://api.other.com/me', {
  credentials: 'include',
});

// server must respond with, exactly:
//   Access-Control-Allow-Origin: https://app.example.com
//   Access-Control-Allow-Credentials: true
//
// not '*' — wildcard + credentials is an error.`}
        />
      </FullBleed>

      <div>
        <P>
          Notice what&apos;s missing: the wildcard. <Code>
            Access-Control-Allow-Origin: *
          </Code>{" "}
          is illegal once credentials are in play, and the browser will reject the
          response even if the server sends it. The origin has to be{" "}
          <Em>named</Em> — which is the whole point. A wildcard would mean
          &ldquo;any site can read this response using this user&apos;s cookies,&rdquo;
          which is the thing CORS exists to prevent.
        </P>
      </div>

      {/* §6 — closer */}
      <div>
        <Dots />
        <H2>Reading a failing network tab</H2>
        <P>
          Next time a red <Code>TypeError</Code> shows up in the console, the
          Network tab is the first place to look. Did the request reach the
          server? Usually yes — you&apos;ll see a <Code>200</Code>, or at least
          some response. That alone tells you the server isn&apos;t refusing; the
          response headers are.
        </P>
        <P>
          Three things to check, in order. Which origin is your page? Is the
          server returning <Code>Access-Control-Allow-Origin</Code> matching that
          origin exactly? And if there&apos;s an <Code>OPTIONS</Code> row before
          your real request, does <Em>that</Em> response approve the method and
          headers you&apos;re about to send? Almost every CORS failure is one of
          those three, in that order.
        </P>
        <P>
          The browser isn&apos;t being rude. It&apos;s doing the thing that keeps
          every other site you&apos;re logged into — your bank, your email, your
          account settings — from being read by whatever tab you just opened.
          The <Code>TypeError</Code> is that protection, showing up for you too.
        </P>
      </div>
    </Prose>
  );
}
