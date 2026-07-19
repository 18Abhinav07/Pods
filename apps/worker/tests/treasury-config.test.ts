import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  createTreasuryConfiguration,
  readTreasuryConfiguration
} from "../src/preflight/treasury-config";

describe("treasury preflight configuration", () => {
  it("writes a private local environment file without logging the key", async () => {
    const directory = await mkdtemp(join(tmpdir(), "pods-treasury-test-"));
    const filePath = join(directory, "treasury.env");

    const created = await createTreasuryConfiguration(filePath, "44".repeat(32));
    const file = await readFile(filePath, "utf8");
    const loaded = await readTreasuryConfiguration(filePath);

    expect(created.address).toMatch(/^NQ/);
    expect(file).toContain("PODS_TREASURY_PRIVATE_KEY_HEX=");
    expect(file).toContain("NIMIQ_NETWORK=testnet");
    expect(loaded.address).toBe(created.address);
    expect(loaded.privateKeyHex).toBe("44".repeat(32));
    expect((await stat(filePath)).mode & 0o777).toBe(0o600);
  });
});
