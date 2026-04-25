import {
  Prose,
  H1,
  H2,
  P,
  Code,
  Em,
  A,
  Aside,
  Dots,
  HeroTile,
} from "@/components/prose";
import { PostBackLink } from "@/components/nav/PostBackLink";
import { PostNavCards } from "@/components/nav/PostNavCards";
import { TextHighlighter, VerticalCutReveal } from "@/components/fancy";
import {
  RuntimeSimulator,
  PredictTheOutput,
  AwaitDesugar,
  MicrotaskStarvation,
} from "./widgets";
import { metadata, subtitle } from "./metadata";

export { metadata };

const HL_TRANSITION = { type: "spring" as const, duration: 0.9, bounce: 0 };
const HL_COLOR = "color-mix(in oklab, var(--color-accent) 28%, transparent)";
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

export default function TheLineThatWaitsItsTurn() {
  return (
    <Prose>
      <div className="pt-[var(--spacing-xl)]">
        <PostBackLink />
        <div className="mt-[var(--spacing-md)] mb-[var(--spacing-md)] hidden md:flex flex-col items-start gap-[var(--spacing-md)] lg:flex-row lg:items-end">
          <HeroTile slug="the-line-that-waits-its-turn" />
        </div>
        <H1>How the JavaScript event loop, microtasks, and the call stack work</H1>
        <p
          className="mt-[var(--spacing-sm)] font-mono tabular-nums"
          style={{
            fontSize: "var(--text-small)",
            color: "var(--color-text-muted)",
          }}
        >
          <time dateTime="2026-04-25">apr 25, 2026</time>
          <span className="mx-2">·</span>
          <span>15 min read</span>
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

        {/* §0 — scene */}
        <P>
          You write <Code>setTimeout(log, 0)</Code> on one line and{" "}
          <Code>Promise.resolve().then(log)</Code> right under it. You hit run.
          The Promise prints first. <em>Zero</em> milliseconds was supposed to
          mean now — and somehow the line you wrote afterward got there sooner.
          You&apos;ve hit two queues you didn&apos;t know existed:{" "}
          <HL>the line that waits its turn, and the line that doesn&apos;t.</HL>
        </P>
      </div>

      {/* §1 — the stack as gatekeeper */}
      <div>
        <Dots />
        <H2>The stack is the gatekeeper</H2>
        <P>
          Every line of running JavaScript lives inside a <em>frame</em> on the
          call stack — one slot per function call, popped when the call returns.
          The runtime around it (queues, timers, the event loop) is bigger than
          the stack and slower than it; none of that machinery can interrupt a
          frame mid-line.{" "}
          <HL>The loop only reaches into its queues when the stack is empty.</HL>{" "}
          That&apos;s the whole trigger. Not a 16-millisecond tick, not a
          priority interrupt — just an empty stack.
        </P>
        <P>
          If the stack itself feels new — what a frame is, what hoisting does to
          it, how function calls push and pop — start with the sister post:{" "}
          <A href="/posts/how-javascript-reads-its-own-future">
            How JavaScript reads its own future
          </A>
          . The two posts work together. This one picks up where that one ends:
          the moment the stack runs out of frames and the loop gets its turn.
        </P>
      </div>

      {/* §2 — Web APIs and the runtime simulator */}
      <div>
        <Dots />
        <H2>Web APIs are not the JavaScript engine</H2>
        <P>
          When you call <Code>setTimeout</Code>, almost nothing about it is
          JavaScript. The browser hands the timer to a separate, native bit of
          itself — the same place that handles <Code>fetch</Code>, click events,
          IndexedDB, network reads. These are{" "}
          <em>Web APIs</em>: machinery that lives <em>outside</em> the
          single-threaded engine, runs in parallel, and only pushes a callback
          back when the work it was given finishes (
          <A href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop">
            MDN event loop
          </A>
          ). Same shape in Node — only the implementation underneath is libuv
          instead of the browser&apos;s native event system (
          <A href="https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick">
            Node docs
          </A>
          ).
        </P>
        <P>
          So the engine is single-threaded, but the runtime around it is
          doing work in parallel. Your <Code>setTimeout(B, 0)</Code> isn&apos;t
          waiting in line yet when you call it. It&apos;s parked in the Web API
          row. The line forms only when the timer fires and the callback gets
          handed back. The widget below walks ten ticks of a small program and
          shows where every piece sits.
        </P>
      </div>

      <RuntimeSimulator />

      <div>
        <P>
          By tick 7 the stack is empty, both queues hold one item, and the loop
          reaches in. It pulls from the microtask queue first. Even though{" "}
          <Code>timerB</Code> was scheduled before <Code>thenC</Code>,{" "}
          <Code>C</Code> prints before <Code>B</Code>. The microtask{" "}
          <Em>jumped the line</Em> — and the rule that let it isn&apos;t a
          quirk; it&apos;s the entire model.
        </P>
      </div>

      {/* §3 — two queues, microtasks first */}
      <div>
        <Dots />
        <H2>Two queues, and one of them always wins</H2>
        <P>
          Two queues, not one. The <em>task queue</em> (sometimes called the
          macrotask queue) holds work scheduled by{" "}
          <Code>setTimeout</Code>, <Code>setInterval</Code>, click handlers,
          network callbacks, and the like. The <em>microtask queue</em> holds
          Promise reactions —{" "}
          <Code>.then</Code>, <Code>.catch</Code>, <Code>.finally</Code> — plus{" "}
          <Code>queueMicrotask()</Code> and <Code>MutationObserver</Code>{" "}
          callbacks. Different sources, different queues, different priority (
          <A href="https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model">
            HTML §8.1.7
          </A>
          ).
        </P>
        <P>
          The priority isn&apos;t subtle. After every task — including the
          initial &ldquo;run the script&rdquo; task — the loop performs a{" "}
          <em>microtask checkpoint</em>: drain the microtask queue until it&apos;s
          empty, including any new microtasks added <em>during</em> the drain.
          Only after that does the loop run one task and check for a render.
          Three variants below pin three edges of the rule.
        </P>
      </div>

      <PredictTheOutput />

      <div>
        <P>
          Variant β is the one that catches most readers: a microtask that
          schedules another microtask still runs before the next task, because
          the queue drains <em>completely</em>, not snapshot-at-a-time. Variant
          γ pins the other half: the order you wrote the lines doesn&apos;t
          decide queue order. Source order schedules; the queues decide what
          runs.
        </P>
        <P>
          The single rule, stated plainly:{" "}
          <HL>
            the runtime drains the microtask queue completely between every
            other thing it does
          </HL>
          . Every other thing — every macrotask, every render, every idle
          callback — sits behind that drain. Once you carry that sentence, the
          rest of the post is corollaries.
        </P>
        <Aside>
          This wasn&apos;t always tidy. Through 2016–2017 the major browsers
          implemented the queue ordering with quiet inconsistencies — Edge and
          Safari resolved Promises in places where Chrome ran microtasks, and a
          handful of MutationObserver edge cases drifted off-spec. Convergence
          landed alongside the HTML-spec processing-model rewrite. Jake
          Archibald&apos;s 2018 talk{" "}
          <A href="https://www.youtube.com/watch?v=cCOL7MC4Pl0">
            &ldquo;In The Loop&rdquo;
          </A>{" "}
          is the canonical record of where each engine had landed by then.
          Modern browsers all converge on the spec.
        </Aside>
      </div>

      {/* §4 — await is a microtask checkpoint */}
      <div>
        <Dots />
        <H2><Code>await</Code> is a microtask in disguise</H2>
        <P>
          The rule&apos;s biggest payoff is the one most people use without
          noticing. <Code>await</Code> is sugar. The line after it doesn&apos;t
          run synchronously — even when the value being awaited is already
          resolved. It runs as a microtask, on the very next checkpoint (
          <A href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await">
            MDN <Code>await</Code>
          </A>
          ).
        </P>
        <P>
          Concretely: <Code>async function f() &#123; ...; await x; rest(); &#125;</Code>{" "}
          desugars to roughly{" "}
          <Code>function f() &#123; ...; return Promise.resolve(x).then(() =&gt; rest()); &#125;</Code>
          . The body splits at the <Code>await</Code> and the second half
          becomes a <Code>.then</Code> callback. The widget shows both forms
          stepping in lock-step.
        </P>
      </div>

      <AwaitDesugar />

      <div>
        <P>
          Step 2 is where the equivalence lands. Both panes annotate{" "}
          <em>microtask queue</em> at the same tick because, underneath the
          syntax, the engine is doing the same thing. Read the right-hand pane
          first if you came up writing <Code>.then</Code> chains; read the
          left-hand pane first if you came up writing <Code>async/await</Code>.
          The one rule from §3 covers both.
        </P>
        <Aside>
          For most of the post-ES2017 era the desugaring was{" "}
          <em>also</em> what the engine literally did, just slower. V8&apos;s
          original implementation of <Code>await</Code> wrapped the value in a
          fresh Promise, attached a <Code>.then</Code>, and walked the result
          through three microtasks before resuming the caller — even when the
          value was already a Promise. In late 2018 V8 swapped the wrapping for{" "}
          <Code>promiseResolve</Code>, which leaves Promises alone and only
          wraps non-Promise values, dropping a resolved <Code>await</Code> from
          three microtask ticks to one (
          <A href="https://v8.dev/blog/fast-async">
            V8 blog: faster async functions and promises
          </A>
          ). It&apos;s why upgrading from Node 8 to Node 12 made some of your
          benchmarks faster without you changing a line of code.
        </Aside>
      </div>

      {/* §5 — when the rule cuts both ways */}
      <div>
        <Dots />
        <H2>The rule cuts both ways</H2>
        <P>
          The same rule that makes <Code>await</Code> seamless can stall the
          tab. Rendering — repaints, scroll, the next animation frame — sits
          downstream of the microtask checkpoint. The loop won&apos;t even{" "}
          <em>look</em> at a render opportunity until the microtask queue is
          empty. And because the queue drains <em>completely</em>, including
          newly-added microtasks, a chain that schedules itself can hold the
          checkpoint open indefinitely (
          <A href="https://web.dev/articles/optimize-long-tasks">
            web.dev: optimize long tasks
          </A>
          ).
        </P>
        <P>
          The widget below runs a bounded version of exactly that: 50,000
          iterations of <Code>Promise.resolve().then(loop)</Code> versus the
          same work split across <Code>setTimeout(0)</Code> batches. The cap
          exists so the page can&apos;t actually freeze on you — but the shape
          of the freeze is real.
        </P>
      </div>

      <MicrotaskStarvation />

      <div>
        <P>
          In starve mode the counter jumps from <Code>0</Code> straight to its
          final value in a single paint, and the pulse-dot freezes for the
          duration of the run. In yield mode the counter ticks visibly and the
          dot keeps pulsing, because each <Code>setTimeout(0)</Code> hands the
          loop back — opening a window for the renderer between batches. Same
          work, different scheduler.
        </P>
        <Aside>
          Node has a different inventory but the same hazard. Its event loop
          runs in six phases — timers, pending callbacks, idle/prepare, poll,
          check, close — with{" "}
          <Code>process.nextTick</Code> and microtask drains <em>between</em>{" "}
          phases (
          <A href="https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick">
            Node docs
          </A>
          ). <Code>process.nextTick</Code> outranks Promise microtasks; both
          outrank anything in the next phase. The Node maintainers flag
          recursive <Code>nextTick</Code> calls as a starvation hazard for the
          same reason: a queue that drains to empty before yielding will hold
          the loop forever if you keep refilling it.{" "}
          <Code>setImmediate</Code> is what you reach for when you need to{" "}
          <em>not</em> jump the line — it runs in the check phase, after I/O.
          Browsers don&apos;t ship <Code>setImmediate</Code> or{" "}
          <Code>process.nextTick</Code>; the equivalents are{" "}
          <Code>queueMicrotask</Code> and <Code>setTimeout(fn, 0)</Code>.
        </Aside>
      </div>

      {/* §6 — closer */}
      <div>
        <Dots />
        <H2>The line that waits its turn</H2>
        <P>
          The line that waits its turn is the task queue. The line that{" "}
          <em>doesn&apos;t</em> is the microtask queue — it gets drained
          completely, every checkpoint, before anything else moves. One rule
          explains why <Code>await</Code> works, why <Code>setTimeout(0)</Code>{" "}
          is never zero, and{" "}
          <VerticalCutReveal
            staggerDuration={0.04}
            staggerFrom="first"
            transition={{ type: "spring" as const, stiffness: 200, damping: 22 }}
            as="span"
            className="inline"
          >
            why one runaway Promise can stall your whole tab.
          </VerticalCutReveal>
        </P>
        <p
          className="font-sans"
          style={{
            fontSize: "var(--text-small)",
            color: "var(--color-text-muted)",
            marginBlockStart: "0.5em",
          }}
        >
          For the call stack itself — frames, hoisting, the scopes a function
          carries with it — read the sister post:{" "}
          <A href="/posts/how-javascript-reads-its-own-future">
            How JavaScript reads its own future
          </A>
          .
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
      <PostNavCards slug="the-line-that-waits-its-turn" />
    </Prose>
  );
}
