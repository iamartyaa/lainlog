"use client";

/**
 * PrimitivePicker — LOAD-BEARING widget for chapter 5.
 *
 * The chapter's lesson IS the discipline of picking the right primitive for
 * an integration. The opener and the payoff are the same widget: forced
 * practice across six integration sketches, each resolving with a verdict
 * that names the controller axis (model / application / user).
 *
 * Per the issue brief and §12.1 of the voice profile, the wrong-answer
 * verdict creates the demand for the chapter's reframe. Most readers default
 * to "tool" because of the function-calling habit; the picker exposes that
 * habit immediately.
 *
 * Design constraints honoured:
 * - Single accent (terracotta) — wrong picks read via desaturated muted
 *   border + a small nod, never red. Right picks pulse + spark.
 * - Mobile-first: pills stack vertically below the `quiz` container query
 *   breakpoint; tap targets stay >= 44px.
 * - Reduced motion: snap + opacity; no nod, no pulse, no spark.
 * - Frame-stable verdict slot — its min-height is reserved before any pick.
 * - aria-live="polite" on verdict + progress announcements.
 *
 * Pedagogical structure (matches issue's narrative arc):
 * 1. Scenario panel reads as prose. Reader picks tool / resource / prompt.
 * 2. Verdict reveals the right answer + names the controller.
 * 3. Score chips at top track [visited / 6]; the final card unlocks a
 *    summary recap of the controller table — the chapter's spine.
 *
 * Reuses the WidgetShell scaffold; no fork of the Quiz primitive — this
 * widget needs running-score + multi-card flow that Quiz doesn't model.
 */

import { useCallback, useMemo, useReducer, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ClickSpark } from "@/components/fancy/click-spark";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { SPRING } from "@/lib/motion";
import { playSound } from "@/lib/audio";

type Primitive = "tool" | "resource" | "prompt";

type Scenario = {
  /** Stable id; used for keys only. */
  id: string;
  /** What the integration is supposed to expose, in one line. */
  prompt: React.ReactNode;
  /** Right answer. */
  correct: Primitive;
  /** Verdict for the right pick — names the controller and why. */
  rightVerdict: React.ReactNode;
  /** Verdict for any wrong pick — corrects the misconception. */
  wrongVerdict: React.ReactNode;
};

