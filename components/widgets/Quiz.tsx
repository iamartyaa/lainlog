"use client";

/**
 * <Quiz> — reusable wrapper for "predict / pick the right answer" widgets.
 *
 * Renders a question, randomised options, and a verdict. On the correct pick
 * the chosen option pulses and emits a small terracotta spark burst (via the
 * vendored ClickSpark primitive). On a wrong pick the chosen option nods
 * (keyframe shake) and the correct option highlights so the reader still
 * leaves with the answer. Frame-stable: the verdict slot reserves height
 * before any answer is given (R6 from the SVG cover playbook applies to
 * widgets too).
 *
 * Single accent (DESIGN.md §3): "wrong" reads via desaturated muted border
 * + nod + verdict copy — never red. "Right" reads via terracotta highlight +
 * pulse + sparks — never green.
 *
 * Reduced motion (DESIGN.md §9): nod and pulse collapse to opacity-only;
 * ClickSpark renders as a no-op (no canvas, no rAF). Verdict still reveals.
 *
 * Mobile-first: options stack as a 1-col grid on narrow containers and shift
 * to a 2-col grid at the `quiz` container query breakpoint. Tap targets stay
 * ≥ 44px (DESIGN.md §11).
 *
 * Accessibility: `role="radiogroup"`, each option `role="radio"` with
 * `aria-checked`. The verdict region is `aria-live="polite"`. Arrow keys
 * navigate between options; Enter / Space selects.
 */

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ClickSpark } from "@/components/fancy/click-spark";
import { SPRING } from "@/lib/motion";
import { playSound } from "@/lib/audio";

export type QuizOption = {
  /** Stable id used to check correctness — preserved across shuffles. */
  id: string;
  /** What the reader sees — text or rich. */
  label: React.ReactNode;
};

export type QuizProps = {
  /** The question content — could be prose, code, anything. */
  question: React.ReactNode;
  options: QuizOption[];
  /** Which option.id is correct. */
  correctId: string;
  /** Called once with `(correct, chosenId)` when the reader picks. */
  onAnswered?: (correct: boolean, chosenId: string) => void;
  /** Shuffle options on mount. Default true. */
  randomize?: boolean;
  /** Verdict copy for the right pick. */
  rightVerdict?: React.ReactNode;
  /** Verdict copy for a wrong pick (or reveal-answer route). */
  wrongVerdict?: React.ReactNode;
  /** Show a "reveal answer" escape hatch. Default true. */
  revealable?: boolean;
};

