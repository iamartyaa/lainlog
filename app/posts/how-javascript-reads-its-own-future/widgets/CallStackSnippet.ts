/**
 * Shared call-stack code snippet — imported by both the RSC page (which
 * pre-renders it via `<CodeBlock>`) and the client widget (which measures
 * the rendered Shiki output to position the active-line wash).
 *
 * Kept in its own module without `"use client"` so the page can import the
 * raw string. If this lived inside `CallStackECs.tsx` (a client module),
 * the bundler would wrap every export as a client reference, and the
 * `<CodeBlock>` call from the page would receive a function instead of a
 * string for `code`.
 */
export const CALL_STACK_SNIPPET = `function multiply(a, b) {
  const result = a * b;
  return result;
}

function compute(x) {
  const doubled = multiply(x, 2);
  console.log(doubled);
  return doubled;
}

const answer = compute(7);
console.log(answer);
`;
