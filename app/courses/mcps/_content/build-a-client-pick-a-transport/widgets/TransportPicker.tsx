"use client";

/**
 * TransportPicker — the load-bearing widget for chapter 7.
 *
 * Four deployment scenarios; for each, the reader picks `stdio` or
 * `Streamable HTTP`. The verdict reveals the right answer plus a one-line
 * justification, and on the wrong pick a sentence on what would actually
 * break. The widget walks all four scenarios in sequence — one at a time —
 * with a progress chip (`n / 4`) so the reader feels the weight of the
 * choice landing in real deployments rather than as abstract preference.
 *
 * The four scenarios (in order):
 *   1. local CLI debugger that runs MCP servers as child processes  → stdio
 *   2. SaaS-hosted MCP server consumed by Claude Desktop worldwide  → HTTP
 *   3. enterprise service behind SSO, accessed from VS Code         → HTTP
 *   4. MCP server inside a Cloudflare Worker, public on the net     → HTTP
 *
 * Decisions baked in:
 * - One scenario card visible at a time. `next` advances after a verdict
 *   reveals; the previous card collapses into a tiny tick mark above the
 *   active card so the reader sees the trail of decisions accumulating.
 * - Two big segmented buttons per card — `stdio` and `Streamable HTTP` —
 *   reflow to a single column under 380px container width.
 * - Right pick: button pulses, terracotta highlight; wrong pick: nod.
 *   Reduced motion: pulse + nod collapse to opacity-only.
 * - One accent only — terracotta for "right", desaturated muted for
 *   "wrong". No reds, no greens.
 * - aria-live announces the verdict on every pick.
 * - At the end, a small "all four picked" panel summarises the
 *   trade-off in one sentence: stdio wins where you control both ends and
 *   share a machine; Streamable HTTP wins everywhere else.
 *
 * Pedagogical role: scenario branch (4 paths). Reuses the visual grammar
 * of <Quiz> but lifts the multi-question flow inline rather than pulling
 * in a shared MultiQuiz primitive — that lift is a follow-on per the issue.
 */

