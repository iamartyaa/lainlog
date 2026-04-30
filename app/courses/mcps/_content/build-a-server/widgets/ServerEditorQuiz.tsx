"use client";

/**
 * ServerEditorQuiz — premise-quiz opener for chapter 6 (voice §12.1).
 *
 * The reader's instinct after chapters 1–5: "registering a tool is just
 * giving it a name; the model figures out the rest." The chapter's
 * correction: descriptions are the model's *only* signal for whether to
 * call a tool. A tool with no description registers cleanly but is
 * effectively invisible to the model — and ch 9 will cash this in as
 * an attack surface.
 *
 * Reuses the shipped <Quiz> primitive: radiogroup a11y, frame-stable
 * verdict slot, single-accent terracotta.
 */

import { Quiz } from "@/components/widgets/Quiz";
import { WidgetShell } from "@/components/viz/WidgetShell";

export function ServerEditorQuiz() {
  return (
    <WidgetShell
      title="What does the model see when a tool ships with no description?"
      caption={
        <>
          Predict before you read on. Most readers think the tool name does
          most of the work. The spec — and your model — disagree.
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
              You register a tool called{" "}
              <code style={{ fontFamily: "var(--font-mono)" }}>foo</code>{" "}
              with an input schema but no description. The host sends{" "}
              <code style={{ fontFamily: "var(--font-mono)" }}>tools/list</code>.
              What does the model receive — and how likely is it to call{" "}
              <code style={{ fontFamily: "var(--font-mono)" }}>foo</code>?
            </p>
          }
          correctId="empty-but-valid"
          rightVerdict={
            <>
              Right. The registration is technically valid — the spec only
              requires a name and an input schema — but with an empty
              description the model has nothing to read. It can see{" "}
              <code style={{ fontFamily: "var(--font-mono)" }}>foo</code>{" "}
              exists; it has no idea <em>when</em> to use it. The
              description is the model&apos;s only signal.
            </>
          }
          wrongVerdict={
            <>
              The description is what the model reads to decide{" "}
              <em>when</em> to call a tool. An empty one is technically
              valid but pedagogically dead — and ch 9 will show how an
              attacker-controlled description can hijack the model&apos;s
              decisions.
            </>
          }
          options={[
            {
              id: "error",
              label:
                "An error — every tool must carry a description, the SDK refuses to register it.",
            },
            {
              id: "empty-but-valid",
              label:
                "A valid tool entry with an empty description and the schema. The model sees it but has no signal for when to call it.",
            },
            {
              id: "name-only",
              label:
                "Just the name. The SDK omits tools without descriptions from tools/list responses.",
            },
            {
              id: "source",
              label:
                "The handler's source code, so the model can decide for itself.",
            },
          ]}
        />
      </div>
    </WidgetShell>
  );
}

export default ServerEditorQuiz;
