import { resolve } from "node:path";

import { findEmDashViolations } from "./check-copy-lib";

const root = resolve(import.meta.dirname, "..");
const violations = await findEmDashViolations([root]);

if (violations.length > 0) {
  for (const violation of violations) {
    console.error(`${violation.file}:${violation.line} contains forbidden U+2014`);
  }
  process.exitCode = 1;
} else {
  console.log("Copy check passed: no U+2014 characters found.");
}
