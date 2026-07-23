import { access } from "node:fs/promises";

import {
  createTreasuryConfiguration,
  readTreasuryConfiguration
} from "./treasury-config.js";
import { treasuryConfigurationPath } from "./paths.js";

const exists = await fileExists(treasuryConfigurationPath);
const configuration = exists
  ? await readTreasuryConfiguration(treasuryConfigurationPath)
  : await createTreasuryConfiguration(treasuryConfigurationPath);

console.log(
  JSON.stringify(
    {
      status: exists ? "existing" : "created",
      network: configuration.network,
      address: configuration.address,
      rpcUrl: configuration.rpcUrl,
      secretFile: treasuryConfigurationPath,
      next: "Fund this treasury with Testnet NIM before running preflight:send."
    },
    null,
    2
  )
);

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}
