import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";

export interface CopyViolation {
  file: string;
  line: number;
}

const ignoredDirectories = new Set([
  ".git",
  ".next",
  ".pnpm-store",
  "coverage",
  "dist",
  "node_modules",
  "playwright-report",
  "test-results"
]);

const scannedExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".ts",
  ".tsx",
  ".yaml",
  ".yml"
]);

async function collectFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (ignoredDirectories.has(entry.name)) {
      continue;
    }

    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(path));
      continue;
    }

    if (entry.isFile() && scannedExtensions.has(extname(entry.name))) {
      files.push(path);
    }
  }

  return files;
}

export async function findEmDashViolations(roots: string[]): Promise<CopyViolation[]> {
  const violations: CopyViolation[] = [];

  for (const root of roots) {
    for (const file of await collectFiles(root)) {
      const lines = (await readFile(file, "utf8")).split(/\r?\n/u);
      lines.forEach((line, index) => {
        if (line.includes("\u2014")) {
          violations.push({ file, line: index + 1 });
        }
      });
    }
  }

  return violations;
}
