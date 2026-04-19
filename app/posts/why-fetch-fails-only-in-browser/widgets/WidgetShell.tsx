import { FullBleed } from "@/components/prose";
import type { ReactNode } from "react";

type Props = {
  title: string;
  measurements?: string;
  caption?: ReactNode;
  controls?: ReactNode;
  children: ReactNode;
};

export function WidgetShell({ title, measurements, caption, controls, children }: Props) {
  return (
    <FullBleed>
      <figcaption className="sr-only">{title}</figcaption>
      <div
        className="flex items-baseline justify-between gap-[var(--spacing-sm)] pb-[var(--spacing-sm)]"
        style={{ fontSize: "var(--text-ui)" }}
      >
        <span
          className="font-sans"
          style={{ color: "var(--color-text-muted)", letterSpacing: "-0.005em" }}
        >
          {title}
        </span>
        {measurements ? (
          <span
            className="font-mono tabular-nums text-right"
            style={{ fontSize: "var(--text-small)", color: "var(--color-text-muted)" }}
          >
            {measurements}
          </span>
        ) : null}
      </div>

      <div
        className="rounded-[var(--radius-md)] px-[var(--spacing-sm)] py-[var(--spacing-md)]"
        style={{
          background: "color-mix(in oklab, var(--color-surface) 40%, transparent)",
        }}
      >
        {children}
      </div>

      {controls ? <div className="pt-[var(--spacing-sm)]">{controls}</div> : null}

      {caption ? (
        <div
          className="pt-[var(--spacing-sm)] font-sans"
          style={{
            fontSize: "var(--text-small)",
            color: "var(--color-text-muted)",
            lineHeight: 1.5,
          }}
        >
          {caption}
        </div>
      ) : null}
    </FullBleed>
  );
}
