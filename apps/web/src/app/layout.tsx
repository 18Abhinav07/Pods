import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "@fontsource-variable/mulish";
import "@fontsource/fira-mono/400.css";
import "@fontsource/fira-mono/700.css";
import "./globals.css";
import "./design-system.css";

export const metadata: Metadata = {
  applicationName: "pods",
  title: "pods | Earned Momentum",
  description: "NIM-backed group activity accountability inside Nimiq Pay.",
  icons: {
    icon: [{ url: "/brand/pods-mark.svg", type: "image/svg+xml" }],
    shortcut: "/brand/pods-mark.svg"
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
