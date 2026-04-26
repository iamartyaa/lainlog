"use client";

import { useState } from "react";
import { WidgetShell } from "./WidgetShell";
import { playSound } from "@/lib/audio";

type Row = {
  url: string;
  scheme: string;
  host: string;
  port: string;
  path: string;
  sameOrigin: boolean;
  /** Which component differs from BASE — drives the terracotta highlight in the
   *  stacked-list view. `null` for the same-origin row. */
  differs: ColKey | null;
  caption: string;
};

const BASE = {
  url: "https://app.example.com",
  scheme: "https",
  host: "app.example.com",
  port: "(443)",
  path: "/",
};

const ROWS: Row[] = [
  {
    url: "http://app.example.com",
    scheme: "http",
    host: "app.example.com",
    port: "(80)",
    path: "/",
    sameOrigin: false,
    differs: "scheme",
    caption:
      "Scheme differs. http and https are separate origins even on the same host — TLS changes the trust boundary.",
  },
  {
    url: "https://app.example.com:8080",
    scheme: "https",
    host: "app.example.com",
    port: "8080",
    path: "/",
    sameOrigin: false,
    differs: "port",
    caption:
      "Port differs. Browsers include the port in the origin tuple — so your API on :8080 is cross-origin from your site on :443.",
  },
  {
    url: "https://api.example.com",
    scheme: "https",
    host: "api.example.com",
    port: "(443)",
    path: "/",
    sameOrigin: false,
    differs: "host",
    caption:
      "Host differs. Subdomains are cross-origin. api.example.com and app.example.com are as foreign as example.com and evil.com under this rule.",
  },
  {
    url: "https://example.com",
    scheme: "https",
    host: "example.com",
    port: "(443)",
    path: "/",
    sameOrigin: false,
    differs: "host",
    caption:
      "Host differs. The parent domain is its own origin. Strip a subdomain and you've left the origin.",
  },
  {
    url: "https://app.example.com/admin",
    scheme: "https",
    host: "app.example.com",
    port: "(443)",
    path: "/admin",
    sameOrigin: true,
    differs: null,
    caption:
      "Same origin. Path is not part of the tuple — /admin and / share an origin, which is why cookies and JS access work across routes.",
  },
];

type ColKey = "scheme" | "host" | "port" | "path";

const COLS: { key: ColKey; label: string }[] = [
  { key: "scheme", label: "scheme" },
  { key: "host", label: "host" },
  { key: "port", label: "port" },
  { key: "path", label: "path" },
];

function cellDiffers(row: Row, col: ColKey): boolean {
  return row[col] !== BASE[col];
}

