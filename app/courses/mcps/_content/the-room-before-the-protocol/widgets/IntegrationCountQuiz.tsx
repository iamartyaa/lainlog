"use client";

/**
 * IntegrationCountQuiz — the chapter's comprehension check.
 *
 * Predict-the-output style: a new SaaS API ships tomorrow. The reader's
 * team uses Claude Desktop, Cursor, and an internal Slack bot. How many
 * integrations under MCP vs without? Reuses the shipped <Quiz> primitive
 * for full a11y + reduced-motion parity with the opener.
 */

import { Quiz } from "@/components/widgets/Quiz";
import { WidgetShell } from "@/components/viz/WidgetShell";

export function IntegrationCountQuiz() {
  return (
    <WidgetShell
      title="A new SaaS ships tomorrow — count the integrations"
      caption={
        <>
          Three hosts in your team. One new tool. Predict the integration
          count under MCP versus without before you check.
        </>
      }
    >
      <Quiz
        question={
          <p
            className="font-serif"
            style={{
              fontSize: "var(--text-body)",
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            A new SaaS API ships tomorrow. Your team uses Claude Desktop,
            Cursor, and an internal Slack bot. How many integrations do you
            write — under MCP, vs without?
          </p>
        }
        correctId="one-vs-three"
        rightVerdict={
          <>
            One MCP server. Three host configurations. Without MCP, three
            bespoke adapters — one per host — and three teams to keep them
            updated. <em>1 + 3 = 4 lines of work, vs 3 × N forever.</em>
          </>
        }
        wrongVerdict={
          <>
            The right pick is <strong>1 vs 3</strong>. Under MCP you author
            one server and configure three hosts to consume it. Without MCP,
            each host needs its own adapter — same code, written three times,
            maintained three times.
          </>
        }
        options={[
          {
            id: "one-vs-one",
            label: "1 vs 1 — the integration is the integration.",
          },
          {
            id: "one-vs-three",
            label:
              "1 vs 3 — one MCP server vs one bespoke adapter per host.",
          },
          {
            id: "three-vs-three",
            label: "3 vs 3 — three teams ship code either way.",
          },
          {
            id: "zero-vs-three",
            label: "0 vs 3 — MCP servers come for free if upstream provides them.",
          },
        ]}
      />
    </WidgetShell>
  );
}

export default IntegrationCountQuiz;
