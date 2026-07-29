import type { Viewport } from "next";

import { HomePage } from "../components/home-page";

// The landing page uses the warm atlas paper rather than the app shell's paper,
// so the browser chrome has to match it instead of the root layout default.
export const viewport: Viewport = {
  themeColor: "#f2efe6"
};

export default function Page() {
  return <HomePage />;
}
