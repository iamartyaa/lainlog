import type { Metadata } from "next";
import { IBM_Plex_Serif, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/nav/Footer";
import { MotionConfigProvider } from "@/components/providers/motion-config";

const plexSerif = IBM_Plex_Serif({
  variable: "--font-plex-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
  metadataBase: new URL("https://bytesize.vercel.app"),
  title: { default: "bytesize", template: "%s · bytesize" },
  description:
    "small, digestible explainers in software and AI engineering, with widgets that teach.",
  authors: [{ name: "Amartya", url: "https://github.com/iamartyaa" }],
  openGraph: {
    title: "bytesize",
    description:
      "small, digestible explainers in software and AI engineering, with widgets that teach.",
    type: "website",
  },
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
          disableTransitionOnChange
        >
          <MotionConfigProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </MotionConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
