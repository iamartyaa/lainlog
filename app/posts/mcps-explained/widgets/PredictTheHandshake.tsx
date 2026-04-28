"use client";

import { useRef, useState } from "react";
import { TextHighlighter } from "@/components/fancy";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { Quiz } from "@/components/widgets/Quiz";
import { playSound } from "@/lib/audio";

const HL_COLOR = "color-mix(in oklab, var(--color-accent) 28%, transparent)";
const HL_TX = { type: "spring" as const, duration: 0.9, bounce: 0 };

function CaptionCue({ children }: { children: React.ReactNode }) {
  return (
    <TextHighlighter
      triggerType="auto"
      transition={HL_TX}
      highlightColor={HL_COLOR}
      className="rounded-[0.2em] px-[1px]"
    >
      {children}
    </TextHighlighter>
  );
}

/* ---------------------------------------------------------------------------
 * §0 premise-quiz opener. Reader sees a canonical `initialize` JSON-RPC
 * envelope and is asked: what comes back next? Four options, only one right.
 * Most readers reach for option 1 ("a tool list") because they think of MCP
 * as a manifest dump. The protocol is actually a negotiation: capabilities
 * come back, then the client confirms with a one-way `notifications/
 * initialized`. The wrong-answer demand fuels the rest of the post.
 *
 * Per the post-author contract: leans on the shared <Quiz> wrapper for
 * shuffle / focus / pulse / verdict; this file owns the surrounding shell
 * and the answered-state mirror so the shell's caption + measurements
 * track the same lifecycle.
 *
 * Frame stability (R6): code pane has its own min-height via <CodeBlock>;
 * <Quiz>'s verdict slot reserves space before the answer is given.
 * --------------------------------------------------------------------------*/

const CORRECT_ID = "negotiate";

const OPTIONS = [
  // Common wrong: treats MCP as a REST manifest.
  {
    id: "tool-list",
    label: "A list of available tools, resources, and prompts.",
  },
  // Correct.
  {
    id: "negotiate",
    label:
      "A capability response, then a one-way notifications/initialized from the client.",
  },
  // Treats MCP as a chat API.
  { id: "first-prompt", label: "The server's first system prompt for the model." },
  // Plausible-but-wrong: assumes a strict-auth-first protocol shape.
  {
    id: "auth-error",
    label:
      "An error response: the request is missing the protocol version's required field.",
  },
];

type Props = {
  /** Pre-rendered Shiki block for the opener snippet (see page.tsx). */
  codeSlot: React.ReactNode;
};

export function PredictTheHandshake({ codeSlot }: Props) {
  const [answered, setAnswered] = useState<null | { correct: boolean }>(null);
  const swooshFiredRef = useRef(false);

  return (
    <WidgetShell
      title="predict the handshake"
      measurements={
        answered === null
          ? "1 message in · ? back"
          : answered.correct
            ? "got it"
            : "worth re-reading"
      }
      caption={
        answered === null ? (
          <>
            <CaptionCue>What comes back next?</CaptionCue> The client just
            opened a session. Most readers expect a tool list — and most are
            wrong. The gap between the intuitive guess and the real answer is
            the whole shape of MCP.
          </>
        ) : answered.correct ? (
          <>
            <CaptionCue>You&apos;ve seen this dance before.</CaptionCue> Now
            we&apos;ll trace why every MCP server in the world is built on this
            single negotiation — and what rides it after.
          </>
        ) : (
          <>
            <CaptionCue>Most readers pick option 1.</CaptionCue> MCP doesn&apos;t
            dump a manifest — it negotiates a contract first. Keep this snippet
            in mind; by §3 the right answer will look obvious.
          </>
        )
      }
      captionTone="prominent"
    >
      <div className="flex flex-col gap-[var(--spacing-sm)]">
        {codeSlot}

        <Quiz
          question={null}
          options={OPTIONS}
          correctId={CORRECT_ID}
          onAnswered={(correct) => {
            setAnswered({ correct });
            if (!swooshFiredRef.current) {
              swooshFiredRef.current = true;
              playSound("Swoosh");
            }
          }}
          rightVerdict={
            <>
              <span style={{ color: "var(--color-accent)" }}>answer</span>
              {"  "}
              <span style={{ color: "var(--color-text)" }}>
                The server replies with its capabilities; the client confirms
                with a fire-and-forget <code className="font-mono">notifications/initialized</code>.
                Tools come later, on demand.
              </span>
            </>
          }
          wrongVerdict={
            <>
              <span style={{ color: "var(--color-accent)" }}>answer</span>
              {"  "}
              <span style={{ color: "var(--color-text)" }}>
                The server replies with its capabilities; the client confirms
                with a fire-and-forget <code className="font-mono">notifications/initialized</code>.
                Tools come later, on demand.
              </span>
            </>
          }
          randomize
        />
      </div>
    </WidgetShell>
  );
}
