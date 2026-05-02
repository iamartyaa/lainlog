import {
  Prose,
  H1,
  H2,
  P,
  Code,
  Dots,
  Em,
  Aside,
  A,
  Term,
} from "@/components/prose";
import { PostBackLink } from "@/components/nav/PostBackLink";
import { PostNavCards } from "@/components/nav/PostNavCards";
import { TextHighlighter } from "@/components/fancy";
import {
  CreationVsExecution,
  DeclarationStates,
  CallStackECs,
  WhyTwoPasses,
  ClosingDot,
} from "./widgets";
import { CALL_STACK_SNIPPET } from "./widgets/CallStackSnippet";
import { CodeBlock } from "@/components/code";
import { metadata, subtitle } from "./metadata";

export { metadata };

const HL_TRANSITION = { type: "spring" as const, duration: 0.9, bounce: 0 };
const HL_COLOR = "color-mix(in oklab, var(--color-accent) 28%, transparent)";
const HL_OPTS = { once: true, initial: false, amount: 0.55 } as const;

/**
 * `<HL>` — load-bearing-phrase highlighter. Used sparingly (~5 per post).
 * Reserve for inversions, mechanism first-appearances, and section payoffs.
 */
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

/** Eyebrow — the small all-caps numeric label that sits above each H2. */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mt-[var(--spacing-md)] font-sans"
      style={{
        fontSize: "var(--text-small)",
        color: "var(--color-text-muted)",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </p>
  );
}

