import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { findEmDashViolations } from "./check-copy-lib";

describe("copy enforcement", () => {
  it("reports U+2014 with its file and line", async () => {
    const root = await mkdtemp(join(tmpdir(), "pods-copy-"));
    const file = join(root, "copy.ts");
    await writeFile(file, "first line\nblocked \u2014 copy\n", "utf8");

    const violations = await findEmDashViolations([root]);

    expect(violations).toEqual([{ file, line: 2 }]);
  });

  it("ignores dependencies and generated output", async () => {
    const root = await mkdtemp(join(tmpdir(), "pods-copy-"));
    const dependency = join(root, "node_modules");
    const generated = join(root, ".next");
    await import("node:fs/promises").then(({ mkdir }) => Promise.all([
      mkdir(dependency, { recursive: true }),
      mkdir(generated, { recursive: true })
    ]));
    await Promise.all([
      writeFile(join(dependency, "copy.ts"), "blocked \u2014 copy", "utf8"),
      writeFile(join(generated, "copy.js"), "blocked \u2014 copy", "utf8")
    ]);

    expect(await findEmDashViolations([root])).toEqual([]);
  });
});