import { useCallback, useId, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { SPRING } from "@/lib/motion";
import { ClickSpark } from "@/components/fancy/click-spark";
import { playSound } from "@/lib/audio";

type Choice = "stdio" | "http";

type Scenario = {
  id: string;
  title: string;
  body: React.ReactNode;
  /** The transport the spec / spec deployment patterns recommend. */
  correct: Choice;
  /** Verdict for the right pick — one short sentence. */
  rightVerdict: React.ReactNode;
  /**
   * Verdict for picking stdio when HTTP was right (or vice versa) — the
   * "what would break" sentence. Indexed by the pick the reader made,
   * keyed by the wrong choice so each scenario has a single tailored
   * sentence (the wrong pick is always the *other* one).
   */
  wrongVerdict: React.ReactNode;
};

const SCENARIOS: Scenario[] = [
  {
    id: "local-cli",
    title: "Local CLI debugger",
    body: (
      <>
        You&apos;re building a local CLI debugger that spawns MCP
        servers as child processes — same machine, same user, no auth
        boundary, fastest possible round trip. Which transport does the
        spec point you at?
      </>
    ),
    correct: "stdio",
    rightVerdict: (
      <>
        <strong>stdio</strong> — same machine, no auth boundary, process
        I/O is the cheapest wire you can buy.
      </>
    ),
    wrongVerdict: (
      <>
        Streamable HTTP would work, but you&apos;d be standing up a
        local web server, opening a port, and paying TLS / parsing
        overhead to talk to a process you already control. stdio is the
        right answer; the chapter&apos;s "trust + locality" rule fires
        here.
      </>
    ),
  },
  {
    id: "saas-claude-desktop",
    title: "SaaS MCP server, Claude Desktop users worldwide",
    body: (
      <>
        You&apos;re shipping a SaaS-hosted MCP server consumed by Claude
        Desktop users on every continent. Each user is on a different
        machine; auth, billing, and rate-limiting all live at the HTTP
        layer. Which transport?
      </>
    ),
    correct: "http",
    rightVerdict: (
      <>
        <strong>Streamable HTTP</strong> — clients are remote, auth is
        at HTTP, and the spec&apos;s session header is exactly the
        substrate billing and rate-limiting want.
      </>
    ),
    wrongVerdict: (
      <>
        stdio assumes the client and server share a machine. They
        don&apos;t — your users are everywhere. There&apos;s no way for
        Claude Desktop on a laptop in São Paulo to spawn a process on
        your servers in Virginia. Streamable HTTP is the only fit.
      </>
    ),
  },
  {
    id: "enterprise-sso",
    title: "Enterprise service behind SSO, accessed from VS Code",
    body: (
      <>
        An internal MCP server sits behind your company&apos;s SSO,
        accessed from VS Code over the corporate VPN. Every request
        carries an OAuth bearer token; the auth boundary is the HTTP
        request. Which transport?
      </>
    ),
    correct: "http",
    rightVerdict: (
      <>
        <strong>Streamable HTTP</strong> — the auth boundary is the
        request, the transport already speaks{" "}
        <code style={{ fontFamily: "var(--font-mono)" }}>
          Authorization
        </code>{" "}
        headers, and OAuth scoping is one boundary instead of two.
      </>
    ),
    wrongVerdict: (
      <>
        stdio has no auth surface — there&apos;s no header to put a
        bearer token in. Bolting OAuth onto a stdio process means
        rebuilding HTTP&apos;s auth middleware, and you&apos;d still
        have no way to reach the server from VS Code over a VPN.
      </>
    ),
  },
  {
    id: "cloudflare-worker",
    title: "MCP server inside a Cloudflare Worker, public on the internet",
    body: (
      <>
        Your MCP server runs inside a Cloudflare Worker — no
        long-running process, no filesystem, no ability to fork. Public
        on the internet, secured by OAuth. Which transport?
      </>
    ),
    correct: "http",
    rightVerdict: (
      <>
        <strong>Streamable HTTP</strong> — three reasons stack: Workers
        can&apos;t fork, clients are off-machine, auth is at HTTP. The
        only fit the spec offers.
      </>
    ),
    wrongVerdict: (
      <>
        Workers can&apos;t spawn child processes — there&apos;s no
        stdio to pipe through. Even if they could, a remote client
        can&apos;t reach a stdin/stdout pair across the public internet.
        Streamable HTTP is the only transport that works here.
      </>
    ),
  },
];

const NOD_KEYFRAMES = [0, -6, 6, -4, 4, 0];

type Verdict = "right" | "wrong";

type CardState = {
  /** Which option the reader picked, or null if untouched. */
  pick: Choice | null;
  /** Set once the verdict is revealed. */
  verdict: Verdict | null;
};

function emptyState(): CardState {
  return { pick: null, verdict: null };
}

export function TransportPicker() {
  const reduce = useReducedMotion();
  const liveId = useId();

  const [active, setActive] = useState(0);
  const [states, setStates] = useState<CardState[]>(() =>
    SCENARIOS.map(emptyState),
  );

  const current = SCENARIOS[active];
  const currentState = states[active];
  const allDone = states.every((s) => s.verdict !== null);

  const handlePick = useCallback(
    (choice: Choice) => {
      setStates((prev) => {
        if (prev[active].verdict !== null) return prev;
        const next = prev.slice();
        const correct = SCENARIOS[active].correct === choice;
        next[active] = { pick: choice, verdict: correct ? "right" : "wrong" };
        playSound("Click");
        // Slight delay-free pairing — verdict cue lands ~250ms after the
        // click via animation lag, matching the <Quiz> primitive's
        // audio vocabulary.
        playSound(correct ? "Success" : "Error");
        return next;
      });
    },
    [active],
  );

  const goNext = useCallback(() => {
    if (active >= SCENARIOS.length - 1) return;
    playSound("Progress-Tick");
    setActive((a) => a + 1);
  }, [active]);

  const goPrev = useCallback(() => {
    if (active <= 0) return;
    playSound("Progress-Tick");
    setActive((a) => a - 1);
  }, [active]);

  const reset = useCallback(() => {
    playSound("Progress-Tick");
    setActive(0);
    setStates(SCENARIOS.map(emptyState));
  }, []);

  const announceText = useMemo(() => {
    if (!currentState.verdict) {
      return `Scenario ${active + 1} of ${SCENARIOS.length}: ${current.title}.`;
    }
    return currentState.verdict === "right"
      ? `Correct. The right transport for "${current.title}" is ${current.correct === "stdio" ? "stdio" : "Streamable HTTP"}.`
      : `Not quite. The right transport for "${current.title}" is ${current.correct === "stdio" ? "stdio" : "Streamable HTTP"}.`;
  }, [active, current, currentState]);

  return (
    <WidgetShell
      title="Pick a transport — four real deployments"
      measurements={`${states.filter((s) => s.verdict !== null).length} / ${SCENARIOS.length}`}
      caption={
        allDone ? (
          <>
            Four picks, three of them HTTP. The pattern is small: stdio
            wins where you control both ends and share a machine;
            Streamable HTTP wins everywhere else. Trust + locality
            chooses stdio. Distance, multi-tenancy, or auth chooses
            Streamable HTTP.
          </>
        ) : (
          <>
            Pick the transport you&apos;d ship for each deployment.
            Wrong picks reveal what would actually break — the lesson
            is in the failure mode, not the verdict.
          </>
        )
      }
      captionTone="prominent"
    >
      {/* sr-only live region — sighted users see the verdict copy below
          the buttons; screen readers get the same announcement here. */}
      <div
        id={liveId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {announceText}
      </div>

      <style>{`
        .bs-tp-trail {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: var(--spacing-sm);
        }
        .bs-tp-trail-tick {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          border-radius: 999px;
          color: var(--color-text-muted);
          background: color-mix(in oklab, var(--color-surface) 60%, transparent);
          border: 1px solid var(--color-rule);
          cursor: pointer;
        }
        .bs-tp-trail-tick[data-active="true"] {
          color: var(--color-accent);
          border-color: var(--color-accent);
          background: color-mix(in oklab, var(--color-accent) 12%, transparent);
        }
        .bs-tp-trail-tick[data-verdict="right"] {
          color: var(--color-accent);
          border-color: color-mix(in oklab, var(--color-accent) 50%, transparent);
        }
        .bs-tp-trail-tick[data-verdict="wrong"] {
          color: var(--color-text-muted);
          filter: saturate(0.4);
        }
        .bs-tp-trail-tick:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }
        .bs-tp-card {
          background: color-mix(in oklab, var(--color-surface) 60%, transparent);
          border: 1px solid var(--color-rule);
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }
        .bs-tp-scenario-title {
          font-family: var(--font-sans);
          font-size: var(--text-ui);
          letter-spacing: 0.02em;
          color: var(--color-text-muted);
          text-transform: uppercase;
        }
        .bs-tp-scenario-body {
          font-family: var(--font-serif);
          font-size: var(--text-body);
          line-height: 1.55;
          color: var(--color-text);
          margin: 0;
        }
        .bs-tp-options {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--spacing-2xs);
        }
        @container widget (min-width: 480px) {
          .bs-tp-options {
            grid-template-columns: 1fr 1fr;
          }
        }
        .bs-tp-option {
          width: 100%;
          min-height: 64px;
          padding: 14px 16px;
          font-family: var(--font-mono);
          font-size: var(--text-ui);
          line-height: 1.45;
          text-align: left;
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-rule);
          background: var(--color-surface);
          color: var(--color-text);
          cursor: pointer;
          transition: background 200ms, color 200ms, border-color 200ms, opacity 200ms;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .bs-tp-option:hover:not(:disabled) {
          background: color-mix(in oklab, var(--color-accent) 8%, transparent);
        }
        .bs-tp-option:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }
        .bs-tp-option:disabled { cursor: default; }
        .bs-tp-option-label {
          font-family: var(--font-mono);
          font-size: var(--text-ui);
          color: var(--color-text);
        }
        .bs-tp-option-sub {
          font-family: var(--font-sans);
          font-size: var(--text-small);
          color: var(--color-text-muted);
          line-height: 1.4;
        }
        .bs-tp-verdict {
          min-height: 4.5em;
          font-family: var(--font-serif);
          font-size: var(--text-small);
          line-height: 1.6;
          color: var(--color-text-muted);
        }
        .bs-tp-controls {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-sm);
          align-items: center;
          justify-content: space-between;
        }
        .bs-tp-btn {
          min-height: 36px;
          padding: 6px 12px;
          border-radius: var(--radius-md);
          font-family: var(--font-sans);
          font-size: var(--text-ui);
          color: var(--color-text-muted);
          background: transparent;
          border: 1px solid var(--color-rule);
          cursor: pointer;
        }
        .bs-tp-btn:not(:disabled):hover {
          color: var(--color-accent);
          border-color: var(--color-accent);
        }
        .bs-tp-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .bs-tp-btn-primary {
          color: var(--color-accent);
          border-color: var(--color-accent);
          background: color-mix(in oklab, var(--color-accent) 10%, transparent);
        }
        .bs-tp-btn:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }
      `}</style>

      <div className="bs-tp-trail" aria-label="Scenario progress">
        {SCENARIOS.map((s, i) => {
          const st = states[i];
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                playSound("Progress-Tick");
                setActive(i);
              }}
              data-active={i === active}
              data-verdict={st.verdict ?? "none"}
              className="bs-tp-trail-tick"
              aria-current={i === active ? "step" : undefined}
              aria-label={`Scenario ${i + 1}: ${s.title}${st.verdict ? ` — ${st.verdict === "right" ? "answered correctly" : "answered"}` : " — unanswered"}`}
            >
              <span aria-hidden>{i + 1}</span>
              <span aria-hidden style={{ opacity: 0.5 }}>·</span>
              <span aria-hidden>
                {st.verdict === "right"
                  ? "✓"
                  : st.verdict === "wrong"
                    ? "·"
                    : "·"}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={current.id}
          className="bs-tp-card"
          role="radiogroup"
          aria-label={`Pick a transport for ${current.title}`}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={SPRING.gentle}
        >
          <div className="bs-tp-scenario-title">{current.title}</div>
          <p className="bs-tp-scenario-body">{current.body}</p>

          <div className="bs-tp-options">
            <OptionButton
              choice="stdio"
              label="stdio"
              sub="process pipe — same-machine, no HTTP layer"
              card={current}
              state={currentState}
              onPick={handlePick}
              reduce={!!reduce}
            />
            <OptionButton
              choice="http"
              label="Streamable HTTP"
              sub="single endpoint — POST + optional SSE upstream"
              card={current}
              state={currentState}
              onPick={handlePick}
              reduce={!!reduce}
            />
          </div>

          <div className="bs-tp-verdict" aria-live="polite">
            <AnimatePresence initial={false} mode="wait">
              {currentState.verdict ? (
                <motion.div
                  key={currentState.verdict}
                  initial={
                    reduce ? { opacity: 0 } : { opacity: 0, y: 4 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={SPRING.gentle}
                >
                  {currentState.verdict === "right"
                    ? current.rightVerdict
                    : current.wrongVerdict}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="bs-tp-controls">
            <button
              type="button"
              className="bs-tp-btn"
              onClick={goPrev}
              disabled={active === 0}
              aria-label="Previous scenario"
            >
              ← prev
            </button>
            <span
              className="font-mono tabular-nums"
              style={{
                fontSize: "var(--text-small)",
                color: "var(--color-text-muted)",
              }}
              aria-hidden
            >
              {active + 1} / {SCENARIOS.length}
            </span>
            {active < SCENARIOS.length - 1 ? (
              <button
                type="button"
                className={`bs-tp-btn ${currentState.verdict ? "bs-tp-btn-primary" : ""}`}
                onClick={goNext}
                disabled={!currentState.verdict}
                aria-label="Next scenario"
              >
                next →
              </button>
            ) : (
              <button
                type="button"
                className="bs-tp-btn"
                onClick={reset}
                aria-label="Reset all scenarios"
              >
                ↺ reset
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </WidgetShell>
  );
}

/**
 * One large segmented option button. Wraps the correct option in
 * <ClickSpark> so the right pick emits a small terracotta burst.
 * The animation rules mirror the <Quiz> primitive: pulse on right,
 * nod on wrong, opacity-only under reduced motion.
 */
function OptionButton({
  choice,
  label,
  sub,
  card,
  state,
  onPick,
  reduce,
}: {
  choice: Choice;
  label: string;
  sub: string;
  card: Scenario;
  state: CardState;
  onPick: (c: Choice) => void;
  reduce: boolean;
}) {
  const isChosen = state.pick === choice;
  const isCorrect = card.correct === choice;
  const revealed = state.verdict !== null;
  const showCorrectMark = revealed && isCorrect;
  const isWrongChosen = revealed && isChosen && !isCorrect;
  const dim = revealed && !isChosen && !isCorrect;

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
      type="button"
      role="radio"
      aria-checked={isChosen}
      onClick={() => onPick(choice)}
      disabled={revealed}
      whileTap={revealed || reduce ? undefined : { scale: 0.97 }}
      animate={animate}
      transition={transition}
      className="bs-tp-option"
      style={{
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
      <span className="bs-tp-option-label">
        {showCorrectMark ? (
          <span
            aria-hidden
            style={{
              color: "var(--color-accent)",
              fontSize: 12,
              marginRight: 8,
            }}
          >
            ✓
          </span>
        ) : null}
        {label}
      </span>
      <span className="bs-tp-option-sub">{sub}</span>
    </motion.button>
  );

  return isCorrect ? <ClickSpark>{button}</ClickSpark> : button;
}

export default TransportPicker;
