import { describe, expect, it } from "vitest";

import RootLayout from "../src/app/layout";

describe("Nimiq Pay root layout", () => {
  it("tolerates only the host-injected document-root style during hydration", () => {
    const layout = RootLayout({ children: <main>Pods</main> });

    expect(layout.type).toBe("html");
    expect(layout.props.suppressHydrationWarning).toBe(true);
  });
});
