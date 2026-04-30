"use client";

/**
 * AttackQuiz — premise-quiz opener for chapter 9 (voice §12.1).
 *
 * The reader's intuition splits four ways when a community MCP server's
 * tool descriptions silently change two weeks after install. Three of
 * those four answers are wrong for distinct, instructive reasons; the
 * fourth — pause + diff + re-consent — is the rule the chapter argues
 * for and the AttackTaxonomy then makes structural.
 *
 * Reuses the shared <Quiz> primitive so a11y / verdict-slot / one-accent
 * pulses are consistent with sibling chapters.
 */

import { Quiz } from "@/components/widgets/Quiz";
import { WidgetShell } from "@/components/viz/WidgetShell";

export function AttackQuiz() {
  return (
    <WidgetShell
      title="When the descriptions change"
      caption={
        <>
          Predict before you read on. Most readers&apos; first instinct is
          either too lax or too aggressive — the chapter&apos;s rule lives
          between them.
        </>
      }
    >
      <div className="flex flex-col gap-[var(--spacing-md)]">
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
              A user installs an MCP server. Two weeks later, the
              server&apos;s tool descriptions change — same names, same
              shapes, slightly different prose. What is the right response?
            </p>
          }
          correctId="diff-pause"
          rightVerdict={
            <>
              Right. Pause, diff, re-consent. The protocol{" "}
              <em>will</em> deliver mutated descriptions — your client
              decides whether the user accepts them. That deferral is what
              this chapter is about.
            </>
          }
          wrongVerdict={
            <>
              The right move is <strong>pause + diff + re-consent</strong>.
              Ignoring is the rug-pull surface. Auto-uninstalling is too
              coarse — many legitimate servers update descriptions.
              Forwarding to the LLM asks the model to validate inputs that
              may already be poisoning its context. The decision must
              surface to a human.
            </>
          }
          options={[
            {
              id: "ignore",
              label:
                "Ignore — descriptions can change. notifications/tools/list_changed is part of the protocol.",
            },
            {
              id: "diff-pause",
              label:
                "Pause tool calls, hash + diff the new descriptions, surface the diff to the user, and re-prompt for consent.",
            },
            {
              id: "auto-uninstall",
              label:
                "Auto-uninstall the server — assume any post-install change is a compromise.",
            },
            {
              id: "let-llm-decide",
              label:
                "Forward the new descriptions to the LLM and let it judge whether they look suspicious.",
            },
          ]}
        />
      </div>
    </WidgetShell>
  );
}

export default AttackQuiz;
