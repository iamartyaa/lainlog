/**
 * ChapterCliffhanger — closing block that loops chapter 2 forward to
 * chapter 3. Voice-profile §12.8 + ban on VerticalCutReveal: the closer
 * is still prose with one italic line, not a staggered reveal animation.
 *
 * Server component (no "use client"). Pure markup — no interactive layer.
 */

import Link from "next/link";

export function ChapterCliffhanger() {
  return (
    <section
      aria-label="next chapter"
      className="mt-[var(--spacing-2xl)]"
    >
      <p
        className="font-serif"
        style={{
          fontSize: "var(--text-body)",
          lineHeight: 1.65,
          color: "var(--color-text)",
          margin: 0,
        }}
      >
        We've drawn the topology. Three roles — host, client, server — and
        one connection between each client–server pair. Carry that picture
        forward; chapter 3 starts on top of it.
      </p>

      <p
        className="mt-[var(--spacing-md)] font-serif italic"
        style={{
          fontSize: "var(--text-medium)",
          color: "var(--color-text-muted)",
          lineHeight: 1.55,
          maxWidth: "55ch",
          margin: "var(--spacing-md) 0 0 0",
        }}
      >
        Now: what flows across each of those connections, and in what
        shape?
      </p>

      <p
        className="mt-[var(--spacing-lg)] font-mono"
        style={{
          fontSize: "var(--text-small)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--color-text-muted)",
          margin: 0,
        }}
      >
        chapter 3 ·{" "}
        <Link
          href="/courses/mcps/json-rpc-the-wire"
          className="no-underline hover:text-[color:var(--color-accent)]"
          style={{ color: "var(--color-text)" }}
        >
          JSON-RPC, the wire that carries it
          <span aria-hidden> →</span>
        </Link>
      </p>

      <p className="mt-[var(--spacing-md)] flex justify-center" aria-hidden>
        <span
          className="block"
          style={{
            width: 6,
            height: 6,
            background: "var(--color-accent)",
          }}
        />
      </p>
    </section>
  );
}

export default ChapterCliffhanger;