const SCENARIOS: Scenario[] = [
  {
    id: "search-flights",
    prompt: (
      <>
        A travel server wants to expose <em>search for flights between two
        airports on a date</em>. The model should be able to invoke this when
        the user asks about a trip.
      </>
    ),
    correct: "tool",
    rightVerdict: (
      <>
        <strong>tool</strong> — model-controlled. The LLM decides when to
        invoke an action with side-effects (or external lookups). Tools are
        the right default for <em>verbs</em>: search, send, create, convert.
      </>
    ),
    wrongVerdict: (
      <>
        This is an action the model needs to invoke during reasoning — that
        makes it a <strong>tool</strong> (model-controlled). Resources are
        passive context the host surfaces; prompts are user-typed templates.
      </>
    ),
  },
  {
    id: "calendar-events",
    prompt: (
      <>
        The same server wants to expose the user&apos;s calendar events for
        a given year — the host should fold them into context when the
        conversation touches scheduling.
      </>
    ),
    correct: "resource",
    rightVerdict: (
      <>
        <strong>resource</strong> — application-controlled. The <em>host</em>
        {" "}decides when to surface this as context; the model never invokes
        a resource directly. URI-template addressed:
        {" "}<code style={{ fontFamily: "var(--font-mono)" }}>
          calendar://events/{"{year}"}
        </code>.
      </>
    ),
    wrongVerdict: (
      <>
        Calendar events are <em>context</em>, not action. The host decides
        when to fetch and show them. That makes it a <strong>resource</strong>
        {" "}(application-controlled). If you ship it as a tool, the LLM will
        call it on every turn that touches scheduling.
      </>
    ),
  },
  {
    id: "summarize-pr",
    prompt: (
      <>
        A code-review server wants to expose <em>summarize this pull request
        in three bullets</em> as a slash-command the user types in their
        host&apos;s chat input.
      </>
    ),
    correct: "prompt",
    rightVerdict: (
      <>
        <strong>prompt</strong> — user-controlled. Prompts surface in hosts as
        slash-commands; the human invokes them deliberately. Templated
        arguments fill in at invocation:
        {" "}<code style={{ fontFamily: "var(--font-mono)" }}>
          /summarize-pr {"{repo}"} {"{number}"}
        </code>.
      </>
    ),
    wrongVerdict: (
      <>
        The user explicitly invokes this with a slash-command — that&apos;s the
        signature of a <strong>prompt</strong> (user-controlled). Tools fire
        on the model&apos;s decision; resources fire on the host&apos;s
        decision; prompts fire on the user&apos;s.
      </>
    ),
  },
  {
    id: "db-schema",
    prompt: (
      <>
        A database server wants to expose its schema — table names, columns,
        types — so the host can fold the right table&apos;s shape into
        context whenever a query is being drafted.
      </>
    ),
    correct: "resource",
    rightVerdict: (
      <>
        <strong>resource</strong> — application-controlled. Schemas are
        reference context the host surfaces selectively (via URI template:
        {" "}<code style={{ fontFamily: "var(--font-mono)" }}>
          db://schema/{"{table}"}
        </code>). Listing every schema as a tool would invite the model to
        scan them on every turn.
      </>
    ),
    wrongVerdict: (
      <>
        Schema is <em>read-only reference</em> the host folds into context.
        That&apos;s a <strong>resource</strong>. The function-calling instinct
        wants to make this a tool — but a tool would let the LLM scan the
        schema on every turn it touches the database.
      </>
    ),
  },
  {
    id: "convert-currency",
    prompt: (
      <>
        A finance server wants the model to be able to convert <em>100 USD to
        JPY at today&apos;s rate</em> mid-reasoning, so it can answer a
        traveler&apos;s budget question on the fly.
      </>
    ),
    correct: "tool",
    rightVerdict: (
      <>
        <strong>tool</strong> — model-controlled. Mid-reasoning lookups with
        a clear input contract (amount, from, to) are the textbook tool
        shape. JSON-Schema parameters; structured response.
      </>
    ),
    wrongVerdict: (
      <>
        This is an on-demand action the model invokes during reasoning, with
        typed parameters — that makes it a <strong>tool</strong>. Resources
        don&apos;t take typed inputs; prompts surface to the user, not the
        model.
      </>
    ),
  },
  {
    id: "plan-vacation",
    prompt: (
      <>
        That same travel server wants to ship a <em>plan a vacation</em>{" "}
        starting template the user can invoke from a chat input — fills in
        with destination, budget, and trip length to scaffold a plan.
      </>
    ),
    correct: "prompt",
    rightVerdict: (
      <>
        <strong>prompt</strong> — user-controlled. The user types
        {" "}<code style={{ fontFamily: "var(--font-mono)" }}>/plan-vacation</code>
        {" "}with arguments; the host expands the template into a starting
        message. Prompts are how servers <em>teach</em> users to start
        complex requests.
      </>
    ),
    wrongVerdict: (
      <>
        The human invokes this from a chat input via slash-command. That&apos;s
        a <strong>prompt</strong>. Tools fire on the LLM&apos;s decision and
        wouldn&apos;t be discoverable to the user; resources are passive
        context, not interactive starting points.
      </>
    ),
  },
];

type State = {
  /** Index into SCENARIOS. */
  cursor: number;
  /** Picked answer per scenario id; undefined if not yet picked. */
  picks: Record<string, Primitive | undefined>;
};

type Action =
  | { type: "pick"; id: string; choice: Primitive }
  | { type: "next" }
  | { type: "reset" };

const initial: State = { cursor: 0, picks: {} };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "pick": {
      // Lock-in: only the first pick on a scenario counts toward the score
      // (otherwise the reader could "study" the verdict and re-pick).
      if (state.picks[action.id] !== undefined) return state;
      return { ...state, picks: { ...state.picks, [action.id]: action.choice } };
    }
    case "next": {
      return { ...state, cursor: Math.min(state.cursor + 1, SCENARIOS.length) };
    }
    case "reset": {
      return initial;
    }
    default:
      return state;
  }
}