/** Fisher–Yates — seeded by Math.random() on the call. Pure on the input array. */
function shuffle<T>(input: readonly T[]): T[] {
  const out = input.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const NOD_KEYFRAMES = [0, -6, 6, -4, 4, 0];

export function Quiz({
  question,
  options,
  correctId,
  onAnswered,
  randomize = true,
  rightVerdict,
  wrongVerdict,
  revealable = true,
}: QuizProps) {
  const reduce = useReducedMotion();
  const groupName = useId();

  // Shuffle once on mount (or use as-given) — lazy init so the order is stable
  // across re-renders. Only re-shuffles on a fresh mount (= page reload).
  const [shuffled] = useState<QuizOption[]>(() =>
    randomize ? shuffle(options) : options.slice()
  );

  const [chosenId, setChosenId] = useState<string | null>(null);
  /** "revealed" subsumes both the right-path and wrong-path answered state. */
  const [revealed, setRevealed] = useState(false);
  /** Distinct from `chosenId === correctId` because reveal-answer routes to
   *  wrong-path without setting `chosenId`. */
  const [outcome, setOutcome] = useState<"right" | "wrong" | null>(null);

  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const onAnsweredRef = useRef(onAnswered);
  useEffect(() => {
    onAnsweredRef.current = onAnswered;
  }, [onAnswered]);

  const handlePick = useCallback(
    (id: string) => {
      if (revealed) return;
      const correct = id === correctId;
      // Option-press click feedback — fires before the verdict so the two
      // sounds land ~250ms apart (verdict animation lag handles the gap).
      // Throttle in lib/audio won't suppress because the names differ.
      playSound("Click");
      setChosenId(id);
      setRevealed(true);
      setOutcome(correct ? "right" : "wrong");
      // Verdict cue — paired with the existing pulse / nod visual.
      playSound(correct ? "Success" : "Error");
      onAnsweredRef.current?.(correct, id);
    },
    [correctId, revealed]
  );

  const handleReveal = useCallback(() => {
    if (revealed) return;
    // "Reveal answer" routes to wrong-path. Same Error cue as a wrong pick
    // so the audio vocabulary stays consistent.
    playSound("Error");
    setChosenId(null);
    setRevealed(true);
    setOutcome("wrong");
  }, [revealed]);

  // Roving keyboard nav: ArrowDown / ArrowRight → next, ArrowUp / ArrowLeft →
  // prev. Enter / Space invokes the button (browser-native — no extra wiring).
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (revealed) return;
      const last = shuffled.length - 1;
      let next = index;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        next = index === last ? 0 : index + 1;
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        next = index === 0 ? last : index - 1;
      } else {
        return;
      }
      e.preventDefault();
      buttonRefs.current[next]?.focus();
    },
    [revealed, shuffled.length]
  );

  const verdictNode = useMemo(() => {
    if (!revealed || !outcome) return null;
    return outcome === "right" ? rightVerdict : wrongVerdict;
  }, [revealed, outcome, rightVerdict, wrongVerdict]);

  return (
    <div
      className="bs-quiz"
      style={{
        // Container query target — `@container quiz` flips the option grid.
        containerType: "inline-size",
        containerName: "quiz",
      }}
    >
      {/* Scoped grid + verdict-slot styles. Keeping them inline avoids a global
          stylesheet for one widget; the `bs-quiz` namespace prevents leakage. */}
      <style>{`
        .bs-quiz-options {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--spacing-2xs);
        }
        @container quiz (min-width: 480px) {
          .bs-quiz-options {
            grid-template-columns: 1fr 1fr;
          }
        }
        .bs-quiz-option {
          width: 100%;
          min-height: 44px;
          padding: 10px 12px;
          font-size: var(--text-ui);
          line-height: 1.45;
          text-align: left;
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-rule);
          background: color-mix(in oklab, var(--color-surface) 60%, transparent);
          color: var(--color-text);
          cursor: pointer;
          transition: background 200ms, color 200ms, border-color 200ms, opacity 200ms;
        }
        .bs-quiz-option:hover:not(:disabled) {
          background: color-mix(in oklab, var(--color-accent) 8%, transparent);
        }
        .bs-quiz-option:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }
        .bs-quiz-option:disabled {
          cursor: default;
        }
        .bs-quiz-verdict {
          min-height: 2.5em;
        }
        .bs-quiz-reveal {
          background: transparent;
          border: none;
          color: var(--color-text-muted);
          font-size: var(--text-small);
          padding: 8px 4px;
          cursor: pointer;
          text-decoration: underline;
          text-decoration-style: dotted;
          text-underline-offset: 4px;
          align-self: flex-start;
        }
        .bs-quiz-reveal:hover { color: var(--color-text); }
        .bs-quiz-reveal:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }
      `}</style>

      <div className="flex flex-col gap-[var(--spacing-sm)]">
        <div>{question}</div>

        <div
          role="radiogroup"
          aria-label="quiz options"
          className="bs-quiz-options"
        >
          {shuffled.map((opt, i) => {
            const isChosen = chosenId === opt.id;
            const isCorrect = opt.id === correctId;
            const isWrongChosen = revealed && isChosen && !isCorrect;
            const showCorrectMark = revealed && isCorrect;
            // Other options dim once revealed (whether they were chosen-wrong
            // or untouched — leaves the eye on the chosen + correct pair).
            const dim = revealed && !isChosen && !isCorrect;

            // Animation choices:
            // - Right pick: one-shot scale pulse 1 → 1.04 → 1.
            // - Wrong pick: one-shot x-keyframe nod (-6, 6, -4, 4, 0) ~ 350ms.
            // - Both collapse to a still frame under reduced motion.
            const animate =
              !reduce && revealed && isChosen
                ? isCorrect
                  ? { scale: [1, 1.04, 1] as number[] }
                  : { x: NOD_KEYFRAMES }
                : { scale: 1, x: 0 };

            const transition =
              !reduce && revealed && isChosen
                ? isCorrect
                  ? { duration: 0.25, times: [0, 0.5, 1] }
                  : { duration: 0.35, ease: "easeInOut" as const }
                : SPRING.gentle;

            const button = (
              <motion.button
                ref={(el) => {
                  buttonRefs.current[i] = el;
                }}
                type="button"
                role="radio"
                aria-checked={isChosen}
                name={groupName}
                tabIndex={
                  // Roving tabindex — first option focusable until something is
                  // chosen, then the chosen one. Once revealed, none.
                  revealed
                    ? -1
                    : chosenId === null
                      ? i === 0
                        ? 0
                        : -1
                      : isChosen
                        ? 0
                        : -1
                }
                onClick={() => handlePick(opt.id)}
                onKeyDown={(e) => onKeyDown(e, i)}
                disabled={revealed}
                whileTap={revealed || reduce ? undefined : { scale: 0.97 }}
                animate={animate}
                transition={transition}
                className="bs-quiz-option"
                style={{
                  // Border + background highlight by state. No reds, no greens —
                  // wrong reads via desaturated-muted border + the nod itself.
                  borderColor: showCorrectMark
                    ? "var(--color-accent)"
                    : isWrongChosen
                      ? "color-mix(in oklab, var(--color-text-muted) 70%, transparent)"
                      : isChosen
                        ? "var(--color-accent)"
                        : "var(--color-rule)",
                  background: showCorrectMark
                    ? "color-mix(in oklab, var(--color-accent) 16%, transparent)"
                    : isWrongChosen
                      ? "color-mix(in oklab, var(--color-accent) 6%, transparent)"
                      : isChosen
                        ? "color-mix(in oklab, var(--color-accent) 12%, transparent)"
                        : undefined,
                  opacity: dim ? 0.5 : 1,
                  filter: isWrongChosen ? "saturate(0.4)" : undefined,
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  {showCorrectMark ? (
                    <span aria-hidden style={{ color: "var(--color-accent)", fontSize: 12 }}>
                      ✓
                    </span>
                  ) : null}
                  <span>{opt.label}</span>
                </span>
              </motion.button>
            );

            // Wrap the correct option in <ClickSpark> so a correct click emits
            // a terracotta spark burst around the button. ClickSpark is a
            // no-op under reduced motion (renders children only).
            return (
              <div key={opt.id} style={{ display: "block" }}>
                {isCorrect ? <ClickSpark>{button}</ClickSpark> : button}
              </div>
            );
          })}
        </div>

        {revealable && !revealed ? (
          <button type="button" onClick={handleReveal} className="bs-quiz-reveal">
            reveal answer
          </button>
        ) : null}

        {/* Verdict slot — fixed min-height so the container is the same size
            before and after answering. Frame-stable per R6. */}
        <div className="bs-quiz-verdict" aria-live="polite">
          <AnimatePresence initial={false} mode="wait">
            {revealed && verdictNode ? (
              <motion.div
                key={outcome}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={SPRING.gentle}
                style={{
                  fontSize: "var(--text-small)",
                  color: "var(--color-text-muted)",
                  lineHeight: 1.6,
                }}
              >
                {verdictNode}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default Quiz;
