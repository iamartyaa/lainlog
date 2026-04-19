import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "bytesize",
  description:
    "small, digestible explainers in software and AI engineering, with widgets that teach.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
