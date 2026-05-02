/**
 * Voice & tone note (do not "fix" without re-reading the brief):
 *
 *   tone: dry confidence, plain English, Hamel-shaped.
 *
 * From-scratch rewrite (iteration #5). The four prior iterations leaned
 * on a sustained analogy (wine), a running character (Bob), and five
 * interactive widgets. The reader reported understanding "absolutely
 * nothing" after three paragraphs.
 *
 * This rewrite:
 *   - opens by orienting the reader (what an eval is, why this matters,
 *     who it's for, what they'll get) before any vignette;
 *   - mirrors Hamel's three-eval-types structure (unit tests →
 *     LLM-as-judge → human eval) instead of inventing a new spine;
 *   - drops all 5 widgets. Prose carries the load;
 *   - keeps the cover SVG, the <Note> primitive (1 use), and a small
 *     budget of <Term> tooltips (≤5).
 *
 * Bans honored:
 *   - No <HeroTile> on the article page (post-PR-#92 convention).
 *   - No <VerticalCutReveal>.
 *   - No memes.
 *   - No analogies-as-scaffolding.
 */
import {
  Prose,
  H1,
  H2,
  H3,
  P,
  Callout,
  Em,
  Note,
  Term,
} from "@/components/prose";
import { PostBackLink } from "@/components/nav/PostBackLink";
import { PostNavCards } from "@/components/nav/PostNavCards";
import { TextHighlighter } from "@/components/fancy";
import { metadata } from "./metadata";

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

/** Numbered section header — a monospace eyebrow above the H2. */
function SectionH2({
  eyebrow,
  id,
  children,
}: {
  eyebrow: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <H2 id={id}>
      <span
        className="font-mono block"
        style={{
          fontSize: "var(--text-small)",
          color: "var(--color-text-muted)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          fontWeight: 400,
          marginBottom: "0.4em",
        }}
      >
        {eyebrow}
      </span>
      {children}
    </H2>
  );
}

