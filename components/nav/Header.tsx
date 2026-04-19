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
        className="group inline-flex items-center gap-[var(--spacing-2xs)] font-mono transition-colors hover:text-[color:var(--color-accent)]"
        style={{
          fontSize: "0.9375rem",
          letterSpacing: "0.02em",
        }}
      >
        <span
          aria-hidden
          className="inline-block h-[10px] w-[10px] shrink-0 transition-transform group-hover:scale-110"
          style={{ background: "var(--color-accent)" }}
        />
        <span>bytesize</span>
      </Link>

      <nav className="flex items-center gap-[var(--spacing-md)]">
        <ThemeToggle />
      </nav>
    </header>
  );
}