const PRIMITIVES: { id: Primitive; label: string; controller: string }[] = [
  { id: "tool", label: "tool", controller: "model" },
  { id: "resource", label: "resource", controller: "application" },
  { id: "prompt", label: "prompt", controller: "user" },
];

const NOD_KEYFRAMES = [0, -6, 6, -4, 4, 0];

export function PrimitivePicker() {
  const reduce = useReducedMotion();
  const [state, dispatch] = useReducer(reducer, initial);

  const total = SCENARIOS.length;
  const onLast = state.cursor >= total;
  const visible = onLast ? null : SCENARIOS[state.cursor];

  // Score = correct picks across all answered scenarios.
  const score = useMemo(() => {
    return SCENARIOS.reduce((acc, s) => {
      return state.picks[s.id] === s.correct ? acc + 1 : acc;
    }, 0);
  }, [state.picks]);

  const handlePick = useCallback(
    (id: string, choice: Primitive) => {
      const already = state.picks[id] !== undefined;
      if (already) return;
      const correct =
        SCENARIOS.find((s) => s.id === id)?.correct === choice;
      playSound("Click");
      dispatch({ type: "pick", id, choice });
      // Verdict cue lands ~150ms later, like Quiz.
      setTimeout(() => {
        playSound(correct ? "Success" : "Error");
      }, 150);
    },
    [state.picks],
  );

  return (
    <WidgetShell
      title="Pick the primitive"
      caption={
        <>
          Six integration sketches. Predict before you read the verdict — the
          chapter exists because most readers default to <em>tool</em> for all
          six. The wrong-answer verdict is the lesson.
        </>
      }
    >
      <style>{`
        .bs-pp-progress {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-md);
          font-family: var(--font-sans);
          font-size: var(--text-small);
          color: var(--color-text-muted);
        }
        .bs-pp-dots {
          display: flex;
          gap: 6px;
        }
        .bs-pp-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: color-mix(in oklab, var(--color-text-muted) 30%, transparent);
        }
        .bs-pp-dot[data-state="answered"] {
          background: var(--color-accent);
        }
        .bs-pp-dot[data-state="current"] {
          background: var(--color-text-muted);
          outline: 2px solid var(--color-accent);
          outline-offset: 1px;
        }
        .bs-pp-prompt {
          font-family: var(--font-serif);
          font-size: var(--text-body);
          line-height: 1.6;
          color: var(--color-text);
          margin-bottom: var(--spacing-md);
        }
        .bs-pp-pills {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--spacing-2xs);
          margin-bottom: var(--spacing-sm);
        }
        @container (min-width: 480px) {
          .bs-pp-pills {
            grid-template-columns: 1fr 1fr 1fr;
          }
        }
        .bs-pp-pill {
          width: 100%;
          min-height: 44px;
          padding: 12px 16px;
          font-family: var(--font-sans);
          font-size: var(--text-ui);
          line-height: 1.4;
          text-align: center;
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-rule);
          background: color-mix(in oklab, var(--color-surface) 60%, transparent);
          color: var(--color-text);
          cursor: pointer;
          transition: background 200ms, color 200ms, border-color 200ms, opacity 200ms;
        }
        .bs-pp-pill:hover:not(:disabled) {
          background: color-mix(in oklab, var(--color-accent) 8%, transparent);
        }
        .bs-pp-pill:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }
        .bs-pp-pill:disabled {
          cursor: default;
        }
        .bs-pp-pill-controller {
          display: block;
          font-size: var(--text-small);
          color: var(--color-text-muted);
          margin-top: 2px;
          letter-spacing: 0.02em;
        }
        .bs-pp-verdict-slot {
          min-height: 5em;
        }
        .bs-pp-verdict {
          font-family: var(--font-serif);
          font-size: var(--text-small);
          line-height: 1.6;
          color: var(--color-text-muted);
        }
        .bs-pp-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: var(--spacing-sm);
        }
        .bs-pp-next {
          background: var(--color-accent);
          color: var(--color-bg);
          border: none;
          font-family: var(--font-sans);
          font-size: var(--text-ui);
          padding: 10px 20px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          min-height: 44px;
        }
        .bs-pp-next:hover {
          filter: brightness(1.05);
        }
        .bs-pp-next:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }
        .bs-pp-summary {
          font-family: var(--font-serif);
          font-size: var(--text-body);
          line-height: 1.65;
          color: var(--color-text);
        }
        .bs-pp-summary-strong {
          font-family: var(--font-sans);
          font-size: var(--text-h3);
          color: var(--color-text);
          margin-bottom: var(--spacing-sm);
        }
        .bs-pp-axis {
          margin-top: var(--spacing-md);
          padding: var(--spacing-sm) var(--spacing-md);
          background: color-mix(in oklab, var(--color-surface) 60%, transparent);
          border-left: 2px solid var(--color-accent);
          border-radius: var(--radius-sm);
        }
        .bs-pp-axis-row {
          display: grid;
          grid-template-columns: 7em 1fr;
          gap: var(--spacing-2xs);
          font-size: var(--text-small);
          line-height: 1.5;
        }
        .bs-pp-axis-row + .bs-pp-axis-row { margin-top: 4px; }
        .bs-pp-reset {
          background: transparent;
          border: none;
          color: var(--color-text-muted);
          font-family: var(--font-sans);
          font-size: var(--text-small);
          padding: 8px 4px;
          cursor: pointer;
          text-decoration: underline;
          text-decoration-style: dotted;
          text-underline-offset: 4px;
        }
        .bs-pp-reset:hover { color: var(--color-text); }
        .bs-pp-reset:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }
      `}</style>

      <div style={{ containerType: "inline-size" }}>
        <div className="bs-pp-progress">
          <span aria-live="polite">
            {onLast
              ? `complete — ${score} / ${total}`
              : `scenario ${state.cursor + 1} of ${total}`}
          </span>
          <div className="bs-pp-dots" aria-hidden>
            {SCENARIOS.map((s, i) => {
              const answered = state.picks[s.id] !== undefined;
              const current = !onLast && i === state.cursor;
              const dotState = answered
                ? "answered"
                : current
                  ? "current"
                  : "pending";
              return <span key={s.id} className="bs-pp-dot" data-state={dotState} />;
            })}
          </div>
        </div>

        {visible ? (
          <ScenarioCard
            key={visible.id}
            scenario={visible}
            choice={state.picks[visible.id]}
            onPick={(c) => handlePick(visible.id, c)}
            onNext={() => dispatch({ type: "next" })}
            reduce={!!reduce}
          />
        ) : (
          <Summary
            picks={state.picks}
            score={score}
            total={total}
            onReset={() => dispatch({ type: "reset" })}
          />
        )}
      </div>
    </WidgetShell>
  );
}

