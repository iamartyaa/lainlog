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
} from "@/components/prose";
import {
  FlowDemo,
  NormalisationMap,
  BloomProbe,
  SignupRace,
} from "./widgets";
import { metadata } from "./metadata";

export { metadata };

export default function HowGmailKnowsYourEmailIsTaken() {
  return (
    <Prose>
      <div className="pt-[var(--spacing-xl)]">
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
          lifts — the form says <Em>already taken</Em>. It doesn&apos;t feel like a check. It
          feels like Gmail already knew.
        </P>
        <P>
          Pick a scenario below and step through what actually happens. Then we&apos;ll zoom in
          on the parts that earn their keep.
        </P>
      </div>

      <FlowDemo />

      <div>
        <P>
          Three things to notice in the widget. First, the answer can come out of any of several
          layers — not just the database. Second, the very first thing the server does is
          rewrite your email into a form you didn&apos;t type. Third, whatever the flow above
          says while you&apos;re typing, it&apos;s not what decides anything when you actually
          click <Em>Sign up</Em>. We&apos;ll work through each.
        </P>
      </div>

      {/* §2 — Canonical form */}
      <div>
        <Dots />
        <H2>Your email gets rewritten</H2>
        <P>
          Before the accounts table is consulted, your address is lowered, stripped of dots in
          the local part, and trimmed of anything after a plus. So{" "}
          <Code>J.Ohn.Doe+promo@gmail.com</Code> becomes <Code>johndoe@gmail.com</Code>. That
          canonical string is what every layer below actually checks.
        </P>
      </div>

      <NormalisationMap />

      <div>
        <P>
          Google&apos;s own help docs confirm this for consumer <Code>@gmail.com</Code>{" "}
          addresses. It&apos;s why <Code>j.o.h.n.d.o.e@gmail.com</Code> can&apos;t register if{" "}
          <Code>johndoe@gmail.com</Code> already exists. The thing you typed was discarded.
        </P>
        <Aside>
          Workspace accounts — Google Workspace on a custom domain — don&apos;t follow this
          rule. Each tenant admin decides whether dots matter. Only consumer{" "}
          <Code>@gmail.com</Code> and <Code>@googlemail.com</Code> normalise this way.
        </Aside>
      </div>

      {/* §3 — The cache tier (the Redis question, answered honestly) */}
      <div>
        <Dots />
        <H2>Two caches before the database</H2>
        <P>
          A <Em>very</Em> common question about this flow: what&apos;s the cache doing in front
          of the database? Most real identity systems put at least one — often two — in-memory
          cache tiers between the request and the authoritative store, and Gmail is no
          exception.
        </P>
        <P>
          The first one is an <Em>in-process</Em> near-cache, right inside the Gaia frontend
          that handles your request. If the same canonical email was asked about in the last few
          seconds on the same shard (which happens a lot — popular names get typed constantly),
          the answer is still in memory. No further work.
        </P>
        <P>
          The second is a <Em>distributed</Em> cache that spans many frontends, so a warm
          answer from one shard can serve another. In the FlowDemo widget above, the{" "}
          <Em>someone just checked this name</Em> scenario lights this up: the request
          terminates at the near-cache and never reaches the Bloom filter or Spanner.
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
        <H2>The Bloom filter: a cheap, one-sided answer</H2>
        <P>
          When both caches miss, the server asks one more cheap thing before touching the
          database: a <Em>Bloom filter</Em>. A row of bits, all zero to start. When an account
          is created, a few hash functions of the canonical email each pick a bit, and those
          bits get flipped on. To check an email, hash it the same way and look at those bits:
          if any one of them is <Code>0</Code>, it&apos;s definitely not in the set. If
          they&apos;re all <Code>1</Code>, it <Em>might</Em> be.
        </P>
        <P>
          Step through a handful of inserts and queries below.
        </P>
      </div>

      <BloomProbe />

      <div>
        <P>
          The filter can lie about <Em>yes</Em>, never about <Em>no</Em>. A <Em>no</Em> alone is
          enough to answer the user — no database round-trip needed. A <Em>maybe</Em> has to go
          to Spanner to be sure.
        </P>
      </div>

      {/* §5 — The two paths after Bloom */}
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
            target for Spanner point reads is under 5 ms at the median. The only path that
            actually talks to the authoritative store.
          </li>
        </ul>
        <P>
          Scroll back to the top widget and switch between scenarios. The diagram re-routes to
          match.
        </P>
      </div>

      {/* §6 — Submit moment / race */}
      <div>
        <Dots />
        <H2>Submit — the check you didn&apos;t see</H2>
        <P>
          Everything above was the check that runs <Em>while you&apos;re typing</Em>. It&apos;s
          a UX hint, and it&apos;s allowed to be wrong, stale, or racing someone else.
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

      <div>
        <P>
          The winner is whichever INSERT Spanner committed first — not whichever user clicked
          Submit first in their browser. Both clients saw <Em>available</Em> while typing; only
          the database&apos;s serial ordering at commit decides who actually got the address.
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
        <H2>When it goes wrong: the Netflix dot-scam</H2>
        <P>
          The reason the rewrite step mattered is that other services don&apos;t always do it
          the same way Gmail does. In 2018, an engineer{" "}
          <A href="https://jameshfisher.com/2018/04/07/the-dots-do-matter-how-to-scam-a-gmail-user/">
            described a scam
          </A>{" "}
          that worked like this. An attacker signs up for Netflix using a dotted variant of
          your Gmail — say <Code>j.ohn.doe@gmail.com</Code> — with a bad card. Netflix treats
          the dotted version as a new customer, because Netflix doesn&apos;t normalise the way
          Gmail does. The card fails. Netflix sends <Em>you</Em> a polite email about it —
          both addresses land in your inbox. You, confused, helpfully pay.
        </P>
        <P>
          Google knew there was one canonical form; Netflix didn&apos;t. That gap is the attack
          surface. If you&apos;re storing emails, normalise on write, put your uniqueness
          constraint on the normalised column, and keep the raw version only for display.
        </P>
      </div>

      {/* §8 — Wrap */}
      <div>
        <Dots />
        <H2>Sticking the landing</H2>
        <P>
          So: a pause, a trip through Google&apos;s edge, a rewrite, two caches, a Bloom filter,
          maybe a database — and, at Submit, a real transaction against a uniqueness constraint
          that does the only check that actually matters. Two different questions on two
          different versions of your email. The fast one is for the UI. The slow one is for the
          truth.
        </P>
      </div>
    </Prose>
  );
}
