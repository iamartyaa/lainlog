"use client";

/**
 * AdapterTimeline — 4-step scripted stepper through the four pre-MCP eras.
 *
 * Each tick shows two columns: "what moved" between LLM and external system,
 * and "what stayed bespoke" (still M·N). The "moved" column grows; the
 * "bespoke" column shrinks but never vanishes. Implicit fifth tick — MCP —
 * is what the chapter is building toward.
 *
 * Implementation notes:
 * - Uses the shipped <WidgetNav> primitive for prev/next/play. WidgetNav
 *   already pauses autoplay off-screen, respects reduced motion, and meets
 *   the 44 px hit-target rule.
 * - The two-column body crossfades on step change. Reduced motion reduces
 *   that to opacity-only.
 * - On mobile the two columns stack — pure CSS via @container.
 */

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { WidgetNav } from "@/components/viz/WidgetNav";
import { SPRING } from "@/lib/motion";

type Step = {
  era: string;
  year: string;
  blurb: string;
  moved: string[];
  bespoke: string[];
};

const STEPS: Step[] = [
  {
    era: "Direct REST",
    year: "pre-2023",
    blurb:
      "An agent loop calls the SaaS REST endpoint directly. Prompt engineering glues the response back into the conversation.",
    moved: ["nothing — the LLM still parses raw JSON"],
    bespoke: [
      "auth per host",
      "request shape per tool",
      "response stitching per host",
      "every error path, hand-rolled",
    ],
  },
  {
    era: "OpenAPI plugins",
    year: "2023",
    blurb:
      "ChatGPT lets a SaaS publish an OpenAPI spec; the host reads it and offers the endpoints as plugins. Host-specific.",
    moved: [
      "tool discovery (host reads the OpenAPI file)",
      "schema-to-prompt translation",
    ],
    bespoke: [
      "the manifest format is host-specific",
      "auth flows are host-specific",
      "every other host re-implements discovery",
    ],
  },
  {
    era: "Function-calling",
    year: "2023",
    blurb:
      "OpenAI ships function-calling: structured tool schemas the model can invoke directly. The schema shape becomes part of the model's API.",
    moved: [
      "structured invocation (model emits a typed call, not a string)",
      "argument validation, into the framework",
    ],
    bespoke: [
      "tool schemas live inside each app",
      "Anthropic's shape differs from OpenAI's",
      "no shared registry across hosts",
    ],
  },
  {
    era: "LangChain tools",
    year: "2023–2024",
    blurb:
      "A framework abstracts function-calling across providers. Tools become Python/TS classes you register on an agent.",
    moved: [
      "model-vendor abstraction (one tool, many backends)",
      "execution loop, into the framework",
    ],
    bespoke: [
      "tools are framework-specific, not protocol-level",
      "Cursor, Claude Desktop, Zed don't speak LangChain",
      "still M × N when crossing host boundaries",
    ],
  },
];

export function AdapterTimeline() {
  const [step, setStep] = useState(0);
  const reduce = useReducedMotion();
  const current = STEPS[step];

  return (
    <WidgetShell
      title="Four pre-MCP eras — what moved, what stayed bespoke"
      measurements={`${step + 1} / ${STEPS.length}`}
      caption={
        <>
          Each era moved <em>some</em> of the integration burden — but the
          M × N didn't collapse. That's what the next page does.
        </>
      }
      controls={
        <WidgetNav
          value={step}
          total={STEPS.length}
          onChange={setStep}
          counterNoun="era"
        />
      }
    >
      <div
        style={{
          containerType: "inline-size",
          containerName: "atimeline",
          minHeight: 280,
        }}
      >
        <style>{`
          .bs-atl-cols {
            display: grid;
            grid-template-columns: 1fr;
            gap: var(--spacing-md);
          }
          @container atimeline (min-width: 540px) {
            .bs-atl-cols {
              grid-template-columns: 1fr 1fr;
              gap: var(--spacing-lg);
            }
          }
          .bs-atl-col {
            border: 1px solid var(--color-rule);
            border-radius: var(--radius-md);
            padding: var(--spacing-md);
            background: color-mix(in oklab, var(--color-surface) 30%, transparent);
          }
          .bs-atl-col h4 {
            font-family: var(--font-mono);
            font-size: var(--text-small);
            letter-spacing: 0.04em;
            text-transform: uppercase;
            color: var(--color-text-muted);
            margin: 0 0 var(--spacing-sm) 0;
            font-weight: 600;
          }
          .bs-atl-col ul {
            margin: 0;
            padding-left: 1.1em;
            font-family: var(--font-serif);
            font-size: var(--text-small);
            line-height: 1.55;
            color: var(--color-text);
          }
          .bs-atl-col li { margin: 0 0 0.35em 0; }
          .bs-atl-moved { border-color: color-mix(in oklab, var(--color-accent) 45%, var(--color-rule)); }
        `}</style>

        {/* Era header. */}
        <div className="flex items-baseline gap-[var(--spacing-sm)] flex-wrap mb-[var(--spacing-sm)]">
          <span
            className="font-sans"
            style={{
              fontSize: "var(--text-h3, 1.25rem)",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "var(--color-text)",
            }}
          >
            {current.era}
          </span>
          <span
            className="font-mono"
            style={{
              fontSize: "var(--text-small)",
              color: "var(--color-text-muted)",
              letterSpacing: "0.04em",
            }}
          >
            {current.year}
          </span>
        </div>

        {/* Step body — crossfade on change. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={reduce ? { duration: 0 } : SPRING.smooth}
          >
            <p
              className="font-serif"
              style={{
                fontSize: "var(--text-small)",
                lineHeight: 1.55,
                color: "var(--color-text)",
                margin: "0 0 var(--spacing-md) 0",
              }}
            >
              {current.blurb}
            </p>
            <div className="bs-atl-cols">
              <div className="bs-atl-col bs-atl-moved">
                <h4>What moved</h4>
                <ul>
                  {current.moved.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
              <div className="bs-atl-col">
                <h4>What stayed bespoke</h4>
                <ul>
                  {current.bespoke.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Tick rail — visual progress under the body. */}
        <div
          aria-hidden
          className="mt-[var(--spacing-md)] flex items-center gap-[6px]"
        >
          {STEPS.map((_, i) => (
            <span
              key={i}
              style={{
                display: "inline-block",
                height: 2,
                flex: 1,
                background:
                  i <= step
                    ? "var(--color-accent)"
                    : "color-mix(in oklab, var(--color-rule) 90%, transparent)",
                transition: "background 200ms",
              }}
            />
          ))}
        </div>
      </div>
    </WidgetShell>
  );
}

export default AdapterTimeline;
