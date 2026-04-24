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
import { TextHighlighter, VerticalCutReveal } from "@/components/fancy";
import {
  FlowDemo,
  NormalisationMap,
  BloomProbe,
  SignupRace,
} from "./widgets";
import { metadata } from "./metadata";

export { metadata };

const HL_TRANSITION = { type: "spring" as const, duration: 0.9, bounce: 0 };
const HL_COLOR = "color-mix(in oklab, var(--color-accent) 28%, transparent)";
const HL_OPTS = { once: true, initial: false, amount: 0.55 } as const;

/** Highlight a load-bearing phrase. Default ltr swipe, spring, inView once. */
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
        <div className="mb-[var(--spacing-md)] hidden md:flex flex-col items-start gap-[var(--spacing-md)] lg:flex-row lg:items-end">
          <HeroTile slug="how-gmail-knows-your-email-is-taken" />
        </div>
        <H1 style={{ fontSize: "clamp(2.5rem, 2rem + 3.5vw, 4rem)" }}>
          How Gmail knows your email is taken, instantly
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
          <span>12 min read</span>
        </p>

        {/* §1 — Scene */}
        <P>
          You type an email on the Gmail sign-up page, reach for Tab, and — before your finger
          lifts — the form says <HL>already taken</HL>. It feels like Gmail already knew.
        </P>
        <P>
          Pick a scenario below and step through what actually happens. Then we&apos;ll zoom in
          on the parts that earn their keep.
        </P>
      </div>

      <FlowDemo />

      <div className="pt-[var(--spacing-md)]">
        <P>
          Three things to notice in the widget. First, the answer can come out of any of several
          layers — not just the database. Second, the very first thing the server does is{" "}
          <HL>rewrite your email into a form you didn&apos;t type</HL>. Third, whatever the flow
          above says while you&apos;re typing, it&apos;s not what decides anything when you
          actually click <Em>Sign up</Em>. We&apos;ll work through each.
        </P>
      </div>

      {/* §2 — Canonical form */}
      <div>
        <Dots />
        <H2>The thing you typed is not what gets checked.</H2>
        <P>
          Before the accounts table is consulted, your address is lowered, stripped of dots in
          the local part, and trimmed of anything after a plus. So{" "}
          <Code>J.Ohn.Doe+promo@gmail.com</Code> becomes <Code>johndoe@gmail.com</Code>. That
          canonical string is what every layer below actually checks.
        </P>
      </div>

      <NormalisationMap />

      <div className="pt-[var(--spacing-md)]">
        <P>
          Google&apos;s own help docs confirm this for consumer <Code>@gmail.com</Code>{" "}
          addresses. It&apos;s why <Code>j.o.h.n.d.o.e@gmail.com</Code> can&apos;t register if{" "}
          <Code>johndoe@gmail.com</Code> already exists.{" "}
          <HL>The thing you typed was discarded.</HL>
        </P>
        <Aside>
          Workspace accounts — Google Workspace on a custom domain — don&apos;t follow this
          rule. Each tenant admin decides whether dots matter. Only consumer{" "}
          <Code>@gmail.com</Code> and <Code>@googlemail.com</Code> normalise this way.
        </Aside>
      </div>

      {/* §3 — The cache tier */}
      <div>
        <Dots />
        <H2>Most requests never reach the database.</H2>
        <P>
          The first stop is an <Em>in-process</Em>{" "}near-cache, right inside the Gaia frontend
          that handles your request. If the same canonical email was asked about in the last few
          seconds on the same shard — popular names get typed constantly —{" "}
          <HL>the answer is still in memory</HL>. No further work.
        </P>
        <P>
          The second is a distributed cache that spans many frontends, so a warm answer from one
          shard can serve another. In the FlowDemo widget above, the{" "}
          <Em>someone just checked this name</Em>{" "}scenario lights this up: the request{" "}
          <HL>never reaches the Bloom filter or Spanner</HL>.
        </P>
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

      {/* §4 — Bloom filter */}
      <div>
        <Dots />
        <H2>The filter can lie about yes, never about no.</H2>
        <P>
          When both caches miss, the server asks one more cheap thing before touching the
          database: a <Em>Bloom filter</Em>. A row of bits, all zero. When an account is
          created, a few hash functions pick a few of those bits and flip them on. To check an
          email, hash it the same way and look at those bits: if any one of them is{" "}
          <Code>0</Code>, it&apos;s <HL>definitely not in the set</HL>. If they&apos;re all{" "}
          <Code>1</Code>, it <Em>might</Em>{" "}be.
        </P>
        <P>Step through a handful of inserts and queries below.</P>
      </div>

      <BloomProbe />

      <div className="pt-[var(--spacing-md)]">
        <P>
          A <Em>no</Em>{" "}answers the user. A maybe pays the database. The asymmetry is the
          whole reason the filter pays rent.
        </P>
      </div>

      {/* §5 — The four paths */}
      <div>
        <Dots />
        <H2>Three fast paths, one slow one</H2>
        <P>
          Put those pieces together. The same request can end at four different places
          depending on what each layer knows:
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
            <Em>Bloom filter says no</Em> — a couple of milliseconds. Saves the database trip
            entirely.
          </li>
          <li>
            <Em>Bloom filter says maybe</Em> — point-read on Spanner. Google&apos;s published
            target for Spanner point reads is under 5 ms at the median.{" "}
            <HL>The only path that actually talks to the authoritative store.</HL>
          </li>
        </ul>
        <P>Four answers to one question. Only one of them ever asks the database.</P>
      </div>

      {/* §6 — Submit / race */}
      <div>
        <Dots />
        <H2>Submit — the check you didn&apos;t see</H2>
        <P>
          Everything above was the check that runs <Em>while you&apos;re typing</Em>. It&apos;s
          a UX hint, and it&apos;s <HL>allowed to be wrong, stale, or racing someone else</HL>.
        </P>
        <P>
          When you actually click Sign up, a different thing happens. A database transaction
          tries to <Code>INSERT</Code> a new row keyed on your canonical email, against a column
          with a uniqueness constraint enforced by Spanner itself. If another person&apos;s
          transaction committed first, yours fails with a constraint violation and the server
          returns <Code>EMAIL_EXISTS</Code> — the official &ldquo;someone else already owns this
          canonical email&rdquo; signal, which is what the UI renders as <Em>already taken</Em>.
          Try it below with the two sliders.
        </P>
      </div>

      <SignupRace />

      <div className="pt-[var(--spacing-md)]">
        <P>
          The winner is whichever INSERT Spanner committed first —{" "}
          <HL>not whichever user clicked Submit first</HL> in their browser. Both clients saw{" "}
          <Em>available</Em>{" "}while typing; only the database&apos;s serial ordering at commit
          decides who actually got the address.
        </P>
        <Callout tone="note">
          The one rule to remember: the pre-check (cache, Bloom, point-read) is for UX. The
          uniqueness constraint at INSERT time is for truth. If you&apos;re building something
          similar, put the constraint in the database and let the INSERT fail — never rely on a
          check-then-insert in application code.
        </Callout>
      </div>

      {/* §7 — Netflix dot-scam */}
      <div>
        <Dots />
        <H2>Other services don&apos;t normalise. That&apos;s the attack surface.</H2>
        <P>
          The reason the rewrite step mattered is that other services don&apos;t always do it
          the same way Gmail does. In 2018, an engineer{" "}
          <A href="https://jameshfisher.com/2018/04/07/the-dots-do-matter-how-to-scam-a-gmail-user/">
            described a scam
          </A>{" "}
          that worked like this. An attacker signs up for Netflix using a dotted variant of
          your Gmail — say <Code>j.ohn.doe@gmail.com</Code> — with a bad card. Netflix treats
          the dotted version as a new customer, because Netflix doesn&apos;t normalise the way
          Gmail does. The card fails. Netflix sends <Em>you</Em>{" "}a polite email about it —
          both addresses land in your inbox. You, confused, helpfully pay.
        </P>
        <P>
          <HL>Google knew there was one canonical form; Netflix didn&apos;t.</HL> If you&apos;re
          storing emails, normalise on write, put your uniqueness constraint on the normalised
          column, and keep the raw version only for display.
        </P>
      </div>

      {/* §8 — Closer */}
      <div>
        <Dots />
        <H2>Two questions, two versions of your email.</H2>
        <P>
          <VerticalCutReveal
            useInViewOptions={{ once: true, amount: 0.55 }}
            staggerDuration={0.035}
          >
            The fast one is for the UI. The slow one is for the truth.
          </VerticalCutReveal>
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
