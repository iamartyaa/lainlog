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
import { TextHighlighter } from "@/components/fancy";
import { CodeBlock } from "@/components/code/CodeBlock";
import {
  RuntimeSimulator,
  PredictTheStart,
  PredictTheOutput,
  AwaitDesugar,
  MicrotaskStarvation,
} from "./widgets";
import {
  PREDICT_THE_START_SNIPPET,
  PREDICT_THE_OUTPUT_VARIANT_CODE,
} from "./widgets/snippets";
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
        <H1>JavaScript Event Loop Explained: Microtasks and the Call Stack</H1>
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

        {/* §0 — the quiz hook */}
        <P>
          Before we explain anything, try the snippet below. Read it once, then
          guess the order it prints. Most readers get this wrong on the first
          try — and{" "}
          <HL>the gap between your guess and the truth is exactly what this post fills</HL>.
        </P>
      </div>

      <PredictTheStart
        codeSlot={
          <CodeBlock
            lang="javascript"
            filename="predict the output"
            code={PREDICT_THE_START_SNIPPET}
          />
        }
      />

      <div>
        <P>
          The runtime didn&apos;t reorder anything at random. Every letter
          landed where it did because of one rule about how JavaScript drains
          its queues — a rule that explains <Code>setTimeout(0)</Code>, makes{" "}
          <Code>await</Code> seamless, and is the reason a single Promise can
          freeze a tab. The rest of the post traces that snippet, line by line,
          until the order isn&apos;t a guess anymore.
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
          That&apos;s why <Code>A</Code>, <Code>F</Code>, and <Code>H</Code>{" "}
          print before anything else in the snippet above. They&apos;re all{" "}
          <em>synchronous</em> calls that ran inside <Code>main</Code>; the
          stack stayed busy until <Code>console.log(&quot;H&quot;)</Code>{" "}
          returned. Only then does the rest of the runtime get a turn.
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
        <H2>The engine is single-threaded; the runtime is not</H2>
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
          <Em>jumped the line</Em> —{" "}
          <HL>the rule that let it isn&apos;t a quirk; it&apos;s the entire model</HL>.
        </P>
      </div>

      {/* §3 — two queues, microtasks first */}
      <div>
        <Dots />
        <H2>One of the two queues always wins</H2>
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
          That&apos;s why the snippet&apos;s <Code>B</Code> — a 0 ms{" "}
          <Code>setTimeout</Code> — comes <em>last</em>, even though it was
          scheduled second. The task queue can&apos;t advance until the
          microtask queue has been drained completely; <Code>C</Code>,{" "}
          <Code>E</Code>, <Code>G</Code>, and <Code>D</Code> all clear before{" "}
          <Code>B</Code> gets its turn.
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

      <PredictTheOutput
        codeSlots={{
          alpha: (
            <CodeBlock
              lang="javascript"
              filename="α · baseline"
              code={PREDICT_THE_OUTPUT_VARIANT_CODE.alpha}
            />
          ),
          beta: (
            <CodeBlock
              lang="javascript"
              filename="β · microtasks spawn microtasks"
              code={PREDICT_THE_OUTPUT_VARIANT_CODE.beta}
            />
          ),
          gamma: (
            <CodeBlock
              lang="javascript"
              filename="γ · task scheduled first"
              code={PREDICT_THE_OUTPUT_VARIANT_CODE.gamma}
            />
          ),
        }}
      />

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
            between every task, every render, every idle frame — the
            microtask queue drains to empty first
          </HL>
          . Once you carry that sentence, the rest of the post is corollaries.
        </P>
        <Aside>
          This wasn&apos;t always uniform. Through 2016–2017 the major browsers
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
          syntax, <HL>the engine is doing the same thing</HL>. Read the
          right-hand pane first if you came up writing <Code>.then</Code>{" "}
          chains; read the left-hand pane first if you came up writing{" "}
          <Code>async/await</Code>. The one rule from §3 covers both.
        </P>
        <P>
          And it&apos;s exactly why the snippet&apos;s <Code>G</Code> doesn&apos;t
          land where you&apos;d expect. The <Code>await null</Code> splits the
          async IIFE: <Code>F</Code> runs synchronously, then the line after the{" "}
          <Code>await</Code> gets parked as a microtask. <Code>G</Code> can&apos;t
          fire until the microtask queue reaches it — which is why it lands
          after <Code>C</Code> and <Code>E</Code>, not next to <Code>F</Code>.
        </P>
        <P>
          The trickiest letter in the snippet is <Code>D</Code>. The first{" "}
          <Code>.then</Code> callback returns <Code>Promise.resolve(&quot;D&quot;)</Code>;
          adopting that returned promise costs <em>two</em> extra microtask
          hops before the chained <Code>.then((d) =&gt; log(d))</Code> finally
          fires. By the time those hops complete, <Code>G</Code> has already
          run. That&apos;s why the order is <Code>C E G D</Code> and not{" "}
          <Code>C E D G</Code>: returning a Promise from a <Code>.then</Code>{" "}
          isn&apos;t free — it&apos;s a queue-line you didn&apos;t see (
          <A href="https://v8.dev/blog/fast-async">
            V8 blog: faster async functions and promises
          </A>
          ).
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
          The widget below makes the priority rule playable. Build a queue:
          tap <em>+ micro</em> a few times, then <em>+ macro</em>, then{" "}
          <em>Run</em> — the console writes the firing order so you can see
          microtasks drain first.
        </P>
      </div>

      <MicrotaskStarvation />

      <div>
        <P>
          Each loop tick, the engine drains every pending microtask{" "}
          <em>before</em> it touches macrotasks. Add a few of each and click{" "}
          <em>Run</em> to feel the priority.{" "}
          <HL>Now click <em>+ self-sched</em></HL> — a microtask whose body
          schedules another microtask. Every time the engine drains it, the
          queue grows by one. The microtask queue <em>never empties</em>, so
          the loop never moves to the macrotask queue. Macrotasks (timers,
          fetch responses, the next render frame) are stranded.{" "}
          <HL>That&apos;s microtask starvation:</HL> a runaway Promise chain
          stalls everything else, even though the runtime isn&apos;t actually
          busy — just servicing its own queue.
        </P>
        <Aside>
          Node has a different inventory but the same hazard. Its loop runs in
          six phases instead of one, with <Code>process.nextTick</Code> and
          microtask drains <em>between</em> phases (
          <A href="https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick">
            Node docs
          </A>
          ). <Code>process.nextTick</Code> outranks Promise microtasks; both
          outrank anything in the next phase — and a recursive{" "}
          <Code>nextTick</Code> chain starves the loop the same way a recursive{" "}
          <Code>.then</Code> chain does in the browser.
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
          is never zero, and why one runaway Promise stalls your whole tab.
        </P>
        <P>
          Scroll back up and run the opener again. The order isn&apos;t a
          riddle anymore — it&apos;s the sequence the runtime had to take.
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
      <PostNavCards slug="the-line-that-waits-its-turn" />
    </Prose>
  );
}
