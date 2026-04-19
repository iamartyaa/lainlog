#!/usr/bin/env node
/**
 * audit-prose.mjs — scan article JSX files for prose-quality issues.
 *
 * Run: `npm run audit` (or `node scripts/audit-prose.mjs <glob-of-files>`).
 * Exits 1 if any error-level finding is reported, 0 otherwise.
 *
 * Why a hand-written scanner and not a real AST parser: the post corpus is
 * hand-authored JSX with a small, stable component vocabulary. Regex with
 * contextual rules catches the documented issues without false positives
 * at the cost of missing exotic constructs we don't write. If the corpus
 * grows past ~10 posts, migrate to `@babel/parser` with a JSX traversal.
 */

import { readFileSync, existsSync } from "node:fs";
import { globSync } from "node:fs";
import process from "node:process";

const DEFAULT_GLOB = "app/posts/**/page.tsx";

// ANSI colour helpers — minimal, no chalk dep.
const C = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  blue: (s) => `\x1b[34m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

/** @type {Array<{rule: string, severity: "error" | "warn" | "info", check: (line: string, lineNo: number, allLines: string[], fileLines: string[]) => Array<{line: number, rule: string, severity: string, snippet: string}>}>} */
const RULES = [
  {
    rule: "missing-space-after-component",
    severity: "error",
    check: (line, lineNo) => {
      // Pattern: </Component>wordchar — close tag immediately followed by a
      // letter or digit. Whitelist punctuation that legitimately closes a
      // clause: , . ; : ! ? ) } ] and whitespace.
      const re = /<\/(Code|Em|Term|A|Kbd|Aside|Callout)>([A-Za-z0-9])/g;
      const findings = [];
      let m;
      while ((m = re.exec(line)) !== null) {
        findings.push({
          line: lineNo,
          rule: "missing-space-after-component",
          severity: "error",
          snippet: line.slice(Math.max(0, m.index - 10), m.index + 40).trim(),
        });
      }
      return findings;
    },
  },
  {
    rule: "missing-space-before-component",
    severity: "error",
    check: (line, lineNo) => {
      // Pattern: wordchar<Component — open tag preceded by a letter/digit
      // with no space. Again, punctuation is fine.
      const re = /([A-Za-z0-9])<(Code|Em|Term|A|Kbd)>/g;
      const findings = [];
      let m;
      while ((m = re.exec(line)) !== null) {
        findings.push({
          line: lineNo,
          rule: "missing-space-before-component",
          severity: "error",
          snippet: line.slice(Math.max(0, m.index - 10), m.index + 40).trim(),
        });
      }
      return findings;
    },
  },
  {
    rule: "punct-glued-to-jsx",
    severity: "warn",
    check: (line, lineNo) => {
      // Pattern: .<Component — sentence-ending punctuation immediately
      // followed by a new JSX element suggests a missing space after the
      // period. Common paste artifact.
      const re = /[.!?]<(Code|Em|Term|A)/g;
      const findings = [];
      let m;
      while ((m = re.exec(line)) !== null) {
        findings.push({
          line: lineNo,
          rule: "punct-glued-to-jsx",
          severity: "warn",
          snippet: line.slice(Math.max(0, m.index - 10), m.index + 40).trim(),
        });
      }
      return findings;
    },
  },
  {
    rule: "double-space-in-jsx",
    severity: "warn",
    check: (line, lineNo) => {
      // Pattern: {"  "} with two spaces. Almost always a typo.
      const re = /\{"\s{2,}"\}/g;
      const findings = [];
      let m;
      while ((m = re.exec(line)) !== null) {
        findings.push({
          line: lineNo,
          rule: "double-space-in-jsx",
          severity: "warn",
          snippet: line.slice(Math.max(0, m.index - 5), m.index + 20).trim(),
        });
      }
      return findings;
    },
  },
  {
    rule: "em-abuse",
    severity: "warn",
    check: (line, lineNo, allLines, fileLines) => {
      // Scan the containing <P>...</P> block (or <Aside>, <Callout>) and
      // count consecutive <Em> siblings. Fire on ≥ 2 within a single block
      // so the weight-500 bump doesn't make dense-emphasis paragraphs shouty.
      //
      // Cheap heuristic: treat each line individually and count <Em> tags.
      // False-fires on poetic multi-Em lines; author opts out by breaking
      // into multiple <P>s.
      const count = (line.match(/<Em>/g) || []).length;
      if (count >= 2) {
        return [
          {
            line: lineNo,
            rule: "em-abuse",
            severity: "warn",
            snippet: `${count} <Em> tags on this line`,
          },
        ];
      }
      return [];
    },
  },
  {
    rule: "aside-vs-callout",
    severity: "warn",
    check: (line, lineNo, allLines) => {
      // Look for an <Aside> block whose content mentions words that suggest
      // it should be a <Callout tone="note">.
      if (!/<Aside>/.test(line)) return [];
      // Join the next ~8 lines (typical Aside length) to catch the content.
      const block = allLines.slice(lineNo - 1, lineNo + 8).join(" ");
      const prominentWords = /\b(important|critical|never|always|must|warning|watch out|the rule)\b/i;
      if (prominentWords.test(block)) {
        return [
          {
            line: lineNo,
            rule: "aside-vs-callout",
            severity: "warn",
            snippet: "Aside mentions a word that reads as prominent",
          },
        ];
      }
      return [];
    },
  },
  {
    rule: "inconsistent-codeblock",
    severity: "warn",
    check: (line, lineNo) => {
      // Raw <pre> in a post file should be <CodeBlock> instead. Match at
      // end-of-line too (word boundary), since the source may break right
      // after the tag name onto the next line for multi-line JSX.
      if (/<pre\b/.test(line)) {
        return [
          {
            line: lineNo,
            rule: "inconsistent-codeblock",
            severity: "warn",
            snippet: line.trim().slice(0, 60),
          },
        ];
      }
      return [];
    },
  },
  {
    rule: "undersized-code",
    severity: "info",
    check: (line, lineNo) => {
      // <Code>long string</Code> reads cramped at 0.92em on mobile.
      const re = /<Code>([^<]{20,})<\/Code>/g;
      const findings = [];
      let m;
      while ((m = re.exec(line)) !== null) {
        findings.push({
          line: lineNo,
          rule: "undersized-code",
          severity: "info",
          snippet: `<Code>${m[1].slice(0, 40)}…</Code> (${m[1].length} chars)`,
        });
      }
      return findings;
    },
  },
  {
    rule: "low-contrast-output-block",
    severity: "info",
    check: (line, lineNo) => {
      // <CodeBlock tone="output"> dims the body to --color-text-muted, which
      // fails WCAG AA for small text. Flag so the author can confirm the
      // block is genuinely transient shell output and not a teaching block.
      if (/<CodeBlock[^>]*tone="output"/.test(line)) {
        return [
          {
            line: lineNo,
            rule: "low-contrast-output-block",
            severity: "info",
            snippet: 'tone="output" — confirm this block is non-teaching',
          },
        ];
      }
      return [];
    },
  },
];

function auditFile(path) {
  const source = readFileSync(path, "utf8");
  const lines = source.split("\n");
  /** @type {Array<{line: number, rule: string, severity: string, snippet: string}>} */
  const findings = [];
  lines.forEach((line, i) => {
    const lineNo = i + 1;
    for (const rule of RULES) {
      findings.push(...rule.check(line, lineNo, lines, lines));
    }
  });
  return findings;
}

function report(path, findings) {
  if (findings.length === 0) return;
  console.log(C.bold(path));
  findings.sort((a, b) => a.line - b.line);
  for (const f of findings) {
    const mark =
      f.severity === "error"
        ? C.red("✗")
        : f.severity === "warn"
          ? C.yellow("⚠")
          : C.blue("ℹ");
    const ruleCol = f.rule.padEnd(32);
    const lineCol = C.dim(`L${String(f.line).padStart(4)}`);
    console.log(`  ${mark} ${lineCol}  ${C.dim(ruleCol)} ${f.snippet}`);
  }
}

function main() {
  const argGlobs = process.argv.slice(2);
  const patterns = argGlobs.length > 0 ? argGlobs : [DEFAULT_GLOB];

  /** @type {string[]} */
  const files = [];
  for (const p of patterns) {
    if (existsSync(p)) {
      files.push(p);
      continue;
    }
    try {
      const matched = globSync(p);
      files.push(...matched);
    } catch {
      console.error(`No matches for ${p}`);
    }
  }

  if (files.length === 0) {
    console.error("No files to audit.");
    process.exit(2);
  }

  let totalErrors = 0;
  let totalWarns = 0;
  let totalInfo = 0;

  for (const f of files) {
    const findings = auditFile(f);
    totalErrors += findings.filter((x) => x.severity === "error").length;
    totalWarns += findings.filter((x) => x.severity === "warn").length;
    totalInfo += findings.filter((x) => x.severity === "info").length;
    report(f, findings);
  }

  const summary =
    `${totalErrors} error${totalErrors === 1 ? "" : "s"}, ` +
    `${totalWarns} warning${totalWarns === 1 ? "" : "s"}, ` +
    `${totalInfo} info in ${files.length} file${files.length === 1 ? "" : "s"}.`;

  console.log();
  if (totalErrors > 0) console.log(C.red(summary));
  else if (totalWarns > 0) console.log(C.yellow(summary));
  else console.log(C.dim(summary));

  process.exit(totalErrors > 0 ? 1 : 0);
}

main();
