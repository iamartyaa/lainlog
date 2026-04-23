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
      <div className="mx-auto flex max-w-[65ch] items-center">
        <span>
          bytesize · built by An Anonymous Engineer
          <span aria-hidden className="ml-[0.25em] opacity-70">
            {"</>"}
          </span>
        </span>
      </div>
    </footer>
  );
}
