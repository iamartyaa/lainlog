import type { HighlighterCore } from "shiki/core";

export const SHIKI_DARK = "github-dark-dimmed" as const;
export const SHIKI_LIGHT = "github-light" as const;

let highlighterPromise: Promise<HighlighterCore> | null = null;

/**
 * Lazy, memoized Shiki highlighter.
 * JS regex engine (no WASM) + only the languages we actually use
 * to keep the bundle small. Dual-theme ensures one DOM for both schemes.
 */
export function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = (async () => {
      const { createHighlighterCore } = await import("shiki/core");
      const { createJavaScriptRegexEngine } = await import("shiki/engine/javascript");

      return createHighlighterCore({
        themes: [
          import("shiki/themes/github-dark-dimmed.mjs"),
          import("shiki/themes/github-light.mjs"),
        ],
        langs: [
          import("shiki/langs/typescript.mjs"),
          import("shiki/langs/tsx.mjs"),
          import("shiki/langs/javascript.mjs"),
          import("shiki/langs/jsx.mjs"),
          import("shiki/langs/bash.mjs"),
          import("shiki/langs/python.mjs"),
          import("shiki/langs/json.mjs"),
          import("shiki/langs/http.mjs"),
        ],
        engine: createJavaScriptRegexEngine(),
      });
    })();
  }
  return highlighterPromise;
}

/**
 * Render code to HTML with dual-theme CSS variables.
 * `[data-theme="dark"]` rules in globals.css swap to the dark palette.
 */
export async function highlight(
  code: string,
  lang: string = "typescript",
): Promise<string> {
  const highlighter = await getHighlighter();
  return highlighter.codeToHtml(code, {
    lang,
    themes: { light: SHIKI_LIGHT, dark: SHIKI_DARK },
    defaultColor: false,
  });
}
