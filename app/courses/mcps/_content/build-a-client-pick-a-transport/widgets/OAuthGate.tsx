"use client";

/**
 * OAuthGate — premise-quiz opener for chapter 7 (voice §12.1).
 *
 * The reader's instinct: if a remote MCP server gets a request without
 * credentials, it should return 403 (forbidden). The chapter's correction:
 * the spec recommends 401 with a `WWW-Authenticate` header — the same
 * response a browser would get hitting any OAuth-gated HTTP API. 401 is
 * "you didn't say who you are"; 403 is "I know who you are and the answer
 * is no."
 *
 * The wrong-answer verdict creates the demand for the chapter's later
 * Streamable-HTTP-with-auth section, without requiring OAuth as a
 * prerequisite. The widget reuses the shipped <Quiz> primitive: radiogroup
 * a11y, reduced-motion fallback, frame-stable verdict slot, one-accent
 * terracotta highlight. No second hue.
 */

import { Quiz } from "@/components/widgets/Quiz";
import { WidgetShell } from "@/components/viz/WidgetShell";

export function OAuthGate() {
  return (
    <WidgetShell
      title="What HTTP code should a remote MCP server return on an unauthenticated request?"
      caption={
        <>
          Predict before you read on. Most readers reach for 403 — the
          spec reaches for 401, and the difference is load-bearing once
          OAuth enters the picture.
        </>
      }
    >
      <div className="flex flex-col gap-[var(--spacing-md)]">
        <pre
          aria-label="Sample HTTP request"
          style={{
            margin: 0,
            padding: "var(--spacing-sm) var(--spacing-md)",
            background: "var(--color-surface)",
            border: "1px solid var(--color-rule)",
            borderRadius: "var(--radius-sm)",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            lineHeight: 1.55,
            color: "var(--color-text)",
            whiteSpace: "pre",
            overflowX: "auto",
          }}
        >
{`POST /mcp HTTP/1.1
Host: api.example.com
Content-Type: application/json

{ "jsonrpc": "2.0", "id": 1, "method": "initialize", "params": { ... } }`}
        </pre>

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
              The request above lands at a remote{" "}
              <em>Streamable HTTP</em> MCP server. There&apos;s no{" "}
              <code style={{ fontFamily: "var(--font-mono)" }}>
                Authorization
              </code>{" "}
              header. Per the 2025-06-18 spec, what HTTP status code does
              the server return — and what header does it pair with it?
            </p>
          }
          correctId="401-www-auth"
          rightVerdict={
            <>
              Right. The spec recommends{" "}
              <code style={{ fontFamily: "var(--font-mono)" }}>
                401 Unauthorized
              </code>{" "}
              with a{" "}
              <code style={{ fontFamily: "var(--font-mono)" }}>
                WWW-Authenticate
              </code>{" "}
              header pointing at the auth metadata. 401 is the "you
              didn&apos;t say who you are" code; the header tells the
              client where to go to say it. 403 would mean the server
              already identified the caller and chose to refuse.
            </>
          }
          wrongVerdict={
            <>
              The spec is explicit:{" "}
              <code style={{ fontFamily: "var(--font-mono)" }}>401</code>{" "}
              with a{" "}
              <code style={{ fontFamily: "var(--font-mono)" }}>
                WWW-Authenticate
              </code>{" "}
              header. 403 implies the caller is known and refused, 426
              demands a protocol upgrade, 451 is reserved for legal
              blocks. This isn&apos;t any of those — it&apos;s the same
              dance any OAuth-gated API does.
            </>
          }
          options={[
            {
              id: "401-www-auth",
              label:
                "401 Unauthorized, paired with a WWW-Authenticate header that names the auth scheme.",
            },
            {
              id: "403",
              label:
                "403 Forbidden — the request reached the server without credentials, so access is denied.",
            },
            {
              id: "426",
              label:
                "426 Upgrade Required — the server needs the client to switch to an authenticated protocol.",
            },
            {
              id: "451",
              label:
                "451 Unavailable For Legal Reasons — auth-gated content is the same surface as legal-gated content.",
            },
          ]}
        />
      </div>
    </WidgetShell>
  );
}

export default OAuthGate;