function ScenarioCard({
  scenario,
  choice,
  onPick,
  onNext,
  reduce,
}: {
  scenario: Scenario;
  choice: Primitive | undefined;
  onPick: (c: Primitive) => void;
  onNext: () => void;
  reduce: boolean;
}) {
  const revealed = choice !== undefined;
  const correct = revealed && choice === scenario.correct;
  const verdict = revealed
    ? correct
      ? scenario.rightVerdict
      : scenario.wrongVerdict
    : null;

  return (
    <div role="group" aria-label="primitive picker scenario">
      <div className="bs-pp-prompt">{scenario.prompt}</div>

      <div className="bs-pp-pills" role="radiogroup" aria-label="primitive choice">
        {PRIMITIVES.map((p) => {
          const isChosen = choice === p.id;
          const isCorrectMark = revealed && p.id === scenario.correct;
          const isWrongChosen = revealed && isChosen && !correct;
          const dim = revealed && !isChosen && !isCorrectMark;

          const animate =
            !reduce && revealed && isChosen
              ? correct
                ? { scale: [1, 1.04, 1] as number[] }
                : { x: NOD_KEYFRAMES }
              : { scale: 1, x: 0 };

          const transition =
            !reduce && revealed && isChosen
              ? correct
                ? { duration: 0.25, times: [0, 0.5, 1] }
                : { duration: 0.35, ease: "easeInOut" as const }
              : SPRING.gentle;

          const button = (
            <motion.button
              type="button"
              role="radio"
              aria-checked={isChosen}
              onClick={() => onPick(p.id)}
              disabled={revealed}
              whileTap={revealed || reduce ? undefined : { scale: 0.97 }}
              animate={animate}
              transition={transition}
              className="bs-pp-pill"
              style={{
                borderColor: isCorrectMark
                  ? "var(--color-accent)"
                  : isWrongChosen
                    ? "color-mix(in oklab, var(--color-text-muted) 70%, transparent)"
                    : isChosen
                      ? "var(--color-accent)"
                      : "var(--color-rule)",
                background: isCorrectMark
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
              <span>{p.label}</span>
              <span className="bs-pp-pill-controller">{p.controller}-controlled</span>
            </motion.button>
          );

          return (
            <div key={p.id} style={{ display: "block" }}>
              {isCorrectMark && revealed ? (
                <ClickSpark>{button}</ClickSpark>
              ) : (
                button
              )}
            </div>
          );
        })}
      </div>

      <div className="bs-pp-verdict-slot" aria-live="polite">
        {revealed ? (
          <motion.div
            key={correct ? "right" : "wrong"}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={SPRING.gentle}
            className="bs-pp-verdict"
          >
            {verdict}
          </motion.div>
        ) : null}
      </div>

      {revealed ? (
        <div className="bs-pp-actions">
          <button type="button" onClick={onNext} className="bs-pp-next">
            next →
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Summary({
  picks,
  score,
  total,
  onReset,
}: {
  picks: Record<string, Primitive | undefined>;
  score: number;
  total: number;
  onReset: () => void;
}) {
  // Find the controller axis the reader stumbled on most — useful as the
  // closing nudge ("you most often missed the user-controlled answer").
  const missesByCorrect = useMemo(() => {
    const acc: Record<Primitive, number> = { tool: 0, resource: 0, prompt: 0 };
    for (const s of SCENARIOS) {
      const pick = picks[s.id];
      if (pick !== undefined && pick !== s.correct) {
        acc[s.correct] += 1;
      }
    }
    return acc;
  }, [picks]);

  const worstAxis = useMemo<Primitive | null>(() => {
    let worst: Primitive | null = null;
    let max = 0;
    (Object.keys(missesByCorrect) as Primitive[]).forEach((k) => {
      if (missesByCorrect[k] > max) {
        max = missesByCorrect[k];
        worst = k;
      }
    });
    return worst;
  }, [missesByCorrect]);

  const axisGloss: Record<Primitive, string> = {
    tool: "the LLM decides when",
    resource: "the host decides what surfaces",
    prompt: "the human invokes via slash-command",
  };

  return (
    <div role="region" aria-label="picker summary" className="bs-pp-summary">
      <div className="bs-pp-summary-strong">
        {score} of {total} — that&apos;s the controller question, six times.
      </div>
      <p style={{ margin: 0 }}>
        Three primitives. Three controllers. Memorise the shape:
      </p>
      <div className="bs-pp-axis" aria-label="controller axis">
        <div className="bs-pp-axis-row">
          <strong style={{ fontFamily: "var(--font-sans)" }}>tool</strong>
          <span>model-controlled — {axisGloss.tool}</span>
        </div>
        <div className="bs-pp-axis-row">
          <strong style={{ fontFamily: "var(--font-sans)" }}>resource</strong>
          <span>application-controlled — {axisGloss.resource}</span>
        </div>
        <div className="bs-pp-axis-row">
          <strong style={{ fontFamily: "var(--font-sans)" }}>prompt</strong>
          <span>user-controlled — {axisGloss.prompt}</span>
        </div>
      </div>
      {worstAxis ? (
        <p style={{ marginTop: "var(--spacing-md)", marginBottom: 0 }}>
          You most often missed answers that were really{" "}
          <strong>{worstAxis}</strong>s — the {axisGloss[worstAxis]} axis. Read
          on; the next sections name each primitive directly.
        </p>
      ) : (
        <p style={{ marginTop: "var(--spacing-md)", marginBottom: 0 }}>
          Six for six. The chapter still has the controller table, the URI
          template builder, and a worked travel-server — keep reading.
        </p>
      )}
      <div className="bs-pp-actions" style={{ marginTop: "var(--spacing-sm)" }}>
        <button type="button" onClick={onReset} className="bs-pp-reset">
          start over
        </button>
      </div>
    </div>
  );
}

export default PrimitivePicker;
