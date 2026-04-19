import { highlight } from "@/lib/shiki";
import { CopyButton } from "./CopyButton";

type Props = {
  code: string;
  lang?: string;
  filename?: string;
  /** Force line numbers on/off. Default: auto-on for blocks >= 10 lines. */
  showLineNumbers?: boolean;
};

export async function CodeBlock({ code, lang = "typescript", filename, showLineNumbers }: Props) {
  const trimmed = code.replace(/^\n+|\n+$/g, "");
  const html = await highlight(trimmed, lang);
  const lineCount = trimmed.split("\n").length;
  const numbered = showLineNumbers ?? lineCount >= 10;

  return (
    <div
      className="group relative my-[var(--spacing-lg)] overflow-hidden font-mono"
      style={{
        background: "var(--color-surface)",
        borderRadius: "var(--radius-md)",
        fontSize: "var(--text-mono)",
      }}
    >
      {filename ? (
        <div
          className="flex items-center justify-between border-b px-[var(--spacing-md)] py-[var(--spacing-2xs)]"
          style={{
            borderColor: "var(--color-rule)",
            color: "var(--color-text-muted)",
            fontSize: "var(--text-small)",
          }}
        >
          <span>{filename}</span>
          <span className="opacity-60 uppercase tracking-wider text-[0.7rem]">{lang}</span>
        </div>
      ) : null}
      <div className="relative">
        <CopyButton text={trimmed} />
        <div
          className="overflow-x-auto px-[var(--spacing-md)] py-[var(--spacing-md)] leading-[1.55]"
          data-numbered={numbered ? "true" : undefined}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
