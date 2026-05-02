/**
 * Voice & tone note (do not "fix" without re-reading the brief):
 *
 *   tone: deliberate-deviation; see Checkpoint 2 of t-mo8rshv6dno5 brief
 *
 * Funny, informal, slightly weary. Memes capped at 2 (both load-bearing
 * and earned: "dog in burning room" once; "dog has built a CSV" once).
 * Two MediaBetweenText slots are intentional — explicit Checkpoint 2
 * sign-off.
 *
 * Rewrite-pass (post user feedback): the wine analogy was carpeted
 * across all 8 scenes in the polish-pass. This rewrite collapses it to
 * the cover image + ONE earned closing line in §7. The running
 * "Bob the real-estate AI" example is replaced by varied, concrete
 * dev failure modes (SQL agents, doc-Q&A tools, support summarisers,
 * etc.). Sentence-level rewrite for clarity. New H1: "Vibes don't
 * scale."
 *
 * Bans honored:
 *   - No <HeroTile> on the article page (post-PR-#92 convention).
 *   - No <VerticalCutReveal>.
 *   - WidgetShell from @/components/viz/WidgetShell.
 */
import {
  Prose,
  H1,
  H2,
  P,
  Callout,
  Dots,
  Em,
  Note,
  Term,
} from "@/components/prose";
import { PostBackLink } from "@/components/nav/PostBackLink";
import { PostNavCards } from "@/components/nav/PostNavCards";
import { TextHighlighter } from "@/components/fancy";
import {
  VibesVsRubric,
  EvalSetBuilder,
  PassRateOverTime,
  JudgeCalibrate,
  N10Trap,
  RentChipReveal,
  BallotChipReveal,
} from "./widgets";
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
          Evals, or Vibes? — How to know if your LLM feature is actually any good
        </p>
        <H1
          style={{
            fontSize: "clamp(2.5rem, 2rem + 3.5vw, 4rem)",
            lineHeight: 1.05,
          }}
        >
          Vibes don&apos;t scale.
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
          <span>14 min read</span>
        </p>
      </div>

      {/* §1 — Cold open: a Tuesday-morning failure */}
      <div>
        <Dots />
        <SectionH2 eyebrow="1 · the cold open" id="cold-open">
          Your model passes every demo and fails on a Tuesday.
        </SectionH2>
        <P>
          On a Tuesday in March, a SQL agent your team shipped two
          months ago drops the <Em>WHERE</Em> clause and returns the
          entire users table to a sales rep typing &ldquo;show me
          customers in Ohio.&rdquo; Twelve thousand rows. The rep
          screenshots it. The screenshot lands in a customer Slack
          before it lands in yours.
        </P>
        <P>
          That same week, a teammate runs the same prompt twice, two
          days apart, and gets two different answers.
        </P>
        <RentChipReveal />
        <P>
          Nobody on the team noticed either failure until somebody
          outside the building did.{" "}
          <HL>The author of the feature is the last person in the building to notice.</HL>{" "}
          Not because the team is bad. Because the team is involved.
          They test by re-running the prompt in the playground,
          watching it come back coherent, and shipping. This
          isn&apos;t the edge case. This is the median Tuesday.
        </P>
        <P>So how would you know? How would <Em>anyone</Em> know?</P>
      </div>

      {/* §2 — Eyeballing your own output is the worst way to grade it */}
      <div>
        <Dots />
        <SectionH2 eyebrow="2 · the wrong instrument" id="wrong-instrument">
          Eyeballing your own output is the worst way to grade it.
        </SectionH2>
        <P>
          Most teams ship the same way. Open the playground. Paste a
          prompt. Read the output. If it looks fine, ship.{" "}
          <HL>That isn&apos;t testing. That&apos;s vibes auto-correlated with hope.</HL>
        </P>
        <P>
          You wrote the prompt. You picked the model. You chose the
          example. You are, structurally, the worst grader the
          output has. Your brain pattern-matches its own output as
          coherent because it already agrees with the assumptions
          that produced it. The bugs you can&apos;t see are the
          bugs that match your own blind spots.
        </P>
        <P>
          The fix is{" "}
          <Term define="A held-out set of inputs your LLM has to produce acceptable outputs for. Test fixtures with a scoring guide attached.">
            evals
          </Term>
          : a small, written-down set of inputs and the answers you
          expect, scored against a{" "}
          <Term define="A scoring guide. The yes/no questions a careful grader would ask of every output — factual, on-voice, in-scope, safe.">
            rubric
          </Term>{" "}
          you wrote in advance. Outputs graded blind, on every prompt
          change, every model swap, every Friday-afternoon
          &ldquo;small tweak.&rdquo; Boring. Mechanical. Works.
        </P>
        <P>
          The widget below makes the gap concrete. Three outputs —
          mark each one ship or cut by gut. The rubric reveals on
          your first tap. The shape of your disagreement with the
          rubric is the shape of the bug your eyes were missing.
        </P>
        <VibesVsRubric />
        <P>
          Vibes catches the obvious mistakes. That&apos;s why
          morale is high — most outputs <Em>do</Em> look fine. The
          gap is in the outputs that read shippable but flunk a
          criterion you weren&apos;t scanning for. Factual? Yes.
          In-scope? You didn&apos;t check. On-voice? Nobody asked.
          Safe? You forgot you had a policy.
        </P>
      </div>

      {/* §3 — Day three, somebody opens a CSV */}
      <div>
        <Dots />
        <SectionH2 eyebrow="3 · the act" id="open-the-csv">
          Day three, somebody opens a CSV.
        </SectionH2>
        <P>
          A teammate posts a screenshot. A doc-Q&amp;A tool
          confidently cited page 14 of a contract. The clause is on
          page 27. The output reads fluent. The citation is wrong.
        </P>
        <P>
          One team reads the output, shrugs, says &ldquo;close
          enough,&rdquo; and ships. That team is{" "}
          <Em>always</Em> fine. That team is fine the way the dog in
          the burning room is fine.
        </P>
        <P>
          The other team opens a CSV. Prompt in column A. Actual
          output in column B. Expected output in column C. A one-line
          comment in column D — &ldquo;cited page 14; correct page is
          27.&rdquo; They paste in five more borderline outputs from
          the morning. By Friday they have an{" "}
          <Term define="A small CSV of inputs your LLM has to handle. Each row: prompt, expected output, what a careful grader would say.">
            eval set
          </Term>
          .
        </P>
        <P>
          That&apos;s the bifurcation. Eugene Yan calls building
          product evals{" "}
          <HL>the scientific method in disguise</HL>: observe,
          annotate, hypothesize, experiment, measure. The CSV is the
          disguise. The method is the <Em>annotate</Em> column.
        </P>
        <EvalSetBuilder />
        <P>
          An eval set isn&apos;t a tool. It&apos;s a habit. The
          first row is the act. Every other piece of advice in this
          post is replaceable. The first row isn&apos;t. As Hamel
          Husain puts it:{" "}
          <Em>you are doing it wrong if you aren&apos;t looking at lots of data.</Em>
        </P>
      </div>

      {/* §4 — A 100% pass rate is a failing grade */}
      <div>
        <Dots />
        <SectionH2 eyebrow="4 · the saturation trap" id="saturation">
          A 100% pass rate is a failing grade.
        </SectionH2>
        <P>
          Two months in. Fifty prompts in the CSV. The full suite
          passes every Monday. Passes every Friday. The team feels
          great.
        </P>
        <P>
          They&apos;ve walked into the most dangerous phase of
          eval-writing —{" "}
          <HL>the phase where the suite tells you what you want to hear.</HL>
        </P>
        <P>
          Simon Willison has the cleanest line on this:{" "}
          <Em>
            &ldquo;If you&apos;re passing 100% of your evals,
            you&apos;re likely not challenging your system enough.&rdquo;
          </Em>{" "}
          The term of art is{" "}
          <Term define="The moment your eval suite stops telling you anything new — the prompts in it are too easy for the current model. A 100% pass rate is the symptom.">
            eval saturation
          </Term>
          : the suite stops giving signal.
        </P>
        <P>
          <BallotChipReveal />
        </P>
        <P>
          The fix is to keep adding hard prompts. Ones the model
          fails on. Ones from the last incident. Ones a
          competitor&apos;s release surfaced.{" "}
          <HL>Eval sets aren&apos;t done when they pass.</HL>{" "}
          They&apos;re done when they break in interesting ways.
        </P>
        <PassRateOverTime />
        <P>
          The line climbs to 100% and stays there. Then a customer
          incident lands on the plateau. Press &ldquo;add hard
          prompts&rdquo; and the line drops to 78%. 78% is not a
          problem. 78% is the suite doing its job. 100% is the suite
          asleep.
        </P>
      </div>

      {/* §5 — LLM-as-judge has biases too */}
      <div>
        <Dots />
        <SectionH2 eyebrow="5 · the calibration" id="judge">
          Your grader is biased. Calibrate it.
        </SectionH2>
        <P>
          Three months in. The suite is at 240 prompts. Nobody can
          manually grade 240 outputs after every prompt change. So
          the team does what every team does: they hire an LLM as
          their grader. Fast. Scales. Also wrong in ways that matter.
        </P>
        <Note summary="The biases your judge ships with">
          Lilian Weng catalogued the failure modes of LLM-as-judge
          in uncomfortable detail. The judge prefers verbose
          outputs. The judge scores its own model family higher
          than rivals. The judge sycophantically agrees with
          whatever the question framing implies. None of this is
          fixable by prompting. All of it is measurable.
        </Note>
        <P>
          A judge that scores its own model family higher than
          rivals is an A/B test you can&apos;t trust. A judge that
          rewards verbosity will hand you a feature that drifts
          from terse-and-correct to long-and-plausible over six
          months — and you&apos;ll never see the slide.
        </P>
        <JudgeCalibrate />
        <P>
          Move the strictness slider — verdict flips. Toggle the
          judge model — verdict flips again.{" "}
          <HL>The verdict is not a property of the output.</HL>{" "}
          It&apos;s a property of the (judge, rubric) pair,
          calibrated as a unit. The fix isn&apos;t a fancier model.
          The fix is sample-and-calibrate.
        </P>
        <Note summary="Yan&rsquo;s recipe — sample, blind, compare">
          Eugene Yan has the cleanest tactical version. Every
          week, sample 30 outputs the LLM-judge has scored. Have a
          human re-grade them blind. Compare. If the LLM-judge and
          the human agree to within four points on the rubric,
          you&apos;re calibrated. If not, you have a re-prompting
          afternoon ahead of you.
        </Note>
      </div>

      {/* §6 — The N=10 trap */}
      <div>
        <Dots />
        <SectionH2 eyebrow="6 · the picked sample" id="n10-trap">
          The N=10 trap.
        </SectionH2>
        <P>
          Four months in. The other team finally writes evals. Ten
          of them. Hand-picked by the engineer who wrote the prompt,
          on a Thursday, in the spirit of getting the ticket off the
          board. The model passes 10/10. They ship v2. They are
          fine.
        </P>
        <P>The dog has built a CSV. The room is still on fire.</P>
        <P>
          In production, v2 fails one prompt in four. The 10
          hand-picked examples were a self-portrait. Of course the
          model passed them — they were written by the same person
          who wrote the prompt the model is aligned to.{" "}
          <HL>You can&apos;t sample by intuition the failure modes you can&apos;t see.</HL>
        </P>
        <N10Trap />
        <P>
          The fix is mechanical and slightly humiliating: pull the
          eval set from real traffic. Failures first. Edge cases
          first. Out-of-scope queries first. The boring shippable
          cases never — those aren&apos;t the eval set, those are
          the regression test.
        </P>
        <P>
          A hand-picked eval set is a self-portrait, not a
          measurement. Its job is to <HL>surprise you.</HL> If it
          doesn&apos;t, you wrote it for comfort.
        </P>
      </div>

      {/* §7 — Six months in (closing image) */}
      <div>
        <Dots />
        <SectionH2 eyebrow="7 · six months in" id="closing-image">
          Six months in.
        </SectionH2>
        <P>
          Six months after the bifurcation, one team has a CSV with
          240 rows. Half labeled by humans, half by an LLM-judge
          calibrated weekly to within four points of the human
          panel. A regression suite that fires when the new prompt
          drops the customer-name token. A weekly hour where ten
          engineers stare at outputs and update the rubric. The
          product hasn&apos;t changed. The team&apos;s relationship
          to the product has.
        </P>
        <P>
          They <HL>stopped tasting their own wine.</HL> When they
          ship a prompt change, they don&apos;t debate whether
          it&apos;s better. They look at the CSV. Sometimes the CSV
          tells them no.
        </P>
        <P>
          The other team shipped v2 last week. Customers are
          complaining. The team is in a meeting trying to decide
          whether the complaints are real. The founder is on Slack
          saying it <Em>feels</Em> better. Nobody can answer the
          question, because nobody built the instrument that
          answers it.
        </P>
        <P>
          The point of evals isn&apos;t catching bugs, although they
          do. It isn&apos;t shipping faster, although you will.{" "}
          <HL>The point of evals is being able to tell the truth about your product</HL>{" "}
          — to yourself, to your team, to the next person who asks
          if your AI is okay.
        </P>
      </div>

      {/* §8 — A short codicil */}
      <div>
        <Dots />
        <SectionH2 eyebrow="8 · the codicil" id="monday">
          A short codicil — what to do Monday.
        </SectionH2>
        <P>
          The barrier has always been a CSV and the willingness to
          look. Six bullets, the entire practice:
        </P>
        <Callout>
          <ul
            className="pl-[var(--spacing-md)] list-disc flex flex-col gap-[var(--spacing-2xs)]"
            style={{ color: "var(--color-text)" }}
          >
            <li>
              <strong>Open a spreadsheet.</strong> Any spreadsheet.
              The one you already use is fine.
            </li>
            <li>
              <strong>Paste in 20 real prompts</strong> — not
              synthetic, not invented, not the ones you used to demo
              the feature. Real ones. From production. From the last
              week.
            </li>
            <li>
              <strong>Mark the borderline outputs.</strong> The ones
              you had to think about. The ones that <Em>almost</Em>{" "}
              shipped.
            </li>
            <li>
              <strong>Ask a teammate to grade them blind.</strong>{" "}
              Hide the model name. Hide the prompt version. Just the
              inputs and the outputs.
            </li>
            <li>
              <strong>Compare.</strong> Where you and your teammate
              disagree is your starting rubric.
            </li>
            <li>
              <strong>Repeat next sprint.</strong> The CSV grows.
              The rubric tightens. The model swaps. The CSV stays.
            </li>
          </ul>
        </Callout>
        <P>
          That&apos;s the whole craft. No framework to install. No
          platform to onboard. The industry will sell you both, and
          you may eventually need them, but you don&apos;t need them
          on Monday. <HL>Open the spreadsheet.</HL>
        </P>
      </div>

      <PostNavCards slug="evals-or-vibes" />
    </Prose>
  );
}
