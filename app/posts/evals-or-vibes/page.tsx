/**
 * Voice & tone note (do not "fix" without re-reading the brief):
 *
 *   tone: deliberate-deviation; see Checkpoint 2 of t-mo8rshv6dno5 brief
 *
 * This post intentionally deviates from the lainlog house voice. It is
 * funny, informal, slightly weary, and self-aware in the wine-criticism
 * register (Hamel / Maciej / Patrick McKenzie). Memes are allowed (cap 2).
 * Two MediaBetweenText slots are intentional, against the doc's
 * "one per article max" guidance — the user explicitly authorised the
 * second slot at Checkpoint 2.
 *
 * Pedagogy patterns deliberately NOT used (per user override):
 *   - No §0 premise-quiz opener.
 *   - No mechanism-first reframe.
 *   - No "many-views-of-one-mechanism" structure.
 *   - No <VerticalCutReveal> (banned site-wide).
 *
 * Bans honored:
 *   - No <HeroTile> on the article page (post-PR-#92 convention).
 *   - No <VerticalCutReveal>.
 *   - WidgetShell from @/components/viz/WidgetShell (not a post-local
 *     re-export).
 */
import {
  Prose,
  H1,
  H2,
  P,
  Callout,
  Aside,
  Dots,
  Em,
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
          You can&apos;t taste your own wine.
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

      {/* §1 — The day Cassidy hallucinated a school district */}
      <div>
        <Dots />
        <SectionH2 eyebrow="1 · the cold open" id="cold-open">
          The day Cassidy hallucinated a school district.
        </SectionH2>
        <P>
          Cassidy is an AI assistant for real-estate agents. She drafts
          listings, answers buyer chat, pulls comps. She is, by every
          internal metric, working great. The team has been shipping for
          two months. The founders have a weekly demo where Cassidy says
          something charming about a Craftsman in Logan Square and
          everyone in the Zoom laughs.
        </P>
        <P>
          On a Tuesday in March, a real customer — an agent in Oak Park —
          asks Cassidy to summarise a listing for a buyer. Cassidy says
          the property is in the highly-rated Lincoln Elementary district.
          The buyer is excited. The buyer&apos;s child is school-age. The
          listing is, in fact, in a different district. Lincoln Elementary
          isn&apos;t even close.
        </P>
        <P>
          That same week, Cassidy quotes the rent on a 2-bed walkup at
          $1,800. Two days later, asked about the same listing, Cassidy
          quotes the rent at $4,200. Same model. Same prompt. Same
          listing. Different reality.
        </P>
        <RentChipReveal />
        <P>
          Nobody on the team noticed. The founders found out from the
          customer, on a Friday, in a call that opened with the words{" "}
          <Em>&ldquo;is your AI okay?&rdquo;</Em>{" "}
          <HL>The author of the feature is the last person in the building to notice.</HL>{" "}
          Not because the team is bad. Because the team is involved. They
          test by re-running the prompt in the playground, watching it
          come back coherent, and shipping. The Tow Center for Digital
          Journalism graded eight major AI search engines on factual
          questions and clocked them collectively wrong on more than 60%
          of queries — confidently, articulately, in full sentences. This
          isn&apos;t the edge case. This is the median Tuesday.
        </P>
        <P>
          So how would you know? How would <Em>anyone</Em> know? That&apos;s
          the question the rest of this post is about.
        </P>
      </div>

      {/* §2 — Two teams, same product, no evals */}
      <div>
        <Dots />
        <SectionH2 eyebrow="2 · the bifurcation" id="two-teams">
          Two teams. Same product. No evals — yet.
        </SectionH2>
        <P>
          Imagine two parallel companies, both shipping Cassidy. Six
          engineers each. Same spec, same starting prompt, same model API.
          For the first quarter they are functionally identical. They
          ship the same way: open the playground, paste a prompt, eyeball
          it, ship.
        </P>
        <P>
          They tested it the way you test whether the milk has gone off —
          briefly, by feel, with one nostril and a slight grimace. They
          told themselves this was due diligence. It was not. It was{" "}
          <HL>vibes auto-correlated with hope.</HL>
        </P>
        <P>
          Here is the wine-criticism cliché the rest of this piece is
          built on: when serious wine people decide whether a $15 bottle
          is better than a $200 one, they don&apos;t pour their own glass
          and stare at the label. They blind-taste. Multiple judges.
          Pre-defined rubric. Repeatable protocol. They do this because
          they know the human in front of the wine — looking at the
          label, knowing what was paid for it, knowing whose name is on
          the cellar — is the worst judge of the wine. Not because the
          human is bad. Because the human is involved.
        </P>
        <P>
          A team running their own LLM through the playground is the wine
          reviewer who poured their own glass and is gazing fondly at the
          label. They are, structurally, the least qualified person in the
          building to grade the output. <HL>You can&apos;t taste your own wine.</HL>
        </P>
        <P>
          The fix is the same fix the wine industry settled on a century
          ago: <Term>evals</Term>. A blind tasting protocol for your LLM
          feature. Pre-registered rubric. Multiple judges. Outputs scored
          before anyone sees the label. Run on every prompt change, every
          model swap, every Friday afternoon when the founder thinks of a
          &ldquo;small tweak.&rdquo; That&apos;s it. That&apos;s the whole
          mechanism.
        </P>
        <P>
          The widget below makes the gap concrete. Five Cassidy outputs.
          Read each, decide ship or cut by gut. Then we reveal what a
          rubric thinks. The shape of the disagreement is the shape of
          the problem.
        </P>
        <VibesVsRubric />
        <P>
          The gap is rarely in the obvious mistakes. Vibes can spot the
          obvious mistakes — that&apos;s why team morale was high. The
          gap lives in the outputs that <Em>read</Em> shippable but flunk
          one of the criteria you weren&apos;t actively scanning for.
          Factual? Yes. In-scope? You didn&apos;t check. On-voice? You
          weren&apos;t asked. Safe? You forgot we had a policy on that.
        </P>
      </div>

      {/* §3 — Day three, somebody opens a CSV */}
      <div>
        <Dots />
        <SectionH2 eyebrow="3 · the act" id="open-the-csv">
          Day three, somebody opens a CSV.
        </SectionH2>
        <P>
          The two teams are still functionally identical. Then, on day
          three of the second quarter, both teams hit the same edge case
          on the same morning. Cassidy claims a listing has hardwood
          floors. The input data says laminate.
        </P>
        <P>
          Team Vibes reads the output, shrugs, says &ldquo;close
          enough,&rdquo; and ships. Team Vibes is fine. Team Vibes is{" "}
          <Em>always</Em> fine. Team Vibes is fine the way the dog in the
          burning room is fine.
        </P>
        <P>
          Team Evals opens a CSV. They put the prompt in column A. The
          actual output in column B. The expected output in column C. A
          one-line comment in column D — &ldquo;hardwood vs laminate;
          flooring hallucination.&rdquo; Then they paste in eleven more
          borderline outputs from the morning. By Friday they have an
          eval set.
        </P>
        <P>
          That&apos;s it. That&apos;s the entire bifurcation. From this
          moment on, the two teams diverge in ways that compound. Eugene
          Yan calls building product evals{" "}
          <HL>the scientific method in disguise</HL>: observe, annotate,
          hypothesize, experiment, measure. The CSV is the disguise. The
          scientific method is the <Em>annotate</Em> column.
        </P>
        <EvalSetBuilder />
        <P>
          An eval set isn&apos;t a tool. It&apos;s a habit. The first row
          in the CSV is the act that distinguishes the two teams forever.
          Hamel Husain has been making this point for years and his
          specific framing of it is the one that actually moves people:{" "}
          <Em>
            you are doing it wrong if you aren&apos;t looking at lots of
            data.
          </Em>{" "}
          You can replace every other piece of advice in this post and
          that one stays.
        </P>
      </div>

      {/* §4 — A 100% pass rate is a failing grade */}
      <div>
        <Dots />
        <SectionH2 eyebrow="4 · the saturation trap" id="saturation">
          A 100% pass rate is a failing grade.
        </SectionH2>
        <P>
          Two months in. Team Evals has 50 prompts in the CSV. Half are
          regressions caught from real traffic. Half are easy synthetic
          ones the engineer made up while sipping coffee. The full suite
          passes. Every Monday it passes. Every Friday it passes. The
          team feels great. They have entered the most dangerous phase of
          eval-writing, which is{" "}
          <HL>the phase where the evals tell you what you want to hear.</HL>
        </P>
        <P>
          Then a customer reports Cassidy hallucinated a school district.
          The eval suite — the one passing 100% — didn&apos;t catch it.
          Because the suite is full of easy examples the prompt could
          already pass. It hadn&apos;t been challenged in weeks.
        </P>
        <P>
          Simon Willison has the cleanest line on this:{" "}
          <Em>
            &ldquo;If you&apos;re passing 100% of your evals, you&apos;re
            likely not challenging your system enough.&rdquo;
          </Em>{" "}
          The Anthropic evals literature is even blunter: the term of art
          is <Term>eval saturation</Term>, the moment the suite stops
          giving signal. Every wine on your panel scored 95.{" "}
          <BallotChipReveal />
        </P>
        <P>
          The fix is to keep adding hard prompts. Ones the model fails
          on. Ones that came from the last incident report. Ones a
          competitor&apos;s release surfaced. <HL>Eval sets are not done
          when they pass.</HL> They are done when they break in
          interesting ways.
        </P>
        <PassRateOverTime />
        <P>
          The widget shows what saturation looks like in the wild — the
          line climbs to 100% and stays there, while a customer-incident
          dot appears in the corner like a cigarette burn on a tablecloth.
          Pressing &ldquo;add hard prompts&rdquo; drops the line to 78%
          and the suite starts giving signal again. 78% is not a problem.
          78% is the suite doing its job. 100% is the suite not doing
          its job.
        </P>
        <P>
          A coffee-table book is a beautiful object. A coffee-table book
          is also not a measurement. An eval that always passes has
          stopped being an eval. It is a coffee-table book.
        </P>
      </div>

      {/* §5 — LLM-as-judge has a palate too */}
      <div>
        <Dots />
        <SectionH2 eyebrow="5 · the calibration" id="judge">
          LLM-as-judge has a palate too.
        </SectionH2>
        <P>
          Three months in. Team Evals has 240 prompts. They cannot keep
          manually grading 240 outputs after every prompt change. So they
          do what every team does: they hire an LLM as their grader. It&apos;s
          fast. It scales. It is also, in interesting ways, wrong.
        </P>
        <P>
          Lilian Weng has catalogued the failure modes of LLM-as-judge in
          uncomfortable detail. The judge prefers verbose outputs. The
          judge scores its own model family higher. The judge
          sycophantically agrees with whatever the question framing
          implies. The judge has, in short, <HL>a palate.</HL> It
          inherited the palate from training, the same way you inherited
          yours from your aunt. You cannot un-train it. You can only
          calibrate around it.
        </P>
        <P>
          The wine-criticism callback writes itself: you can&apos;t
          replace the human panel with a robot panel that&apos;s never
          tasted a real wine. You have to take the robot to a tasting and
          tell it which is the $200 bottle and which is the $15. You do
          this for a few hundred bottles, on a regular cadence, forever.
          That&apos;s the deal.
        </P>
        <JudgeCalibrate />
        <P>
          The widget makes the lesson literal. Move the strictness slider
          and the verdict flips. Toggle the judge model and the verdict
          flips again. <HL>The verdict is not a property of the output.</HL>{" "}
          It is a property of the (judge, rubric) pair, calibrated as a
          unit. The fix isn&apos;t a fancier model. The fix is{" "}
          <Em>calibration, not a fancier model</Em> — sample, label,
          align, repeat.
        </P>
        <Aside>
          Yan has the cleanest tactical version: every week, sample 30
          outputs the LLM-judge has scored. Have a human re-grade them
          blind. Compare. If the LLM-judge and the human agree to within
          four points on the rubric, you&apos;re calibrated. If not, you
          have a re-prompting afternoon ahead of you.
        </Aside>
      </div>

      {/* §6 — The N=10 trap */}
      <div>
        <Dots />
        <SectionH2 eyebrow="6 · the picked sample" id="n10-trap">
          The N=10 trap.
        </SectionH2>
        <P>
          Four months in. Team Vibes finally writes evals. Ten of them.
          Hand-picked, by the engineer who wrote the prompt, on a Thursday
          afternoon, in the spirit of getting the eval ticket off the
          board. Cassidy passes 10/10. Team Vibes ships v2. Team Vibes is
          fine.
        </P>
        <P>
          The dog has built a CSV. The room is still on fire.
        </P>
        <P>
          In production, v2 fails 1 in 4 prompts. The 10 hand-picked
          examples in the eval set were the engineer&apos;s mental model
          of &ldquo;the kind of prompt customers send.&rdquo; That mental
          model was the prompt-writer&apos;s view of the world, which is
          the view that produced the prompt, which is the view the model
          is already aligned to. The hand-picked eval set was, in effect,
          a self-portrait. <HL>You can&apos;t sample by intuition the
          failure modes you can&apos;t see.</HL>
        </P>
        <N10Trap />
        <P>
          The fix is mechanical and slightly humiliating: pull the eval
          set from real traffic. Failures first. Edge cases first.
          Out-of-scope queries first. The boring shippable cases never —
          those are not the eval set, those are the regression test.
          Anthropic publishes pass@k vs pass^k metrics for exactly this
          reason; the question is not how often the agent <Em>can</Em>{" "}
          succeed, the question is how often the agent <Em>does</Em>, on
          the prompts it actually sees.
        </P>
        <P>
          A hand-picked eval set is a self-portrait, not a measurement.
          The eval set&apos;s job is to{" "}
          <HL>surprise you.</HL> If it doesn&apos;t, you wrote it for
          comfort.
        </P>
      </div>

      {/* §7 — Six months in (closing image) */}
      <div>
        <Dots />
        <SectionH2 eyebrow="7 · six months in" id="closing-image">
          Six months in.
        </SectionH2>
        <P>
          Six months after the bifurcation, Team Evals has 240 prompts in
          a CSV. Half labeled by humans, half by an LLM-judge calibrated
          to within four points of the human panel. A regression suite
          that fires when the new prompt drops the customer-name token. A
          weekly cadence where ten engineers spend an hour staring at
          outputs and updating the rubric. The product hasn&apos;t
          changed. Cassidy still drafts listings, still answers chat,
          still pulls comps. The team&apos;s relationship to the product
          has changed.
        </P>
        <P>
          They <HL>stopped tasting their own wine.</HL> When they ship a
          prompt change, they don&apos;t debate whether it&apos;s better.
          They look at the CSV. The CSV tells them. Sometimes it tells
          them no.
        </P>
        <P>
          Team Vibes shipped a v2 last week. Customers are complaining.
          The team is in a meeting trying to decide whether the
          complaints are real. The founder is on Slack saying it{" "}
          <Em>feels</Em> better in the playground. Nobody on Team Vibes
          can tell whether v2 is better than v1, because the team has
          built no instrument that can answer that question. They have
          opinions. They are pouring their own glass. They are looking at
          the label.
        </P>
        <P>
          The point of evals isn&apos;t catching bugs, although they do
          catch bugs. The point of evals isn&apos;t even shipping faster,
          although Team Evals ships about three times more often than
          Team Vibes. <HL>The point of evals is being able to tell the
          truth about your product</HL> — to yourself, to your team, to
          the next person who asks if your AI is okay.
        </P>
      </div>

      {/* §8 — A short codicil */}
      <div>
        <Dots />
        <SectionH2 eyebrow="8 · the codicil" id="monday">
          A short codicil — what to do Monday.
        </SectionH2>
        <P>
          The barrier to entry has always been a CSV and the willingness
          to look. Here, in six bullets, is the entire practice.
        </P>
        <Callout>
          <ul
            className="pl-[var(--spacing-md)] list-disc flex flex-col gap-[var(--spacing-2xs)]"
            style={{ color: "var(--color-text)" }}
          >
            <li>
              <strong>Open a spreadsheet.</strong> Any spreadsheet. The
              one you already use is fine.
            </li>
            <li>
              <strong>Paste in 20 real prompts</strong> — not synthetic,
              not invented, not the ones you used to demo the feature.
              Real ones. From production. From the last week.
            </li>
            <li>
              <strong>Mark the borderline outputs.</strong> The ones you
              had to think about. The ones that <Em>almost</Em> shipped.
            </li>
            <li>
              <strong>Ask a teammate to grade them blind.</strong> Hide
              the model name. Hide the prompt version. Just the inputs
              and the outputs.
            </li>
            <li>
              <strong>Compare.</strong> Where you and your teammate
              disagree is your starting rubric.
            </li>
            <li>
              <strong>Repeat next sprint.</strong> The CSV grows. The
              rubric tightens. The model swaps. The CSV stays.
            </li>
          </ul>
        </Callout>
        <P>
          That&apos;s it. That&apos;s the whole craft. There is no
          framework to install. There is no platform to onboard. The
          industry will sell you both, and you may eventually need them,
          but you don&apos;t need them on Monday. <HL>Open the spreadsheet.</HL>
        </P>
      </div>

      <PostNavCards slug="evals-or-vibes" />
    </Prose>
  );
}
