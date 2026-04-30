"use client";

/**
 * ReverseQuiz — premise-quiz opener for chapter 8 (voice §12.1).
 *
 * The reader's instinct on sampling: "the server wants the LLM, the client
 * forwards, the LLM replies, done — one HITL gate, maybe none." The
 * chapter's correction: sampling has TWO human-approval checkpoints — one
 * before the prompt reaches the LLM, one before the completion reaches the
 * server. The wrong-answer verdict creates the demand the rest of the
 * chapter pays back.
 *
 * Reuses the shipped <Quiz> primitive: radiogroup a11y, reduced-motion fall-
 * back, frame-stable verdict slot, one-accent terracotta highlight.
 */

import { Quiz } from "@/components/widgets/Quiz";
import { WidgetShell } from "@/components/viz/WidgetShell";

export function ReverseQuiz() {
  return (
    <WidgetShell
      title="A server asks for the host's LLM. How many human-approval gates fire?"
      caption={
        <>
          Predict before you read on. The chapter exists because most readers
          arrive thinking sampling is a single forward call. It isn&apos;t —
          and the gate count is what makes the spec safe by construction.
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
              A server sends{" "}
              <code style={{ fontFamily: "var(--font-mono)" }}>
                sampling/createMessage
              </code>{" "}
              — <em>analyse these 47 flights, recommend the best.</em> Before
              the response gets back to the server, how many human-approval
              gates fire on the host?
            </p>
          }
          correctId="two"
          rightVerdict={
            <>
              Right. The host asks the user before forwarding the request to
              the LLM (<em>does the user consent to this server sampling?</em>),
              and asks again before sending the LLM&apos;s completion back to
              the server (<em>does the user consent to this output going
              back?</em>). Two gates, on either side of the model call.
            </>
          }
          wrongVerdict={
            <>
              Sampling has <em>two</em> checkpoints, not one. The host gates
              the request before it reaches the LLM, and gates the response
              before it goes back to the server. A model the server asked for
              still goes through the user — both ways.
            </>
          }
          options={[
            {
              id: "zero",
              label:
                "Zero — sampling is fire-and-forget; the host forwards the prompt and pipes the completion straight back.",
            },
            {
              id: "one",
              label:
                "One — the user approves the sampling request; once approved, the LLM's reply flows back automatically.",
            },
            {
              id: "two",
              label:
                "Two — the user approves the request before the LLM is called, AND approves the response before it returns to the server.",
            },
            {
              id: "three",
              label:
                "Three — request, model choice, and response each get their own gate.",
            },
          ]}
        />
      </div>
    </WidgetShell>
  );
}

export default ReverseQuiz;
