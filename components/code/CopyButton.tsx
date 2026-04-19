"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard API may be unavailable in insecure contexts — fail silently.
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={copied ? "Copied" : "Copy code"}
      className="absolute right-3 top-3 select-none opacity-0 transition-opacity duration-[var(--dur-base,240ms)] group-hover:opacity-100 focus-visible:opacity-100 font-sans"
      style={{
        fontSize: "var(--text-small)",
        color: copied ? "var(--color-accent)" : "var(--color-text-muted)",
      }}
    >
      {copied ? "copied" : "copy"}
    </button>
  );
}
