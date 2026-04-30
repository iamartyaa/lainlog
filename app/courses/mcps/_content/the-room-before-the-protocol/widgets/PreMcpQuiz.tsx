"use client";

/**
 * PreMcpQuiz — premise-quiz opener for chapter 1 (voice §12.1).
 *
 * Shows a 12-line LangChain-style tool-registration snippet from 2023, then
 * asks: "to add one new tool — getSlackThread() — what changes?" Most
 * readers underestimate. The verdict on every wrong pick creates the demand
 * for the chapter's reframe (M·N → M+N).
 *
 * Reuses the shipped <Quiz> primitive (components/widgets/Quiz.tsx) — that
 * primitive already handles the radiogroup a11y, reduced-motion fallback,
 * frame-stable verdict slot, and the one-accent terracotta highlight. We
 * just supply question + options + verdicts.
 */

import { Quiz } from "@/components/widgets/Quiz";
import { WidgetShell } from "@/components/viz/WidgetShell";

const SNIPPET = `// agent.ts — a 2023-style LangChain agent
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { ChatOpenAI } from "@langchain/openai";
import { searchFlights } from "./tools/searchFlights";
import { lookupWeather } from "./tools/lookupWeather";

const tools = [searchFlights, lookupWeather];
const llm = new ChatOpenAI({ model: "gpt-4", temperature: 0 });

export const agent = await initializeAgentExecutorWithOptions(tools, llm, {
  agentType: "openai-functions",
});`;

export function PreMcpQuiz() {
  return (
    <WidgetShell
      title="Pre-MCP, what does adding one tool actually cost?"
      caption={
        <>
          Predict before you read on. The chapter exists because most teams in
          2023 paid this bill three times — once per host — and stopped
          noticing.
        </>
      }
    >
      <div className="flex flex-col gap-[var(--spacing-md)]">
        {/* Code snippet — read-only, monospace, scoped styling. */}
        <pre
          className="font-mono"
          style={{
            fontSize: "var(--text-small)",
            lineHeight: 1.55,
            background: "var(--color-surface)",
            padding: "var(--spacing-md)",
            borderRadius: "var(--radius-md)",
            overflowX: "auto",
            margin: 0,
            color: "var(--color-text)",
          }}
        >
          <code>{SNIPPET}</code>
        </pre>

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
              You want to add <code style={{ fontFamily: "var(--font-mono)" }}>getSlackThread()</code> as a new
              tool. What actually changes — and where do the redeploys land?
            </p>
          }
          correctId="three-layers"
          rightVerdict={
            <>
              Right. The agent code grows; the agent process redeploys; the
              host frontend (or whatever surfaces the tool to the user) often
              needs an update too. <em>Three layers</em>. And every other host
              that wants the same tool — Cursor, an internal Slack bot — pays
              the bill again.
            </>
          }
          wrongVerdict={
            <>
              The honest answer is <em>three layers</em>: the tool file, the
              agent registration + redeploy, and the host surface that exposes
              it. And every other host that wants this tool re-plumbs the same
              three layers. That's the bill MCP is here to stop charging.
            </>
          }
          options={[
            {
              id: "register-only",
              label: "Just register it on the agent — no redeploy needed.",
            },
            {
              id: "tool-and-agent",
              label: "Add the tool file, redeploy the agent process. Done.",
            },
            {
              id: "three-layers",
              label:
                "Tool file, agent redeploy, plus the host surface that exposes it — three layers move.",
            },
            {
              id: "everywhere",
              label:
                "Every consumer (Claude, Cursor, your bot) ships its own integration. They don't share code.",
            },
          ]}
        />
      </div>
    </WidgetShell>
  );
}

export default PreMcpQuiz;
