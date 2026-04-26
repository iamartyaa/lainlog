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
 * The article's opening hook. The reader sees a deliberately hard snippet —
 * sync + macro + micro + chained-Promise + await — and must guess the output.
 * Most readers should fail. The verdict copy steers wrong-guessers into the
 * article ("now we'll learn how"); right-guessers get a "let's see why".
 *
 * The snippet stays visible after the answer reveals — it's the article's
 * anchor, referenced in §3, §5, and the closer.
 *
 * Correct trace (verified):
 *   sync:       A, F, H
 *   microtask:  C  (the .then prints C, then returns Promise.resolve("D")
 *                   — but adopting that thenable costs two extra microtask
 *                   hops, so D is delayed)
 *   microtask:  E  (queueMicrotask)
 *   microtask:  G  (await null continuation — one hop)
 *   microtask:  D  (the chained .then((d) => log(d)) finally fires)
 *   task:       B  (setTimeout drains last)
 *   →  A · F · H · C · E · G · D · B
 *
 * As of PR #58 the multi-choice / pulse / nod / verdict logic is delegated
 * to the shared <Quiz> wrapper. We retain WidgetShell for the outer chrome
 * (title, measurements strip, caption tone) and lift just enough state out
 * of <Quiz> via `onAnswered` so the shell's measurements + caption reflect
 * the post-answer state.
 * --------------------------------------------------------------------------*/

const SEP = "·";
const CORRECT_ID = "afhcegdb"; // canonical option id

const OPTIONS = [
  // correct
  { id: "afhcegdb", tokens: ["A", "F", "H", "C", "E", "G", "D", "B"] },
  // common wrong: forgets the chained-Promise extra hops
  { id: "afhcedgb", tokens: ["A", "F", "H", "C", "E", "D", "G", "B"] },
  // forgot await is a microtask
  { id: "afghcedb", tokens: ["A", "F", "G", "H", "C", "E", "D", "B"] },
  // thinks setTimeout(0) outranks microtasks
  { id: "afhbcegd", tokens: ["A", "F", "H", "B", "C", "E", "G", "D"] },
];

function tokensToLine(tokens: string[]) {
  return tokens.join(` ${SEP} `);
}

/**
 * PredictTheStart (W0) — the article's opening hook. A hard snippet the
 * reader is expected to fail; the verdict steers them into the rest of the
 * post.
 *
 * One verb: predict (predict → reveal). The shared <Quiz> wrapper owns
 * shuffle, focus management, sparkle/pulse/nod, and the verdict slot. This
 * widget owns the surrounding shell (title, measurements, caption tone) and
 * threads the answered state through `onAnswered` so the shell's caption +
 * measurements track the same lifecycle the wrapper already drives.
 *
 * Frame stability (R6): code pane has its own min-height via <CodeBlock>;
 * <Quiz>'s verdict slot reserves space before the answer is given.
 *
 * Mobile-first: 360px target. <Quiz> stacks 1-col on narrow containers and
 * shifts to 2-col at the `quiz` container query breakpoint.
 *
 * Code rendering: the article's RSC `page.tsx` pre-renders the opener
 * snippet through `<CodeBlock>` (Shiki, dual-theme) and passes the
 * resulting element in via `codeSlot`.
 */
type Props = {
  /** Pre-rendered Shiki block for the opener snippet (see page.tsx). */
  codeSlot: React.ReactNode;
};

export function PredictTheStart({ codeSlot }: Props) {
  // Mirror just enough of <Quiz>'s internal state to drive the WidgetShell
  // measurements + caption. <Quiz> owns the canonical reveal state; we listen
  // via onAnswered to flip our own.
  const [answered, setAnswered] = useState<null | { correct: boolean }>(null);
  // Swoosh fires once per page-load when the verdict reveals. Quiz already
  // plays Success/Error on the option-press; the Swoosh here is the
  // "verdict landing" cue layered on top of that. Cap to one shot via ref.
  const swooshFiredRef = useRef(false);

  return (
    <WidgetShell
      title="predict the output"
      measurements={
        answered === null
          ? "8 logs · 4 queues"
          : answered.correct
            ? "got it"
            : "most miss this"
      }
      caption={
        answered === null ? (
          <>
            <CaptionCue>Predict the output.</CaptionCue> Pick the order{" "}
            <code className="font-mono">console.log</code> will print. The
            snippet mixes sync code, a timer, two Promises, a microtask, and an{" "}
            <code className="font-mono">await</code>. Most readers get this
            wrong on the first try.
          </>
        ) : answered.correct ? (
          <>
            <CaptionCue>You&apos;ve seen this before.</CaptionCue> Let&apos;s
            see <em>why</em> it produces this output — the rest of the post is
            the trace, line by line.
          </>
        ) : (
          <>
            <CaptionCue>Most readers miss this.</CaptionCue> Now we&apos;ll
            learn <em>how</em> this output emerges. Keep this snippet open —
            every section below points back to a line of it.
          </>
        )
      }
      captionTone="prominent"
    >
      <div className="flex flex-col gap-[var(--spacing-sm)]">
        {codeSlot}

        <Quiz
          question={null}
          options={OPTIONS.map((opt) => ({
            id: opt.id,
            label: (
              <span
                className="font-mono"
                style={{
                  fontSize: 13,
                  letterSpacing: "0.02em",
                  whiteSpace: "nowrap",
                }}
              >
                {tokensToLine(opt.tokens)}
              </span>
            ),
          }))}
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
              <span style={{ color: "var(--color-accent)" }}>output</span>
              {"  "}
              <span
                className="font-mono"
                style={{ color: "var(--color-text)" }}
              >
                {tokensToLine(OPTIONS[0].tokens)}
              </span>
            </>
          }
          wrongVerdict={
            <>
              <span style={{ color: "var(--color-accent)" }}>output</span>
              {"  "}
              <span
                className="font-mono"
                style={{ color: "var(--color-text)" }}
              >
                {tokensToLine(OPTIONS[0].tokens)}
              </span>
            </>
          }
          randomize
        />
      </div>
    </WidgetShell>
  );
}
