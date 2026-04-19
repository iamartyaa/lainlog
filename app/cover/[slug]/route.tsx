import { ImageResponse } from "next/og";
import { POSTS } from "@/content/posts-manifest";
import { SITE_NAME } from "@/lib/site";

export const runtime = "edge";

const SIZE = { width: 960, height: 640 };

// Palette base — dark bytesize theme, resolved to RGB (Satori supports a
// limited subset of CSS; no oklch or custom properties here).
const BG = "#0e1114";
const TEXT = "#f8f5f0";
const MUTED = "#7a7570";

// Three lightly different terracotta shades so auto-covers don't all look
// identical. Hue stays within the brand family; only lightness/chroma shift.
const PALETTE: Array<{ accent: string; swatch: string }> = [
  { accent: "#d97341", swatch: "#d97341" },
  { accent: "#c86438", swatch: "#c86438" },
  { accent: "#e88653", swatch: "#e88653" },
  { accent: "#b65a31", swatch: "#b65a31" },
  { accent: "#d97341", swatch: "#eda378" },
];

/** Tiny deterministic hash so a given slug always picks the same variant. */
function pickVariant(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (h * 31 + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % PALETTE.length;
}

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, ctx: RouteContext) {
  const { slug } = await ctx.params;
  const post = POSTS.find((p) => p.slug === slug);

  const title = post?.title ?? SITE_NAME;
  const hook = post?.hook ?? "engineering essays with interactive widgets.";

  const variant = PALETTE[pickVariant(slug)];
  // Initials for the glyph — first two significant letters of the first word
  // of the title. Keeps it readable at thumbnail sizes.
  const glyph = (() => {
    const firstWord = (post?.title ?? slug).trim().split(/\s+/)[0] ?? "";
    return firstWord.slice(0, 2).toLowerCase();
  })();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: BG,
          color: TEXT,
          display: "flex",
          flexDirection: "column",
          padding: "56px 64px",
          fontFamily: "'IBM Plex Sans', sans-serif",
        }}
      >
        {/* top row: wordmark + swatch */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontFamily: "'IBM Plex Mono', monospace",
              letterSpacing: "0.05em",
              color: MUTED,
            }}
          >
            {SITE_NAME}
          </div>
          <div
            style={{
              width: 14,
              height: 14,
              background: variant.swatch,
            }}
          />
        </div>

        {/* center: big terracotta glyph + title */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            gap: 40,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 200,
              height: 200,
              color: variant.accent,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 128,
              fontWeight: 500,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              border: `1px solid ${variant.accent}`,
              borderRadius: 4,
            }}
          >
            {glyph}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              gap: 16,
            }}
          >
            <div
              style={{
                fontSize: 44,
                fontWeight: 600,
                lineHeight: 1.1,
                letterSpacing: "-0.015em",
                color: TEXT,
                maxWidth: 560,
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 20,
                lineHeight: 1.4,
                color: MUTED,
                fontFamily: "'IBM Plex Serif', serif",
                maxWidth: 560,
              }}
            >
              {hook}
            </div>
          </div>
        </div>

        {/* bottom row: subtle rule + meta */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 14,
            fontFamily: "'IBM Plex Mono', monospace",
            color: MUTED,
            letterSpacing: "0.04em",
          }}
        >
          <div
            style={{
              width: 80,
              height: 1,
              background: MUTED,
              opacity: 0.4,
            }}
          />
          <span>explainers · widgets · craft</span>
        </div>
      </div>
    ),
    {
      ...SIZE,
      headers: {
        // Covers are deterministic per slug → cache hard.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    },
  );
}
