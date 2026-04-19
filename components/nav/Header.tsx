import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header
      className="flex h-[64px] items-center justify-between px-[var(--spacing-lg)]"
      style={{ fontSize: "var(--text-ui)" }}
    >
      <Link
        href="/"
        aria-label="bytesize — home"
        className="font-mono transition-colors hover:text-[color:var(--color-accent)]"
        style={{
          fontSize: "0.9375rem",
          letterSpacing: "0.02em",
        }}
      >
        bytesize
      </Link>

      <nav className="flex items-center gap-[var(--spacing-md)]">
        <ThemeToggle />
        <Link
          href="/rss.xml"
          aria-label="Subscribe via RSS"
          className="font-mono transition-colors hover:text-[color:var(--color-accent)]"
          style={{
            fontSize: "var(--text-small)",
            color: "var(--color-text-muted)",
          }}
        >
          rss
        </Link>
      </nav>
    </header>
  );
}
