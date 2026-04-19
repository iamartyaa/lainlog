import type { Metadata, Viewport } from "next";
import { IBM_Plex_Serif, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/nav/Footer";
import { CozyFrame } from "@/components/nav/CozyFrame";
import { MotionConfigProvider } from "@/components/providers/motion-config";
import {
  SITE_AUTHOR,
  SITE_AUTHOR_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";

// Path B-lite: pre-flight grep found no `font-bold` / fontWeight 700 usage
// (600 is the heaviest actually rendered weight via `font-semibold`), so we
// drop 700 from both subsets. 14 font files → 11. Proper Path A (self-hosted
// variable fonts) is deferred to Phase 7 once VF glyph coverage is verified
// against the content corpus.
const plexSerif = IBM_Plex_Serif({
  variable: "--font-plex-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} · engineering essays`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  authors: [{ name: SITE_AUTHOR, url: SITE_AUTHOR_URL }],
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "oklch(0.12 0.015 28)" },
    { media: "(prefers-color-scheme: light)", color: "oklch(0.98 0.005 28)" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plexSerif.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-serif">
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="dark"
          enableSystem
        >
          <MotionConfigProvider>
            <CozyFrame>
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </CozyFrame>
          </MotionConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
