import { Prose, H1, H2, P, Code, Callout, Dots } from "@/components/prose";
import { metadata } from "./metadata";

export { metadata };

export default function HowBloomFiltersWork() {
  return (
    <Prose>
      <div className="pt-[var(--spacing-xl)]">
        <H1>How Bloom Filters Work</H1>
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

        <P>
          This post is a <Code>stub</Code> — Step 9 will fill in the real narrative and ship three
          custom widgets (<Code>HashLane</Code>, <Code>BitArray</Code>, <Code>FalsePositiveLab</Code>).
          The shell around it — typography, tokens, header, OG image, RSS — is fully live.
        </P>

        <Callout tone="note">
          If you&apos;re reading this on the deployed site, the build passed and the design system
          is wired up end-to-end. Next up: widget implementations + prose voice.
        </Callout>

        <Dots />

        <H2>What&apos;s on the way</H2>
        <P>
          An interactive walk through insert, query, and collision — with a scrub-linked FNV-1a
          reference implementation at the end, and a parameter lab for the{" "}
          <Code>{"(1 - e^(-kn/m))^k"}</Code> false-positive formula.
        </P>
      </div>
    </Prose>
  );
}
