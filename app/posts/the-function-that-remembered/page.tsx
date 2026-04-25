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
  HeroTile,
  Term,
} from "@/components/prose";
import { PostBackLink } from "@/components/nav/PostBackLink";
import { PostNavCards } from "@/components/nav/PostNavCards";
import { CodeBlock } from "@/components/code";
import {
  LoopTrap,
  TetherScope,
  RenderLoom,
  PredictReveal,
} from "./widgets";
import { metadata, subtitle } from "./metadata";

export { metadata };

export default function TheFunctionThatRemembered() {
  return (
    <Prose>
      <div className="pt-[var(--spacing-xl)]">
        <PostBackLink />
        <div className="mt-[var(--spacing-md)] mb-[var(--spacing-md)] hidden md:flex flex-col items-start gap-[var(--spacing-md)] lg:flex-row lg:items-end">
          <HeroTile slug="the-function-that-remembered" />
        </div>
        <H1 style={{ fontSize: "clamp(2.5rem, 2rem + 3.5vw, 4rem)" }}>
          JavaScript closures, var vs let, and the loop bug
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
          <span>10 min read</span>
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

        {/* §1 — Opener */}
        <P>
          You&apos;re debugging someone else&apos;s code. The task was simple: log the numbers
          zero through four, one per second. The loop looks fine. You hit run and watch the
          console.
        </P>
        <CodeBlock
          lang="javascript"
          filename="loop.js"
          code={`for (var i = 0; i < 5; i++) {
  setTimeout(() => console.log(i), 1000);
}`}
        />
        <P>
          It prints <PredictReveal answer="5 5 5 5 5" />. Not{" "}
          <Code>0 1 2 3 4</Code>. Five fives. A second late, five times over.
        </P>
        <P>
          Something in that loop remembered the wrong thing. To see <Em>what</Em>, you have to
          see what the five scheduled callbacks are actually pointing at when they eventually
          fire.
        </P>
      </div>

      {/* §2 — LoopTrap widget */}
      <div>
        <Dots />
        <H2>Five callbacks, one cell</H2>
        <P>
          Flip the toggle below between <Code>var</Code> and <Code>let</Code>. In both modes,
          the loop has already finished by the time the timers fire — the five callbacks are
          sitting in the queue, each one pointing back at whatever it captured when it was
          scheduled. Hit play and watch them fire.
        </P>
      </div>

      <LoopTrap />

      <div>
        <P>
          With <Code>var</Code>, there&apos;s only ever one <Code>i</Code>. The loop walked it
          from <Code>0</Code> to <Code>5</Code> and stopped. Each callback has a line out to the
          same cell. When the timers fire, they all look at the cell and they all see{" "}
          <Code>5</Code>. Five fives.
        </P>
        <P>
          With <Code>let</Code>, the picture is different: five lines, fanning out to five
          different cells, each frozen at the value <Code>i</Code> had that round. Same five
          callbacks. Different thing on the other end of the line.
        </P>
      </div>

      {/* §3 — TetherScope: name the mechanism */}
      <div>
        <Dots />
        <H2>What the function is actually carrying</H2>
        <P>
          Call those lines <Em>tethers</Em>. They&apos;re the reason the post is titled the way
          it is. Every function in JavaScript, the moment it&apos;s created, gets a pointer
          back into the scope it was born in — a hidden field on the function object that the
          spec calls <Code>[[Environment]]</Code>. Wired at creation time; never retargeted
          after.
        </P>
        <P>
          The reason this matters is that the function can be <Em>taken elsewhere</Em> —
          returned, passed to <Code>setTimeout</Code>, stored on an object — and the tether
          comes with it. Parameter frames that would normally vanish when the call returns
          don&apos;t vanish if a function born inside them is still holding the tether.
          Consider a factory:
        </P>
        <CodeBlock
          lang="javascript"
          filename="makeAdder.js"
          code={`function makeAdder(n) {
  return (x) => x + n;
}

const add5  = makeAdder(5);
const add10 = makeAdder(10);`}
        />
        <P>
          Each call to <Code>makeAdder</Code> creates its own frame, with its own{" "}
          <Code>n</Code>. The returned arrow function carries a tether to that frame.{" "}
          <Code>add5</Code> and <Code>add10</Code> aren&apos;t copies of <Code>n</Code>; they
          each own a live pointer to a <Em>different</Em>{" "}frame. Step through a single call and
          watch the mechanics:
        </P>
      </div>

      <TetherScope />

      <div>
        <Callout tone="note">
          A <Term>closure</Term>
          {" "}
          is a function, plus the tether it kept. Any function, as long as it can still
          reach something from an outer scope. That&apos;s it.
        </Callout>
        <P>
          One subtlety worth stating plainly, because it&apos;s the misconception every other
          closure bug traces back to: the tether is <Em>live</Em>. It doesn&apos;t freeze a
          copy of the value it reaches; it resolves the name when the function actually runs.
          If something mutates the cell on the other end, the function sees the new value. The
          function remembered the <Em>slot</Em>, not the contents.
        </P>
      </div>

      {/* §4 — Why one letter fixes the loop */}
      <div>
        <Dots />
        <H2>Why one letter fixed the loop</H2>
        <P>
          With that, scroll back up to <Em>LoopTrap</Em>{" "}and look at it again. The reason{" "}
          <Code>var</Code> prints <Code>5 5 5 5 5</Code> isn&apos;t that the loop copied{" "}
          <Code>i</Code> wrong. It&apos;s that <Code>var</Code> declares one binding for the
          whole function. The five arrow functions picked up five tethers. All five tethers
          pointed at the same cell. The loop walked the cell to <Code>5</Code>. Nothing in the
          callbacks&apos; world said &ldquo;freeze what <Code>i</Code> is right now.&rdquo; When
          they fired, they read what was there.
        </P>
        <P>
          The one-letter fix isn&apos;t a snapshot, either. When you write{" "}
          <Code>for (let i = 0; …)</Code>, the language does something specific: every iteration
          of the loop gets its own fresh <Code>i</Code>. A new binding, an actual new cell on
          the heap, each round. The five scheduled arrow functions now pick up five tethers to
          five different cells. Same mechanism. Different topology.
        </P>
        <Aside>
          The spec calls the operation <Code>CreatePerIterationEnvironment</Code>. It only
          kicks in for the loop-header declaration — a plain <Code>let</Code> inside the body
          doesn&apos;t magically clone itself each iteration. It&apos;s the <Code>for</Code>{" "}
          header that&apos;s special.
        </Aside>
        <Aside>
          Kyle Simpson&apos;s{" "}
          <A href="https://github.com/getify/You-Dont-Know-JS/blob/2nd-ed/scope-closures/ch7.md">
            You Don&apos;t Know JS
          </A>
          {" "}reserves the word <Em>closure</Em>
          {" "}
          for functions that run somewhere their tether targets aren&apos;t directly in scope
          — the observable case. MDN and the spec use the word more broadly. Same mechanism —
          the debate is only about when its effects count as observable.
        </Aside>
      </div>

      {/* §5 — React stale closure */}
      <div>
        <Dots />
        <H2>The same bug, a decade later, in React</H2>
        <P>
          Fast-forward to a React component. You&apos;ve written this before, and you remember
          being surprised the first time:
        </P>
        <CodeBlock
          lang="tsx"
          filename="Counter.tsx"
          code={`function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCount(count + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return <h1>{count}</h1>;
}`}
        />
        <P>
          It goes from <Code>0</Code> to <Code>1</Code> and stops. The interval keeps firing,
          but the number on the screen never moves past one.
        </P>
        <P>
          This is the loop bug. Same mechanism, different decade. Every time{" "}
          <Code>Counter</Code> runs, React executes the function body from the top — a new
          call, a new frame, a new <Code>count</Code> binding. The first render produces a
          frame where <Code>count</Code> is <Code>0</Code>; the effect runs in that frame, the
          callback handed to <Code>setInterval</Code> is born in that frame, and its tether is
          wired back to that frame&apos;s <Code>count</Code>. Empty-array dependencies tell
          React not to re-run the effect, so the interval never gets re-created. The callback
          ticking inside <Code>setInterval</Code> is the same callback, forever, still
          tethered to render zero.
        </P>
      </div>

      <RenderLoom />

      <div>
        <P>
          Flip the toggle to <Code>c =&gt; c + 1</Code>. The callback no longer reads anything
          from the enclosing render — it just asks React for the current count at call time.
          No tether to a stale frame. No frame to go stale.
        </P>
        <Callout tone="note">
          A stale closure isn&apos;t a bug in the closure. It&apos;s a tether to a scope the
          world has moved past. The question is never &ldquo;is this a closure?&rdquo; — almost
          everything is. The question is &ldquo;what scope is it tethered to, and does that
          scope still hold what I need?&rdquo;
        </Callout>
        <P>
          Dan Abramov made the{" "}
          <A href="https://overreacted.io/a-complete-guide-to-useeffect/">
            stronger version
          </A>{" "}
          of this argument: the capture-per-render behaviour is the feature, not the trap.
          Class components used to read <Code>this.props</Code> live; an async handler that
          started on render five could silently read render eight&apos;s props halfway through.
          Hooks traded that for closures tethered to the render that birthed them. The bugs
          you hit now are louder, more local, and a lot easier to reason about.
        </P>
      </div>

      {/* §6 — Coda: leaks */}
      <div>
        <Dots />
        <H2>What the garbage collector has to honor</H2>
        <P>
          One more consequence, and then we&apos;re done. If a closure is holding a tether, the
          garbage collector can&apos;t clean up what&apos;s on the other end. That&apos;s how
          closures leak memory. The classic pattern — first spotted in Meteor a decade back —
          looks like this:
        </P>
        <CodeBlock
          lang="javascript"
          filename="replaceThing.js"
          code={`let theThing = null;
function replaceThing() {
  const prev = theThing;
  theThing = {
    big: new Array(1_000_000).join("x"),
    link: () => { if (prev) { /* never called */ } },
  };
}
setInterval(replaceThing, 1000);`}
        />
        <P>
          Every tick, <Code>theThing</Code> gets replaced with a new megabyte-sized object that
          carries a closure — <Code>link</Code> — tethered back to <Code>prev</Code>. And{" "}
          <Code>prev</Code> is last tick&apos;s <Code>theThing</Code>, which has its own{" "}
          <Code>link</Code>, which holds on to the tick before that, which holds on to the tick
          before that. A linked list of megabyte strings grows by one every second. The closure
          is never called. It doesn&apos;t have to be — the tether keeps its promises either
          way.
        </P>
        <P>
          Fix: don&apos;t create the closure you don&apos;t need. Null references when you
          finish with them. Return the cleanup from <Code>useEffect</Code>. Pair{" "}
          <Code>addEventListener</Code> with an <Code>AbortController</Code>.
        </P>
        <P>
          Next time your <Code>setTimeout</Code> prints the wrong number, or your React counter
          sticks at one, or your heap snapshot lights up a chain that shouldn&apos;t still
          exist — you&apos;ll know where to look. Closures aren&apos;t about memory. They&apos;re
          about where a function is still rooted — and whether that ground still holds what
          you need.
        </P>
      </div>
      <PostNavCards slug="the-function-that-remembered" />
    </Prose>
  );
}
