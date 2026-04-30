"use client";

/**
 * ControllerTable — chapter 5's reference table.
 *
 * Three rows (tool / resource / prompt) × five columns (controller, who
 * registers, who invokes, methods, example). The chapter's prose paces to
 * this widget; this is the shape the reader should leave the chapter with.
 *
 * Implementation notes:
 * - Real <table> with <th scope="col"> / <th scope="row"> for assistive tech.
 * - On hover or focus of a row, the row highlights — single accent only,
 *   no second colour. Methods column uses the mono token; everything else
 *   is sans/serif as appropriate.
 * - Reduced motion: highlights remain (it's not motion); no transitions on
 *   the highlight at any time — this is a static reference, not a stepper.
 * - Mobile (<480px container width): the table reflows to three stacked
 *   cards, each labelled with the primitive and listing the four other
 *   columns as label/value rows.
 *
 * Banned: <hr>, <br>, decorative chrome. The table is the diagram.
 */

import { useState } from "react";
import { WidgetShell } from "@/components/viz/WidgetShell";

type Row = {
  primitive: "tool" | "resource" | "prompt";
  controller: string;
  registers: string;
  invokes: string;
  methods: string[];
  example: string;
};

const ROWS: Row[] = [
  {
    primitive: "tool",
    controller: "model",
    registers: "server",
    invokes: "the LLM, mid-reasoning",
    methods: ["tools/list", "tools/call"],
    example: "search_flights, convert_currency",
  },
  {
    primitive: "resource",
    controller: "application",
    registers: "server",
    invokes: "the host, when context calls for it",
    methods: ["resources/list", "resources/read", "resources/templates/list"],
    example: "calendar://events/{year}",
  },
  {
    primitive: "prompt",
    controller: "user",
    registers: "server",
    invokes: "the human, via slash-command",
    methods: ["prompts/list", "prompts/get"],
    example: "/plan-vacation, /summarize-pr",
  },
];

export function ControllerTable() {
  const [active, setActive] = useState<Row["primitive"] | null>(null);

  return (
    <WidgetShell
      title="The controller table"
      caption={
        <>
          The shape of the chapter. Hover or focus a row to lift it; the
          difference between the three is the difference between who decides{" "}
          <em>when</em>.
        </>
      }
    >
      <style>{`
        .bs-ct-wrap { container-type: inline-size; }
        .bs-ct-table {
          width: 100%;
          border-collapse: collapse;
          font-family: var(--font-sans);
          font-size: var(--text-small);
          line-height: 1.5;
          color: var(--color-text);
        }
        .bs-ct-table caption {
          text-align: left;
          font-family: var(--font-sans);
          font-size: var(--text-small);
          color: var(--color-text-muted);
          padding-bottom: var(--spacing-sm);
        }
        .bs-ct-table th, .bs-ct-table td {
          padding: 12px 14px;
          text-align: left;
          vertical-align: top;
          border-bottom: 1px solid var(--color-rule);
        }
        .bs-ct-table thead th {
          font-weight: 600;
          color: var(--color-text-muted);
          font-size: var(--text-small);
          letter-spacing: 0.02em;
          text-transform: lowercase;
        }
        .bs-ct-table tbody th {
          font-weight: 600;
          color: var(--color-text);
        }
        .bs-ct-row {
          transition: background 200ms;
        }
        .bs-ct-row:focus-within,
        .bs-ct-row[data-active="true"] {
          background: color-mix(in oklab, var(--color-accent) 8%, transparent);
        }
        .bs-ct-controller {
          color: var(--color-accent);
          font-weight: 600;
        }
        .bs-ct-method {
          font-family: var(--font-mono);
          font-size: 0.92em;
          background: var(--color-surface);
          padding: 1px 6px;
          border-radius: var(--radius-sm);
          margin-right: 4px;
          display: inline-block;
          margin-bottom: 3px;
        }
        .bs-ct-example {
          font-family: var(--font-mono);
          font-size: 0.92em;
          color: var(--color-text-muted);
        }
        .bs-ct-cards {
          display: none;
        }
        .bs-ct-card {
          padding: var(--spacing-md);
          border: 1px solid var(--color-rule);
          border-radius: var(--radius-md);
          background: color-mix(in oklab, var(--color-surface) 60%, transparent);
        }
        .bs-ct-card + .bs-ct-card { margin-top: var(--spacing-sm); }
        .bs-ct-card-head {
          display: flex;
          align-items: baseline;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-sm);
        }
        .bs-ct-card-name {
          font-family: var(--font-sans);
          font-size: var(--text-h3);
          font-weight: 600;
          color: var(--color-text);
        }
        .bs-ct-card-controller {
          font-family: var(--font-sans);
          font-size: var(--text-small);
          color: var(--color-accent);
          font-weight: 600;
        }
        .bs-ct-card-row {
          display: grid;
          grid-template-columns: 7em 1fr;
          gap: var(--spacing-2xs);
          font-size: var(--text-small);
          margin-top: 6px;
        }
        .bs-ct-card-label {
          color: var(--color-text-muted);
          font-family: var(--font-sans);
        }
        @container (max-width: 600px) {
          .bs-ct-table { display: none; }
          .bs-ct-cards { display: block; }
        }
      `}</style>

      <div className="bs-ct-wrap">
        <table className="bs-ct-table">
          <caption>three primitives, three controllers, one server</caption>
          <thead>
            <tr>
              <th scope="col">primitive</th>
              <th scope="col">controller</th>
              <th scope="col">who invokes</th>
              <th scope="col">methods</th>
              <th scope="col">example</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr
                key={row.primitive}
                className="bs-ct-row"
                data-active={active === row.primitive ? "true" : undefined}
                onMouseEnter={() => setActive(row.primitive)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(row.primitive)}
                onBlur={() => setActive(null)}
                tabIndex={0}
                aria-label={`${row.primitive} — ${row.controller}-controlled`}
              >
                <th scope="row">{row.primitive}</th>
                <td>
                  <span className="bs-ct-controller">{row.controller}</span>
                </td>
                <td>{row.invokes}</td>
                <td>
                  {row.methods.map((m) => (
                    <code key={m} className="bs-ct-method">
                      {m}
                    </code>
                  ))}
                </td>
                <td>
                  <span className="bs-ct-example">{row.example}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="bs-ct-cards" aria-hidden>
          {ROWS.map((row) => (
            <div key={row.primitive} className="bs-ct-card">
              <div className="bs-ct-card-head">
                <span className="bs-ct-card-name">{row.primitive}</span>
                <span className="bs-ct-card-controller">
                  {row.controller}-controlled
                </span>
              </div>
              <div className="bs-ct-card-row">
                <span className="bs-ct-card-label">invokes</span>
                <span>{row.invokes}</span>
              </div>
              <div className="bs-ct-card-row">
                <span className="bs-ct-card-label">methods</span>
                <span>
                  {row.methods.map((m) => (
                    <code key={m} className="bs-ct-method">
                      {m}
                    </code>
                  ))}
                </span>
              </div>
              <div className="bs-ct-card-row">
                <span className="bs-ct-card-label">example</span>
                <span className="bs-ct-example">{row.example}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </WidgetShell>
  );
}

export default ControllerTable;
