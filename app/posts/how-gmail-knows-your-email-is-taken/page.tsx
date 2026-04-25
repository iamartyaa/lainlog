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
} from "@/components/prose";
import { PostBackLink } from "@/components/nav/PostBackLink";
import { PostNavCards } from "@/components/nav/PostNavCards";
import { TextHighlighter } from "@/components/fancy";
import {
  TypingPause,
  NormaliseWalk,
  CacheWalk,
  BloomProbe,
  SignupRace,
  NetflixSplit,
} from "./widgets";
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

export default function HowGmailKnowsYourEmailIsTaken() {
  return (
    <Prose>
      <div className="pt-[var(--spacing-xl)]">
        <PostBackLink />
        <div className="mt-[var(--spacing-md)] mb-[var(--spacing-md)] hidden md:flex flex-col items-start gap-[var(--spacing-md)] lg:flex-row lg:items-end">
          <HeroTile slug="how-gmail-knows-your-email-is-taken" />
        </div>
        <H1 style={{ fontSize: "clamp(2.5rem, 2rem + 3.5vw, 4rem)" }}>
          How instant email-availability checks work
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
          <span>14 min read</span>
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

        {/* §1 — Lede */}
        <P>
          You type an email on the Gmail sign-up page, reach for Tab, and — before your finger
          lifts — the form says <HL>already taken</HL>. It feels like Gmail already knew.
        </P>
        <P>
          It didn&apos;t. There&apos;s no magic; there&apos;s a pipeline. Six small things happen
          between your last keystroke and that red text. Each one is cheap. Each one can answer
          on its own and exit early. The slowest of them — a real read against the database —
          almost never runs while you&apos;re typing.
        </P>
        <P>We&apos;ll walk it stage by stage, with a small interactive at every step.</P>
      </div>

      {/* §2 — The pause */}
      <div>
        <Dots />
        <H2>It&apos;s not one request per keystroke.</H2>
        <P>
          The first thing to notice is the part you can&apos;t see: the silence. Each character
          you type doesn&apos;t fire a check. Instead the page waits about{" "}
          <Code>300 ms</Code> after your last keystroke, and only then sends one request — for
          the entire address, all at once.
        </P>
        <P>
          The technique has a dull name (<Em>debounce</Em>) and a load-bearing job. Without it,
          a ten-character email would mean ten round-trips to a Google data centre, nine of
          which the server would happily answer about a string nobody finished typing yet. With
          it, the back-end gets one well-formed question per pause.
        </P>
      </div>

      <TypingPause />

      <div className="pt-[var(--spacing-md)]">
        <P>
          Tap <Em>+&nbsp;keystroke</Em>{" "}mid-wait and watch the timer reset to zero. Every new key
          throws away the previous wait. The request only fires when you actually stop. The rest
          of the article describes what happens in those ~300 ms — but{" "}
          <HL>nothing in the rest of the article runs until the timer hits zero</HL>.
        </P>
      </div>

      {/* §3 — Normalisation */}
      <div>
        <Dots />
        <H2>Your email is not the email the server checks.</H2>
        <P>
          Once the request arrives, the very first thing the server does is rewrite your address
          into a different one. <Code>J.Ohn.Doe+promo@gmail.com</Code> becomes{" "}
          <Code>johndoe@gmail.com</Code>. That second string — the <Em>canonical form</Em> — is
          what every layer below the Gaia front-end actually checks. The thing you typed is
          discarded; only its canonical version exists from this point on.
        </P>
        <P>
          The rewrite is three deterministic steps applied in order. Step through the widget
          below to watch each rule fire on the messy address.
        </P>
      </div>

      <NormaliseWalk />

      <div className="pt-[var(--spacing-md)]">
        <P>
          One canonical form means many possible spellings of your address all collapse to the
          same row. It&apos;s also why <Code>j.o.h.n.d.o.e@gmail.com</Code> can&apos;t register
          if <Code>johndoe@gmail.com</Code> already exists.{" "}
          <HL>The thing you typed was discarded.</HL>
        </P>
        <Aside>
          Workspace addresses — Google Workspace on a custom domain — don&apos;t follow this
          rule. Each tenant admin decides whether dots and +tags collapse. Only consumer{" "}
          <Code>@gmail.com</Code> and <Code>@googlemail.com</Code> normalise this way.
        </Aside>
      </div>

      {/* §4 — Caches */}
      <div>
        <Dots />
        <H2>Most of the time, the answer is already in memory.</H2>
        <P>
          With a canonical form in hand, the server now has to actually look it up. Before it
          touches anything as expensive as a database, it asks two cheaper places first.
        </P>
        <P>
          The first is an <Em>in-process</Em>{" "}near-cache, sitting in RAM inside the Gaia
          front-end shard that handles your request. If the same canonical email was asked
          about in the last few seconds on the same shard — popular names get typed
          constantly — the answer is right there in process memory. No further work.
        </P>
        <P>
          The second is a <Em>distributed</Em>{" "}cache that spans many front-end shards. A warm
          answer from one shard can serve another. Pick a locality below and step through the
          two lookups; you&apos;ll see exactly where each kind of request exits.
        </P>
      </div>

      <CacheWalk />

      <div className="pt-[var(--spacing-md)]">
        <Callout tone="note">
          Google&apos;s internal stack uses in-house Memcache-class caches (see{" "}
          <A href="https://research.google/pubs/zanzibar-googles-consistent-global-authorization-system/">
            Zanzibar
          </A>
          &apos;s Leopard), not Redis. Outside Google it&apos;s usually{" "}
          <A href="https://engineering.shopify.com/blogs/engineering/identitycache-improving-performance-one-cached-model-at-a-time">
            Memcached
          </A>{" "}
          or Redis — different names, same job.
        </Callout>
      </div>

      {/* §5 — Bloom filter */}
      <div>
        <Dots />
        <H2>The filter can lie about yes, never about no.</H2>
        <P>
          When both caches miss, the server still doesn&apos;t go to the database. It asks one
          more cheap thing first: a <Em>Bloom filter</Em>. A row of bits, all zero. When an
          account is created, a few hash functions of the canonical email each pick a bit, and
          those bits are flipped on. To check an email, hash it the same way and look at those
          bits: if any one of them is <Code>0</Code>, the address is{" "}
          <HL>definitely not in the set</HL>. If they&apos;re all <Code>1</Code>, it might be —
          and the server has to actually look.
        </P>
        <P>
          Step through a handful of inserts and queries below. Two of the queries find a match;
          one of those matches is real, one is a coincidence — a <Em>false positive</Em>.
        </P>
      </div>

      <BloomProbe />

      <div className="pt-[var(--spacing-md)]">
        <P>
          A <Em>no</Em>{" "}from the filter is the only stop sign on the whole pipeline. It saves
          a database round-trip every time it fires, and most checks fire it: most of the
          addresses people type while signing up are not, in fact, taken. A maybe pays the
          database. The asymmetry is the entire reason the filter is here.
        </P>
      </div>

      {/* §6 — Four exits */}
      <div>
        <Dots />
        <H2>Four answers to one question.</H2>
        <P>
          Put those layers together and a single check has four possible exits, in increasing
          cost:
        </P>
        <ul
          className="mt-[var(--spacing-sm)] pl-[var(--spacing-md)] list-disc flex flex-col gap-[var(--spacing-2xs)]"
          style={{ color: "var(--color-text)" }}
        >
          <li>
            <Em>Near-cache hit</Em> — a few microseconds. The fastest path.
          </li>
          <li>
            <Em>Distributed-cache hit</Em> — a millisecond or two. Still fast.
          </li>
          <li>
            <Em>Bloom filter says no</Em> — a couple of milliseconds, no database trip.
          </li>
          <li>
            <Em>Bloom filter says maybe</Em> — point-read on Spanner. Google&apos;s published
            target for Spanner point reads is under 5 ms at the median.{" "}
            <HL>The only path that actually talks to the authoritative store.</HL>
          </li>
        </ul>
        <P>Four answers to one question. Only one of them ever asks the database.</P>
        <P>
          And here&apos;s the part that&apos;s easy to miss: every one of those four answers is
          a hint, not a verdict. They&apos;re what the UI uses to colour the text red while
          you&apos;re typing. None of them actually decides whether the account gets created.
        </P>
      </div>

      {/* §7 — Submit / race */}
      <div>
        <Dots />
        <H2>Submit — the check you didn&apos;t see</H2>
        <P>
          When you actually click Sign up, a different thing happens. A database transaction
          tries to <Code>INSERT</Code> a new row keyed on your canonical email, against a column
          with a uniqueness constraint enforced by Spanner itself. If another person&apos;s
          transaction committed first, yours fails with a constraint violation and the server
          returns <Code>EMAIL_EXISTS</Code> — the official &ldquo;someone else already owns this
          canonical email&rdquo; signal, which is what the UI renders as <Em>already taken</Em>.
        </P>
        <P>
          The pre-check (cache, Bloom, point-read) is a UX hint. It is allowed to be wrong,
          stale, or racing someone else. Drag the two sliders below to set when each user
          clicks Submit, and watch the database resolve the race.
        </P>
      </div>

      <SignupRace />

      <div className="pt-[var(--spacing-md)]">
        <P>
          The winner is whichever <Code>INSERT</Code> Spanner committed first —{" "}
          <HL>not whichever user clicked Submit first</HL> in their browser. Both clients saw{" "}
          <Em>available</Em>{" "}while typing; only the database&apos;s serial ordering at commit
          decides who actually got the address.
        </P>
        <Callout tone="note">
          The one rule to remember: <strong>the pre-check is for UX. The uniqueness constraint
          at <Code>INSERT</Code> time is for truth.</strong> If you&apos;re building something
          similar, put the constraint in the database and let the <Code>INSERT</Code> fail —
          never rely on a check-then-insert in application code.
        </Callout>
      </div>

      {/* §8 — Netflix dot-scam */}
      <div>
        <Dots />
        <H2>Other services don&apos;t normalise. That&apos;s the attack surface.</H2>
        <P>
          The reason the rewrite step in §3 mattered isn&apos;t pedagogical. It&apos;s
          economic. The rest of the web doesn&apos;t do it. Most services treat your typed
          string as the address, period. Gmail stores one canonical row; Netflix stores
          whatever you typed.
        </P>
        <P>
          In 2018, an engineer{" "}
          <A href="https://jameshfisher.com/2018/04/07/the-dots-do-matter-how-to-scam-a-gmail-user/">
            described a scam
          </A>{" "}
          that exploits exactly this gap. An attacker signs up for Netflix using a dotted
          variant of your Gmail — say <Code>j.ohn.doe@gmail.com</Code> — with a stolen card.
          Netflix treats the dotted version as a brand-new customer; the card fails; Netflix
          sends <Em>you</Em>{" "}— or what Gmail thinks is you — a polite email about the
          payment problem. You, confused, helpfully add a real card.
        </P>
      </div>

      <NetflixSplit />

      <div className="pt-[var(--spacing-md)]">
        <P>
          Two parsers, one inbox. Same address, two accounts. Both are technically right by
          their own rules. The damage happens in the gap between their rules.{" "}
          <HL>That gap is the attack surface.</HL>
        </P>
        <P>
          If you&apos;re storing emails in something you operate: normalise on write, put your
          uniqueness constraint on the normalised column, and keep the raw version only for
          display. Make your service one of the ones that closed the gap.
        </P>
      </div>

      {/* §9 — Closer */}
      <div>
        <Dots />
        <H2>Two questions, two versions of your email.</H2>
        <P>
          Everything you saw while typing is a hint. The one thing the database is asked at
          submit time is the verdict. Two different questions, on two different versions of
          your email — neither of which is exactly the string you typed.
        </P>
        <P>The fast one is for the UI. The slow one is for the truth.</P>
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
      <PostNavCards slug="how-gmail-knows-your-email-is-taken" />
    </Prose>
  );
}