export default function EvalsOrVibes() {
  return (
    <Prose>
      <div className="pt-[var(--spacing-xl)]">
        <PostBackLink />
        <p
          className="font-mono"
          style={{
            fontSize: "var(--text-small)",
            color: "var(--color-text-muted)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            fontWeight: 400,
            marginBottom: "var(--spacing-sm)",
          }}
        >
          A primer on evals for LLM products
        </p>
        <H1
          style={{
            fontSize: "clamp(2.5rem, 2rem + 3.5vw, 4rem)",
            lineHeight: 1.05,
          }}
        >
          How to know if your AI is actually any good.
        </H1>
        <p
          className="mt-[var(--spacing-sm)] font-mono tabular-nums"
          style={{
            fontSize: "var(--text-small)",
            color: "var(--color-text-muted)",
          }}
        >
          <time dateTime="2026-05-02">may 2, 2026</time>
          <span className="mx-2">·</span>
          <span>9 min read</span>
        </p>
      </div>

      {/* §1 — Preface: orient the reader. */}
      <div>
        <SectionH2 eyebrow="1 · what this is about" id="preface">
          What this article is, in one paragraph.
        </SectionH2>
        <P>
          An{" "}
          <Term define="A test for whether your LLM is doing what you want. In practice: a list of inputs, the answers you expect, and a way to score what came back.">
            eval
          </Term>{" "}
          is a test for an LLM feature. You write down a list of
          inputs, you write down what a good answer looks like, you
          run the model, and you score the output. That&apos;s the
          whole idea. The rest of this article is about how to do
          that well.
        </P>
        <P>
          Most teams shipping AI features skip this step. They paste
          a prompt into the playground, look at the answer, decide
          it reads fine, and ship. That works until it doesn&apos;t
          — usually around the second customer, or the first time
          someone swaps the model. Then the team is stuck debating
          whether the new version is &ldquo;better,&rdquo; with
          nothing to point at.{" "}
          <HL>Evals are how you get something to point at.</HL>
        </P>
        <P>
          This is for developers and product folks shipping
          LLM-powered features — chat, search, summarisation, agents,
          anything where the output isn&apos;t deterministic. By the
          end you&apos;ll have a working mental model of what evals
          are, the three kinds you&apos;ll want, and a small recipe
          you can run on Monday morning with nothing but a
          spreadsheet.
        </P>
      </div>

      {/* §2 — What goes wrong without evals: one concrete failure mode. */}
      <div>
        <SectionH2 eyebrow="2 · the failure mode" id="failure-mode">
          What goes wrong when you skip this.
        </SectionH2>
        <P>
          Picture a doc-Q&amp;A tool. Customers ask questions about a
          contract, the model answers, and the answer cites a page
          number. The team built it in a week. The demo went well.
          Six weeks later, a customer notices the model cited page
          14 of a contract — and the clause is on page 27. The
          answer reads fluent. The number is wrong.
        </P>
        <P>
          Without evals, three things are now true. One: nobody
          knows how often this happens. Two: nobody knows whether
          the new prompt the team shipped on Tuesday made it worse.
          Three: the only way to find out is to wait for the next
          customer to complain. The feedback loop is months long
          and runs through your support inbox.
        </P>
        <P>
          With evals, the picture changes. You have, somewhere, a
          list of twenty real questions. For each one, you know what
          page the right answer cites. When the model gets a page
          number wrong, a number on a dashboard moves. When you
          change the prompt, the number moves. When you swap the
          model, the number moves.{" "}
          <HL>You can tell, before the customer can.</HL>
        </P>
        <P>
          That&apos;s the whole pitch. The rest is mechanics — what
          to put in the list, how to score it, and what to do when
          the list gets too big to grade by hand.
        </P>
      </div>

      {/* §3 — Three kinds of evals. */}
      <div>
        <SectionH2 eyebrow="3 · the three kinds" id="three-kinds">
          The three kinds of evals.
        </SectionH2>
        <P>
          There are roughly three kinds of evals, and most teams
          end up using all three. They get progressively more
          flexible, more expensive, and harder to automate. Start
          with the cheap ones.
        </P>

        <H3>Kind 1 — Unit tests.</H3>
        <P>
          A unit test for an LLM is a deterministic check. You
          decide, in advance, a yes-or-no question you can ask of
          the output, and you ask it with code, not with another
          model. <Em>Did the SQL the model produced contain a
          WHERE clause?</Em> <Em>Is the cited page number a number
          that exists in the document?</Em> <Em>Did the answer
          mention a competitor we asked it not to mention?</Em>
        </P>
        <P>
          These are cheap. They run in milliseconds. You run them
          on every prompt change and every model swap, the same
          way you run unit tests in any other codebase. They&apos;re
          also limited: they only catch things you can express as a
          rule. They won&apos;t tell you whether the answer is
          helpful, on-tone, or factually correct on something the
          rule can&apos;t see.
        </P>
        <P>
          Use them wherever you can. They catch the dumb regressions
          — the ones where a prompt change breaks formatting, drops
          a required field, or stops citing sources. They&apos;re
          also where most teams should start, because they&apos;re
          the cheapest way to turn vibes into a number.
        </P>

        <H3>
          Kind 2 —{" "}
          <Term define="An LLM you point at another LLM's output and ask to grade it. Flexible, fast, and biased — useful once you've calibrated it against humans.">
            LLM-as-judge
          </Term>
          .
        </H3>
        <P>
          When the question you want to ask isn&apos;t a regex —{" "}
          <Em>was the tone polite?</Em>, <Em>did the answer cover
          all three points the user asked about?</Em> — you reach
          for a second LLM. You give it the input, the output, and
          a{" "}
          <Term define="A scoring guide. The yes-or-no questions a careful grader would ask of every output — factual, on-voice, in-scope, complete.">
            rubric
          </Term>{" "}
          (a short list of yes-or-no questions), and ask it to
          grade.
        </P>
        <P>
          This scales. One judge model can grade thousands of
          outputs in the time a human grades ten. It&apos;s also
          biased in ways you have to measure. The judge prefers
          longer answers. The judge scores its own model family
          higher than rivals. The judge agrees with whatever the
          question implies. None of this is fixable by writing a
          better prompt — but all of it is measurable.
        </P>
        <Note summary="The cheapest calibration recipe — sample, blind, compare.">
          Eugene Yan&apos;s tactical version: every week, take 30
          outputs the LLM-judge has scored. Have a human re-grade
          them blind — no model name, no judge score visible. If
          the human and the judge agree on roughly the same
          fraction of outputs, you&apos;re calibrated. If they
          don&apos;t, the judge prompt or the rubric needs work
          before you trust the dashboard again.
        </Note>
        <P>
          Use LLM-as-judge for the questions a unit test
          can&apos;t answer, but only after you&apos;ve checked
          its agreement with a human grader on a small sample.
          Skip it if your eval set is small enough that a human
          can grade the whole thing in an afternoon — that&apos;s
          cheaper than calibrating a judge, and more accurate.
        </P>

        <H3>Kind 3 — Human eval.</H3>
        <P>
          Sometimes the only thing that knows whether the answer is
          good is a person. Tone. Helpfulness. Whether the model
          actually answered the question the user asked, instead of
          the question it preferred to answer. Whether the
          summary leaves out something important. These are
          questions where a human grader is the gold standard, and
          where any model — including the judge — is fundamentally
          downstream of human judgment.
        </P>
        <P>
          Human eval is slow and expensive. It also doesn&apos;t
          scale: ten people grading a hundred outputs each is a
          full week of work. So you do it sparingly and in two
          places. First, on a small fixed set of hard examples
          you re-grade every release — the ones where you really
          want to know whether you&apos;ve regressed. Second, on
          the calibration sample for the LLM-judge, where you only
          need to grade thirty.
        </P>
        <P>
          Skip human eval if a unit test or a calibrated LLM-judge
          can answer the question. Reach for it when the question
          is squishy enough that you don&apos;t trust either —{" "}
          <HL>and accept that some questions will always be squishy.</HL>{" "}
          That&apos;s not a failure of the eval system. That&apos;s
          the shape of the work.
        </P>
      </div>

      {/* §4 — How to actually start. */}
      <div>
        <SectionH2 eyebrow="4 · the recipe" id="recipe">
          How to start, on Monday.
        </SectionH2>
        <P>
          You don&apos;t need a framework, a platform, or a vendor.
          You need a spreadsheet and an hour. The recipe below is
          deliberately small — small enough that you can run it
          before lunch and ship the result before the day ends.
        </P>
        <Callout>
          <ul
            className="pl-[var(--spacing-md)] list-disc flex flex-col gap-[var(--spacing-2xs)]"
            style={{ color: "var(--color-text)" }}
          >
            <li>
              <strong>Pull 20 real prompts from production.</strong>{" "}
              Not synthetic. Not the demo prompts. Real ones, from
              the last week of traffic. Borderline cases first —
              the ones where you&apos;re not sure what the right
              answer is.
            </li>
            <li>
              <strong>For each, write what a good answer looks like.</strong>{" "}
              The exact answer if you know it. Otherwise, the two
              or three yes-or-no questions a careful grader would
              ask — <Em>did it cite the right page?</Em>,{" "}
              <Em>did it stay in scope?</Em>, <Em>was it polite?</Em>
            </li>
            <li>
              <strong>Run the model. Score the output.</strong>{" "}
              Score it yourself first. If the question is a rule
              (&ldquo;does the SQL contain WHERE&rdquo;), write a
              one-line check. If it isn&apos;t, mark each row pass
              or fail by hand.
            </li>
            <li>
              <strong>Track the{" "}
                <Term define="The fraction of your eval set the model gets right. The single number you watch when you change the prompt or swap the model.">
                  pass rate
                </Term>{" "}
                over time.</strong>{" "}
              When it moves, you&apos;ll know whether the change
              you made helped, hurt, or did nothing. Most prompt
              changes do nothing.
            </li>
            <li>
              <strong>Add hard prompts every week.</strong> When a
              customer reports a bad answer, that prompt goes in
              the spreadsheet. When you find a failure mode in
              production, that pattern goes in the spreadsheet. The
              set grows. The rubric tightens.
            </li>
          </ul>
        </Callout>
        <P>
          Twenty prompts is enough to start. It&apos;s not enough
          to ship a product on, but it&apos;s enough to{" "}
          <HL>turn vibes into a number</HL>. Once you have the
          number, the rest of the practice — adding cases,
          calibrating a judge, scheduling human reviews — is
          mechanical. The hard part is the first row.
        </P>
        <P>
          One warning. If the suite ever passes 100%, the suite is
          probably broken — not because your model is perfect, but
          because the prompts in it have stopped being hard. Keep
          adding cases the model fails on. A useful eval set is
          one that <Em>occasionally tells you no.</Em>
        </P>
      </div>

      {/* §5 — Closing. */}
      <div>
        <SectionH2 eyebrow="5 · the point" id="the-point">
          The point.
        </SectionH2>
        <P>
          The reason to do any of this isn&apos;t to catch bugs,
          although you will. It isn&apos;t to ship faster, although
          you will.{" "}
          <HL>The reason is to be able to answer the question your boss is going to ask.</HL>{" "}
          Is the new version better? Is the model we&apos;re paying
          for actually worth it? Did the change you made on Tuesday
          help? Without an eval set, every answer is an opinion.
          With one, every answer is a number — and you can argue
          about the rubric instead of arguing about your taste.
        </P>
        <P>
          Open the spreadsheet.
        </P>
      </div>

      <PostNavCards slug="evals-or-vibes" />
    </Prose>
  );
}
