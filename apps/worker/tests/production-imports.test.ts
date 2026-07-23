import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const sourceRoot = path.resolve(process.cwd(), "src");

describe("worker production module graph", () => {
  it("uses Node-compatible extensions for every relative import", () => {
    const sourceFiles = readdirSync(sourceRoot, { recursive: true })
      .map(String)
      .filter((file) => file.endsWith(".ts"));
    const invalidImports: string[] = [];

    for (const relativePath of sourceFiles) {
      const source = readFileSync(path.join(sourceRoot, relativePath), "utf8");
      for (const match of source.matchAll(/from\s+["'](\.{1,2}\/[^"']+)["']/g)) {
        const specifier = match[1];
        if (specifier && !/\.(?:js|json)$/.test(specifier)) {
          invalidImports.push(`${relativePath}: ${specifier}`);
        }
      }
    }

    expect(invalidImports).toEqual([]);
  });
});
