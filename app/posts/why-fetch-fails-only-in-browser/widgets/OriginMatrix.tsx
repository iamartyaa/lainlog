"use client";

import { useState } from "react";
import { HScroll } from "@/components/viz/HScroll";
import { WidgetShell } from "./WidgetShell";

type Row = {
  url: string;
  scheme: string;
  host: string;
  port: string;
  path: string;
  sameOrigin: boolean;
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
    caption:
      "Scheme differs. `http` and `https` are separate origins even on the same host — TLS changes the trust boundary.",
  },
  {
    url: "https://app.example.com:8080",
    scheme: "https",
    host: "app.example.com",
    port: "8080",
    path: "/",
    sameOrigin: false,
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
    caption:
      "Same origin. Path is not part of the tuple — /admin and / share an origin, which is why cookies and JS access work across routes.",
  },
];

type ColKey = "scheme" | "host" | "port" | "path";

const COLS: { key: ColKey; label: string; weight: number }[] = [
  { key: "scheme", label: "scheme", weight: 1 },
  { key: "host", label: "host", weight: 1 },
  { key: "port", label: "port", weight: 1 },
  { key: "path", label: "path", weight: 1 },
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
      title="origin = (scheme, host, port) · hover any row"
      measurements={`base · ${BASE.url}`}
      caption={
        row ? (
          <span>
            <span style={{ color: tone, fontWeight: 500 }}>{decision}</span>
            {" — "}
            {row.caption}
          </span>
        ) : (
          <span style={{ color: "var(--color-text-muted)" }}>
            Each URL below is compared to the base. Hover or tab to any row to see
            which component of the tuple differs and why it moves that URL
            cross-origin.
          </span>
        )
      }
    >
      <HScroll ariaLabel="origin comparison matrix — swipe horizontally to compare">
        <table
          className="w-full font-mono tabular-nums"
          style={{
            fontSize: "var(--text-small)",
            borderCollapse: "collapse",
            minWidth: "520px",
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
              <th className="text-right py-[var(--spacing-xs)] font-normal">verdict</th>
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
                  key={r.url}
                  onMouseEnter={() => setFocused(i)}
                  onFocus={() => setFocused(i)}
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
                  <td className="py-[var(--spacing-xs)] pr-[var(--spacing-sm)]">{r.url}</td>
                  {COLS.map((c) => {
                    const differs = cellDiffers(r, c.key);
                    return (
                      <td
                        key={c.key}
                        className="py-[var(--spacing-xs)] pr-[var(--spacing-sm)]"
                        style={{
                          color: differs ? "var(--color-accent)" : "var(--color-text-muted)",
                          fontWeight: differs ? 500 : 400,
                        }}
                      >
                        {r[c.key]}
                        {differs ? (
                          <span
                            aria-hidden
                            style={{ marginLeft: 4, color: "var(--color-accent)" }}
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
                      color: r.sameOrigin ? "var(--color-text)" : "var(--color-accent)",
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
      </HScroll>
    </WidgetShell>
  );
}