export default function HowJavaScriptReadsItsOwnFuture() {
  return (
    <Prose>
      <div className="pt-[var(--spacing-xl)]">
        <PostBackLink />
        <H1 style={{ fontSize: "clamp(2.5rem, 2rem + 3.5vw, 4rem)" }}>
          JavaScript Hoisting, the TDZ, and the Call Stack Explained
        </H1>
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

        {/* §0 — Scene */}
        <P>
          You type two lines into a console:{" "}
          <Code>console.log(x); var x = 5;</Code>. You expect an error — line 1
          reads a name that line 2 hasn&apos;t introduced yet. Instead, the
          console quietly logs <Code>undefined</Code>. The error never comes.
          Line 1 ran with line 2 already known.
        </P>
      </div>

      {/* §1 — The pre-walk */}
      <div>
        <Dots />
        <Eyebrow>1 · the pre-walk</Eyebrow>
        <H2>The engine reads your file before it runs line 1.</H2>
        <P>
          The trick isn&apos;t that <Code>var</Code> moved anywhere.{" "}
          <HL>
            Nothing moves. The engine walks the body once before any of it
            runs.
          </HL>{" "}
          On that first pass — call it the <Term>creation phase</Term> — every{" "}
          <Code>var</Code>, every <Code>let</Code>, every function declaration,
          every parameter gets a binding installed in the function&apos;s
          memory. Only after the whole body has been scanned does line 1
          actually start.
        </P>
        <P>
          Drag the scrubber below — past the labelled boundary. To the left,
          the engine is still scanning; the binding for <Code>x</Code> is
          already there with value <Code>undefined</Code>, but no source line
          has run. To the right, line 1 finally executes. It reads what was
          installed on the left.
        </P>
      </div>

      <CreationVsExecution />

      <div className="pt-[var(--spacing-md)]">
        <Aside>
          The spec name for this pre-walk is{" "}
          <Code>FunctionDeclarationInstantiation</Code> for function bodies
          and <Code>GlobalDeclarationInstantiation</Code> for the script. See{" "}
          <A href="https://tc39.es/ecma262/multipage/ecmascript-language-functions-and-classes.html#sec-functiondeclarationinstantiation">
            ECMA-262 §10.2.11
          </A>
          . Throughout this post we&apos;ll just call it the creation phase.
        </Aside>
      </div>

      {/* §2 — Declaration states */}
      <div>
        <Dots />
        <Eyebrow>2 · what the pre-walk records</Eyebrow>
        <H2>Different declarations arrive at line 1 in different shapes.</H2>
        <P>
          The pre-walk isn&apos;t uniform. It looks at the syntactic kind of
          each declaration and decides what state the binding is in when
          execution begins. Four cases cover almost everything you&apos;ll
          ever hit.
        </P>
        <P>
          A <Code>var</Code> binding is created and initialised to{" "}
          <Code>undefined</Code> — that&apos;s the case the opening scene
          showed. A function declaration goes further: the binding exists and
          already points at the function value, which is why <Code>f()</Code>{" "}
          can call <Code>f</Code> two lines above the{" "}
          <Code>function f(){}</Code> that defines it.
        </P>
        <P>
          A <Code>var x = function(){}</Code> is the deceptive one. Only the{" "}
          <Code>var x = undefined</Code> half survives the pre-walk. The
          function value attaches when the assignment line runs, so calling{" "}
          <Code>f()</Code> above it throws <Code>TypeError</Code>.
        </P>
        <P>
          And then there&apos;s <Code>let</Code>, <Code>const</Code>, and{" "}
          <Code>class</Code>. Their bindings are created on the pre-walk too,
          but they arrive at line 1 in a fourth state: uninitialised. The TC39
          spec has a name for it — the <Term>temporal dead zone</Term> — and a
          rule for it:{" "}
          <HL>the binding exists, but reading it throws.</HL>
        </P>
        <P>
          Switch declaration kinds in the widget below to see the four memory
          shapes side by side. The hatched cell is the TDZ — the binding
          isn&apos;t missing, it&apos;s on hold.
        </P>
      </div>

      <DeclarationStates />

      <div className="pt-[var(--spacing-md)]">
        <P>
          One detail worth keeping: a <Code>let</Code> inside a block creates
          its binding in a fresh inner <Term>lexical environment</Term> attached
          to that block, not in the function&apos;s top-level memory. That&apos;s
          why <Code>{"{ let x = 2 }"}</Code> doesn&apos;t collide with an
          outer <Code>let x</Code> — same name, different environment record.
          See <A href="https://developer.mozilla.org/en-US/docs/Glossary/Hoisting">MDN&apos;s hoisting catalogue</A>{" "}
          for the full taxonomy.
        </P>
      </div>

      {/* §3 — Call stack of ECs */}
      <div>
        <Dots />
        <Eyebrow>3 · the call stack, plural</Eyebrow>
        <H2>The call stack is a stack of execution contexts, not function calls.</H2>
        <P>
          Hoisting, the TDZ, and the question the opening scene started with
          all live inside one frame: the global execution context. Every
          script begins with that frame at the bottom of a stack. The frame is
          a structure, not a name on a list — it carries its own{" "}
          <Term>variable environment</Term> (where <Code>var</Code> and
          function-declaration bindings live) and its own lexical environment
          (where <Code>let</Code>, <Code>const</Code>, and block scopes live).
        </P>
        <P>
          When a function is invoked, the engine pushes a new execution
          context on top. That new frame runs its own creation phase —
          parameters, vars, function declarations, the TDZ rules — and starts
          executing line 1 of the function body. When the function returns,
          its frame pops, and whichever frame is now on top resumes wherever
          it had paused.
        </P>
        <P>
          Step through the widget below to watch a tiny program run:{" "}
          <Code>compute(7)</Code> calls <Code>multiply(7, 2)</Code>, which
          returns <Code>14</Code>. The highlighted line and the highlighted
          frame are paired — the line being run, and the context running it.
          Each call pushes a new EC onto the stack; each return pops one.{" "}
          <HL>
            Whichever frame is on top is the engine&apos;s thread of
            execution.
          </HL>
        </P>
      </div>

      <CallStackECs
        codeSlot={
          <CodeBlock
            code={CALL_STACK_SNIPPET}
            lang="javascript"
            filename="program.js"
            showLineNumbers
          />
        }
      />

      <div className="pt-[var(--spacing-lg)]">
        <P>
          Each function call gets its own execution context — its own
          private memory and its own slot on the stack. The thread of
          execution moves into a new context when a function is called, and
          back to the previous one when it returns. That&apos;s also the
          answer to the opening scene. The line that printed{" "}
          <Code>undefined</Code> was running inside the global EC. Its{" "}
          <Em>variable environment</Em> already held{" "}
          <Code>x: undefined</Code>, courtesy of the pre-walk. The console
          asked memory; memory answered.
        </P>
      </div>

      {/* §4 — Why two passes */}
      <div>
        <Dots />
        <Eyebrow>4 · why two passes</Eyebrow>
        <H2>The two-pass model is required.</H2>
        <P>
          A reasonable question at this point: couldn&apos;t the engine just
          run the file top to bottom and look up names as it goes? It would be
          simpler. It would also be wrong — three different ways. Toggle
          through the reasons below.
        </P>
      </div>

      <WhyTwoPasses />

      <div className="pt-[var(--spacing-md)]">
        <P>
          Three constraints, three categories. <Em>Semantic</Em>: function
          declarations must be callable from anywhere in scope.{" "}
          <Em>Syntactic</Em>: duplicate <Code>let</Code>s must throw a{" "}
          <Code>SyntaxError</Code> before any line runs — V8&apos;s preparser
          was <A href="https://v8.dev/blog/preparser">extended specifically</A>{" "}
          to catch them. <Em>Immutability</Em>: a <Code>const</Code> can&apos;t
          read as <Code>undefined</Code> first and bind later. The TDZ resolves
          all three: <HL>required, not an optimisation.</HL>
        </P>
        <Aside>
          The spec describes two passes; V8&apos;s pipeline (parser → AST →
          Ignition bytecode → TurboFan) implements them lazily — a function
          body is preparsed once for syntax + variable refs, and only fully
          parsed on first invocation. A{" "}
          <A href="https://v8.dev/blog/preparser">syntax error inside an
          unused function still throws at script load</A>, but its variable
          bindings aren&apos;t fully resolved until the call.
        </Aside>
      </div>

      {/* §5 — Closer */}
      <div>
        <Dots />
        <P>
          Hoisting, the TDZ, functions callable from above — three names for
          one mechanism. The opening scene wasn&apos;t a quirk. It was the
          mechanism showing through.
        </P>
        <p
          className="[margin-block-start:1.25em]"
          style={{ fontFamily: "var(--font-serif)", fontSize: "var(--text-body)" }}
        >
          The engine reads your future to run your present.
        </p>
        <ClosingDot />
      </div>
      <PostNavCards slug="how-javascript-reads-its-own-future" />
    </Prose>
  );
}
