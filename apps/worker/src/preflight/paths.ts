import { fileURLToPath } from "node:url";
import { join } from "node:path";

export const repositoryRoot = fileURLToPath(new URL("../../../../", import.meta.url));
export const preflightRuntimeDirectory = join(
  repositoryRoot,
  ".runtime",
  "preflight"
);
export const treasuryConfigurationPath = join(
  preflightRuntimeDirectory,
  "treasury.env"
);
export const transferLedgerDirectory = join(
  preflightRuntimeDirectory,
  "transfers"
);
