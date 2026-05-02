import type { Metadata, Viewport } from "next";
import { IBM_Plex_Serif, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/nav/Footer";
import { CozyFrame } from "@/components/nav/CozyFrame";
import { NavigationSounds } from "@/components/nav/NavigationSounds";
import { MotionConfigProvider } from "@/components/providers/motion-config";
import { GoatCounter } from "@/components/analytics/GoatCounter";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

// Path B-lite, expanded for the Phase 1 type-ramp revamp: Plex Serif gains
// 300 (lighter editorial register for chrome / metadata copy); Plex Sans
// gains 700 so h1 has real weight differentiation against h2/h3 (600). 11
// font files → 13. Proper Path A (self-hosted variable fonts) is still
// deferred to a follow-up phase once VF glyph coverage is verified against
// the content corpus.
const plexSerif = IBM_Plex_Serif({
  variable: "--font-plex-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [{ url: "/og/_default", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ["/og/_default"],
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
          defaultTheme="light"
          enableSystem
        >
          <MotionConfigProvider>
            <NavigationSounds />
            <CozyFrame>
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </CozyFrame>
          </MotionConfigProvider>
        </ThemeProvider>
        <GoatCounter />
      </body>
    </html>
  );
}
