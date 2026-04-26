/**
 * Code snippets for the event-loop article's quiz widgets, kept in a
 * non-client module so the article's RSC `page.tsx` can import them and
 * pre-render them through `<CodeBlock>` (Shiki). The widgets themselves
 * (`"use client"`) only need the highlighted JSX element back in via a
 * `codeSlot` / `codeSlots` prop — they don't read these strings directly.
 *
 * Keeping the strings here, not in the widget files, avoids the "you can
 * only import components from a use-client module" RSC boundary trap.
 */

/** PredictTheStart (W0) — the article's opener snippet. */
export const PREDICT_THE_START_SNIPPET = [
  `console.log("A");`,
  `setTimeout(() => console.log("B"), 0);`,
  `Promise.resolve()`,
  `  .then(() => {`,
  `    console.log("C");`,
  `    return Promise.resolve("D");`,
  `  })`,
  `  .then((d) => console.log(d));`,
  `queueMicrotask(() => console.log("E"));`,
  `(async () => {`,
  `  console.log("F");`,
  `  await null;`,
  `  console.log("G");`,
  `})();`,
  `console.log("H");`,
].join("\n");

/** PredictTheOutput (W2) — three variants. */
export const PREDICT_THE_OUTPUT_VARIANT_CODE = {
  alpha: [
    `console.log("A");`,
    `setTimeout(() => console.log("B"), 0);`,
    `Promise.resolve().then(() => console.log("C"));`,
    `console.log("D");`,
  ].join("\n"),
  beta: [
    `setTimeout(() => console.log("T"), 0);`,
    `Promise.resolve().then(() => {`,
    `  console.log("P1");`,
    `  Promise.resolve().then(() => console.log("P2"));`,
    `});`,
  ].join("\n"),
  gamma: [
    `setTimeout(() => console.log("first?"), 0);`,
    `Promise.resolve().then(() => console.log("second?"));`,
  ].join("\n"),
} as const;

export type PredictTheOutputVariantId =
  keyof typeof PREDICT_THE_OUTPUT_VARIANT_CODE;