export function OriginMatrix() {
  const [focused, setFocused] = useState<number>(-1);
  const row = focused >= 0 ? ROWS[focused] : null;

  const decision = row ? (row.sameOrigin ? "same origin" : "cross-origin") : null;
  const tone = row
    ? row.sameOrigin
      ? "var(--color-text)"
      : "var(--color-accent)"
    : "var(--color-text-muted)";

  return (
    <WidgetShell
      title="origin · scheme · host · port"
      measurements={`base · ${BASE.url}`}
      captionTone="prominent"
      caption={
        row ? (
          <span aria-live="off">
            <span style={{ color: tone, fontWeight: 500 }}>{decision}</span>
            {" — "}
            {row.caption}
          </span>
        ) : (
          <span>
            Tap any row. Terracotta marks the part that shifts the URL out of
            your origin.
          </span>
        )
      }
    >
      {/* Mobile-first: stacked list of cards. Each card = url on its own line,
          a one-line scheme/host/port/path diff string with the differing piece
          in terracotta, and a verdict pill on the right. The full caption
          surfaces in WidgetShell's caption slot when the row is focused/tapped.
          At @container widget (min-width: 640px) the list flips to a table. */}

      {/* Base row (mobile). At desktop the thead carries the "base" row instead. */}
      <div
        className="bs-om-base flex flex-wrap items-baseline gap-x-[var(--spacing-sm)] gap-y-[var(--spacing-2xs)] pb-[var(--spacing-sm)] font-mono"
        style={{
          fontSize: "var(--text-small)",
          color: "var(--color-text-muted)",
          borderBottom: "1px dashed var(--color-rule)",
        }}
      >
        <span style={{ minWidth: "4ch" }}>base</span>
        <span>{BASE.url}</span>
      </div>

      {/* Stacked-list view (mobile / narrow). */}
      <ul
        className="bs-om-stack flex flex-col"
        role="list"
        aria-label="origin comparison, 5 rows"
      >
        {ROWS.map((r, i) => {
          const active = i === focused;
          return (
            <li
              key={`stack-${r.url}`}
              role="button"
              tabIndex={0}
              onClick={() => {
                if (focused !== i) playSound("Toggle-On");
                setFocused(i);
              }}
              onFocus={() => setFocused(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (focused !== i) playSound("Toggle-On");
                  setFocused(i);
                }
              }}
              aria-label={`${r.url}: ${r.sameOrigin ? "same origin" : "cross-origin"}`}
              className="cursor-pointer py-[var(--spacing-sm)] px-[var(--spacing-2xs)]"
              style={{
                background: active
                  ? "color-mix(in oklab, var(--color-accent) 5%, transparent)"
                  : "transparent",
                transition: "background 160ms",
                borderTop: "1px dashed var(--color-rule)",
              }}
            >
              <div className="flex items-baseline justify-between gap-[var(--spacing-sm)]">
                <span
                  className="font-mono break-all"
                  style={{ fontSize: "var(--text-small)" }}
                >
                  {r.url}
                </span>
                <span
                  className="font-mono shrink-0"
                  style={{
                    fontSize: "var(--text-small)",
                    color: r.sameOrigin
                      ? "var(--color-text)"
                      : "var(--color-accent)",
                    fontWeight: 500,
                  }}
                >
                  {r.sameOrigin ? "same" : "cross"}
                </span>
              </div>
              <div
                className="mt-[var(--spacing-2xs)] font-mono flex flex-wrap gap-x-[var(--spacing-sm)]"
                style={{
                  fontSize: "var(--text-small)",
                  color: "var(--color-text-muted)",
                }}
              >
                {COLS.map((c) => {
                  const differs = cellDiffers(r, c.key);
                  return (
                    <span
                      key={c.key}
                      style={{
                        color: differs
                          ? "var(--color-accent)"
                          : "var(--color-text-muted)",
                        fontWeight: differs ? 500 : 400,
                      }}
                    >
                      <span
                        style={{
                          color: "var(--color-text-muted)",
                          fontWeight: 400,
                        }}
                      >
                        {c.label}:
                      </span>{" "}
                      {r[c.key]}
                    </span>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Table view (desktop / wide). Same data, denser. */}
      <table
        className="bs-om-table w-full font-mono tabular-nums"
        style={{
          fontSize: "var(--text-small)",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr style={{ color: "var(--color-text-muted)" }}>
            <th className="text-left py-[var(--spacing-xs)] pr-[var(--spacing-sm)] font-normal">
              url
            </th>
            {COLS.map((c) => (
              <th
                key={c.key}
                className="text-left py-[var(--spacing-xs)] pr-[var(--spacing-sm)] font-normal"
              >
                {c.label}
              </th>
            ))}
            <th className="text-right py-[var(--spacing-xs)] font-normal">
              verdict
            </th>
          </tr>
          <tr aria-hidden>
            <td
              colSpan={6}
              style={{
                borderTop: "1px dashed var(--color-rule)",
                paddingTop: 0,
                height: 1,
              }}
            />
          </tr>
          <tr>
            <td
              className="py-[var(--spacing-xs)] pr-[var(--spacing-sm)]"
              style={{ color: "var(--color-text-muted)" }}
            >
              base
            </td>
            {COLS.map((c) => (
              <td
                key={c.key}
                className="py-[var(--spacing-xs)] pr-[var(--spacing-sm)]"
                style={{ color: "var(--color-text-muted)" }}
              >
                {BASE[c.key]}
              </td>
            ))}
            <td
              className="py-[var(--spacing-xs)] text-right"
              style={{ color: "var(--color-text-muted)" }}
            >
              —
            </td>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r, i) => {
            const active = i === focused;
            return (
              <tr
                key={`table-${r.url}`}
                role="button"
                onClick={() => setFocused(i)}
                onFocus={() => setFocused(i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setFocused(i);
                  }
                }}
                tabIndex={0}
                aria-label={`${r.url}: ${r.sameOrigin ? "same origin" : "cross-origin"}`}
                style={{
                  cursor: "pointer",
                  background: active
                    ? "color-mix(in oklab, var(--color-accent) 5%, transparent)"
                    : "transparent",
                  transition: "background 160ms",
                  borderTop: "1px dashed var(--color-rule)",
                }}
              >
                <td className="py-[var(--spacing-xs)] pr-[var(--spacing-sm)]">
                  {r.url}
                </td>
                {COLS.map((c) => {
                  const differs = cellDiffers(r, c.key);
                  return (
                    <td
                      key={c.key}
                      className="py-[var(--spacing-xs)] pr-[var(--spacing-sm)]"
                      style={{
                        color: differs
                          ? "var(--color-accent)"
                          : "var(--color-text-muted)",
                        fontWeight: differs ? 500 : 400,
                      }}
                    >
                      {r[c.key]}
                      {differs ? (
                        <span
                          aria-hidden
                          style={{
                            marginLeft: 4,
                            color: "var(--color-accent)",
                          }}
                        >
                          ✗
                        </span>
                      ) : null}
                    </td>
                  );
                })}
                <td
                  className="py-[var(--spacing-xs)] text-right"
                  style={{
                    color: r.sameOrigin
                      ? "var(--color-text)"
                      : "var(--color-accent)",
                    fontWeight: 500,
                  }}
                >
                  {r.sameOrigin ? "same" : "cross"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </WidgetShell>
  );
}
