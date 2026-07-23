import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "@fontsource-variable/mulish";
import "@fontsource/fira-mono/400.css";
import "@fontsource/fira-mono/700.css";
import "./globals.css";
import "./design-system.css";
import "./landing-page.css";

export const metadata: Metadata = {
  applicationName: "pods",
  title: "pods | Earned Momentum",
  description: "NIM-backed group activity accountability inside Nimiq Pay.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/brand/pods-mark.svg", type: "image/svg+xml" },
      { url: "/brand/pods-icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/brand/pods-icon-512.png", type: "image/png", sizes: "512x512" }
    ],
    shortcut: "/brand/pods-icon-192.png",
    apple: [{ url: "/brand/pods-apple-touch-icon.png", sizes: "180x180" }]
  },
  appleWebApp: {
    capable: true,
    title: "pods",
    statusBarStyle: "default"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f8f7f2"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
