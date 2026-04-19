import Link from "next/link";

export function Footer() {
  return (
    <footer
      className="mt-[var(--spacing-3xl)] border-t px-[var(--spacing-lg)] py-[var(--spacing-lg)] font-mono"
      style={{
        borderColor: "var(--color-rule)",
        fontSize: "var(--text-small)",
        color: "var(--color-text-muted)",
      }}
    >
      <div className="mx-auto flex max-w-[65ch] items-center justify-between">
        <span>
          bytesize · built by{" "}
          <a
            href="https://github.com/iamartyaa"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[color:var(--color-text)] transition-colors"
          >
            amartya
          </a>
        </span>
        <Link
          href="/rss.xml"
          aria-label="Subscribe via RSS"
          className="hover:text-[color:var(--color-text)] transition-colors"
        >
          subscribe (rss)
        </Link>
      </div>
    </footer>
  );
}
