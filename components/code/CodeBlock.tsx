import { highlight } from "@/lib/shiki";
import { CopyButton } from "./CopyButton";

type Tone = "default" | "terminal" | "output";

type Props = {
  code: string;
  lang?: string;
  filename?: string;
  /** Force line numbers on/off. Defaults: on for `default`, off for `terminal` and `output`. */
  showLineNumbers?: boolean;
  /**
   * Visual register.
   * - `default`  — teaching code. Full chrome, line numbers, copy button.
   * - `terminal` — shell transcript. Renders a `$` prompt on the first
   *   non-blank line; line numbers off; copy button hidden.
   * - `output`   — command output. Body dimmed to `--color-text-muted`;
   *   line numbers off; copy button shown. Flag transient output in
   *   `scripts/audit-prose.mjs` so teaching code never accidentally dims.
   */
  tone?: Tone;
};

/**
 * CodeBlock — terminal-style chrome (three muted dots + filename tab + lang
 * badge) wrapping a Shiki-highlighted code body. The three dot tokens
 * (`--code-dot-red`/`-yellow`/`-green`) are the one permitted exception to
 * DESIGN.md §12's one-accent rule — chromas are ≤ 50 % of OS defaults so
 * they read as a terminal metaphor without lighting the page up with new
 * accents.
 *
 * On phone-width containers (`@container widget (max-width: 560px)`) the
 * chrome bar shrinks from 34 px to 28 px, the language badge hides, and
 * the copy button becomes a chrome-bar element so the figure keeps a
 * compact footprint.
 */
export async function CodeBlock({
  code,
  lang = "typescript",
  filename,
  showLineNumbers,
  tone = "default",
}: Props) {
  const trimmed = code.replace(/^\n+|\n+$/g, "");
  const highlightLang = tone === "terminal" && lang === "typescript" ? "bash" : lang;
  const html = await highlight(trimmed, highlightLang);
  const numbered = showLineNumbers ?? tone === "default";

  return (
    <div
      className="bs-code group relative my-[var(--spacing-lg)] overflow-hidden font-mono"
      data-tone={tone}
      style={{
        background: "var(--color-surface)",
        borderRadius: "var(--radius-md)",
        fontSize: "var(--text-mono)",
        border: "1px solid var(--color-rule)",
      }}
    >
      {/* macOS-style chrome bar: three muted dots + optional filename + lang.
          Chrome shares the body background (--color-surface) so the block
          reads as one unified surface with a single 1-px hairline between
          chrome and body — no gradient tint, no shaded seam. */}
      <div
        className="bs-code-chrome flex items-center gap-[var(--spacing-sm)] border-b px-[var(--spacing-md)]"
        style={{
          borderColor: "var(--color-rule)",
          color: "var(--color-text-muted)",
          fontSize: "var(--text-small)",
        }}
      >
        <span
          className="bs-code-dots inline-flex items-center gap-[6px]"
          aria-hidden
        >
          <span className="bs-code-dot" style={{ background: "var(--code-dot-red)" }} />
          <span className="bs-code-dot" style={{ background: "var(--code-dot-yellow)" }} />
          <span className="bs-code-dot" style={{ background: "var(--code-dot-green)" }} />
        </span>
        <span className="bs-code-filename truncate">
          {filename ?? (tone === "terminal" ? "terminal" : "\u00a0")}
        </span>
        <span
          className="bs-code-badge ml-auto uppercase tracking-wider opacity-60"
          style={{ fontSize: "0.7rem" }}
        >
          {lang}
        </span>
      </div>
      <div className="relative">
        {tone !== "terminal" ? <CopyButton text={trimmed} /> : null}
        <div
          className="bs-code-body overflow-x-auto px-[var(--spacing-md)] py-[var(--spacing-md)] leading-[1.55]"
          data-numbered={numbered ? "true" : undefined}
          style={{ touchAction: "pan-x" }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
