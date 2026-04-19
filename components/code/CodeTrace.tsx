"use client";

import { useEffect, useMemo, useState } from "react";
import { highlight } from "@/lib/shiki";

type Props = {
  code: string;
  lang?: string;
  filename?: string;
  /** 1-indexed active line. */
  activeLine?: number;
  /** Optional node rendered immediately after the active line — e.g. an inline annotation. */
  annotation?: React.ReactNode;
};

/**
 * CodeTrace — line-stepping viewer. Highlights the currently-active line with
 * a full-row background tint in --color-accent (no left stripe, per DESIGN.md).
 * Slot an annotation below the active line by passing `annotation`.
 */
export function CodeTrace({ code, lang = "typescript", filename, activeLine, annotation }: Props) {
  const trimmed = useMemo(() => code.replace(/^\n+|\n+$/g, ""), [code]);
  const lines = useMemo(() => trimmed.split("\n"), [trimmed]);
  const [htmlLines, setHtmlLines] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    highlight(trimmed, lang).then((fullHtml) => {
      if (cancelled) return;
      // Extract per-line spans from Shiki output: each line is <span class="line">...</span>
      const parser = new DOMParser();
      const doc = parser.parseFromString(fullHtml, "text/html");
      const lineEls = doc.querySelectorAll("pre code .line, pre .line");
      if (lineEls.length) {
        setHtmlLines(Array.from(lineEls).map((el) => el.innerHTML));
      } else {
        // Fallback: split on newlines, show raw text
        setHtmlLines(lines);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [trimmed, lang, lines]);

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
      <pre
        className="m-0 overflow-x-auto px-[var(--spacing-md)] py-[var(--spacing-md)] leading-[1.55]"
        aria-label="code with active line highlight"
      >
        <code>
          {(htmlLines.length ? htmlLines : lines).map((lineHtml, i) => {
            const is1 = i + 1;
            const isActive = activeLine === is1;
            return (
              <span
                key={i}
                data-active={isActive || undefined}
                className="block -mx-[var(--spacing-md)] px-[var(--spacing-md)] transition-colors duration-[160ms]"
                style={
                  isActive
                    ? {
                        background: "color-mix(in oklab, var(--color-accent) 18%, transparent)",
                      }
                    : undefined
                }
                dangerouslySetInnerHTML={{ __html: lineHtml || "&nbsp;" }}
              />
            );
          })}
        </code>
      </pre>
      {annotation && activeLine !== undefined ? (
        <div
          className="border-t px-[var(--spacing-md)] py-[var(--spacing-sm)] font-sans"
          style={{
            borderColor: "var(--color-rule)",
            color: "var(--color-text-muted)",
            fontSize: "var(--text-small)",
            lineHeight: 1.5,
          }}
        >
          {annotation}
        </div>
      ) : null}
    </div>
  );
}
