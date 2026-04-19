"use client";

import { ShikiMagicMove } from "shiki-magic-move/react";
import { useEffect, useState } from "react";
import { getHighlighter, SHIKI_DARK, SHIKI_LIGHT } from "@/lib/shiki";
import { useTheme } from "next-themes";
import type { HighlighterCore } from "shiki/core";

type Props = {
  code: string;
  lang?: string;
  /** Override per-render if you need a different filename label. */
  filename?: string;
};

/**
 * CodeMorph — wraps shiki-magic-move for step-linked code reveals.
 * Update the `code` prop and the token tree morphs to the new source.
 */
export function CodeMorph({ code, lang = "typescript", filename }: Props) {
  const { resolvedTheme } = useTheme();
  const [highlighter, setHighlighter] = useState<HighlighterCore | null>(null);

  useEffect(() => {
    getHighlighter().then(setHighlighter);
  }, []);

  if (!highlighter) {
    return (
      <pre
        className="my-[var(--spacing-lg)] overflow-x-auto font-mono px-[var(--spacing-md)] py-[var(--spacing-md)]"
        style={{
          background: "var(--color-surface)",
          borderRadius: "var(--radius-md)",
          fontSize: "var(--text-mono)",
        }}
      >
        {code}
      </pre>
    );
  }

  return (
    <div
      className="relative my-[var(--spacing-lg)] overflow-hidden font-mono"
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
      <div className="overflow-x-auto px-[var(--spacing-md)] py-[var(--spacing-md)]">
        <ShikiMagicMove
          lang={lang}
          theme={resolvedTheme === "light" ? SHIKI_LIGHT : SHIKI_DARK}
          highlighter={highlighter}
          code={code}
          options={{ duration: 500, stagger: 3, lineNumbers: false }}
        />
      </div>
    </div>
  );
}
