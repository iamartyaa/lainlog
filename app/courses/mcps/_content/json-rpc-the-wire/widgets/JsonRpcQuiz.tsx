"use client";

/**
 * JsonRpcQuiz — the chapter's premise-quiz opener (voice §12.1).
 *
 * Two messages on the wire. One has an `id`; one doesn't. Which expects a
 * response? Most readers haven't internalised the rule yet — the wrong
 * answer creates demand for the chapter's reframe.
 *
 * Built on the shared <Quiz> wrapper (see components/widgets/Quiz.tsx) so
 * the shuffle, focus management, sparkle/nod, and verdict slot match every
 * other quiz in the project. We own the question framing — two short
 * <CodeBlock>-styled samples — and the verdict copy.
 */

import { Quiz } from "@/components/widgets/Quiz";
import { WidgetShell } from "@/components/viz/WidgetShell";

const MSG_A = `{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/list"
}`;

const MSG_B = `{
  "jsonrpc": "2.0",
  "method": "notifications/tools/list_changed"
}`;

const OPTIONS = [
  {
    id: "with-id",
    label:
      "the one with id — the id pairs request to response; no id means no response.",
  },
  {
    id: "without-id",
    label:
      "the one without id — fewer fields means less ceremony; the server fills in the id.",
  },
  {
    id: "both",
    label: "both — every JSON-RPC message expects a response.",
  },
  {
    id: "neither",
    label:
      "neither — JSON-RPC is async; responses arrive when the server feels like it.",
  },
];

export function JsonRpcQuiz() {
  return (
    <WidgetShell
      title="predict the answer"
      caption={
        <span>
          two messages, almost identical &mdash; one extra field decides
          whether the wire stays quiet or talks back.
        </span>
      }
    >
      <Quiz
        question={
          <div className="bs-jrq-q">
            <style>{`
              .bs-jrq-q { display: grid; gap: var(--spacing-sm); margin-bottom: var(--spacing-sm); }
              .bs-jrq-msg {
                font-family: var(--font-mono);
                font-size: var(--text-mono);
                line-height: 1.55;
                background: var(--color-surface);
                border: 1px solid var(--color-rule);
                border-radius: var(--radius-sm);
                padding: var(--spacing-sm) var(--spacing-md);
                color: var(--color-text);
                white-space: pre;
                overflow-x: auto;
                margin: 0;
              }
              .bs-jrq-msg-label {
                font-family: var(--font-mono);
                font-size: var(--text-small);
                color: var(--color-text-muted);
                margin-bottom: 4px;
              }
              .bs-jrq-stem {
                font-family: var(--font-serif);
                font-size: var(--text-body);
                line-height: 1.55;
                color: var(--color-text);
                margin: 0;
              }
            `}</style>
            <div>
              <div className="bs-jrq-msg-label">message A</div>
              <pre className="bs-jrq-msg">{MSG_A}</pre>
            </div>
            <div>
              <div className="bs-jrq-msg-label">message B</div>
              <pre className="bs-jrq-msg">{MSG_B}</pre>
            </div>
            <p className="bs-jrq-stem">
              both are valid JSON-RPC. one expects a response back; one
              doesn&rsquo;t. which one expects a response &mdash; and why?
            </p>
          </div>
        }
        options={OPTIONS}
        correctId="with-id"
        rightVerdict={
          <span>
            right. the <code>id</code> is the pairing key &mdash; it&rsquo;s
            how the server tells the client which request a response answers.
            no <code>id</code>, no response. messages without one are
            <em> notifications</em> &mdash; events the receiver can act on but
            never replies to.
          </span>
        }
        wrongVerdict={
          <span>
            it&rsquo;s the one with <code>id</code>. JSON-RPC pairs requests
            and responses by id; remove the field and the message becomes a
            notification &mdash; fire-and-forget, no reply expected. the rest
            of this chapter teaches you to read the four fields by sight, so
            you&rsquo;ll never miss this again.
          </span>
        }
      />
    </WidgetShell>
  );
}

export default JsonRpcQuiz;
