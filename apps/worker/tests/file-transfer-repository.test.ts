import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { FileTransferRepository } from "../src/preflight/file-transfer-repository";

describe("FileTransferRepository", () => {
  it("persists signed bytes, amount, and lifecycle state in a private file", async () => {
    const directory = await mkdtemp(join(tmpdir(), "pods-transfer-test-"));
    const repository = new FileTransferRepository(directory);

    await repository.savePrepared({
      recipient: "NQ00 TEST",
      valueLuna: 1_000n,
      network: "testnet",
      rawTransactionHex: "aabbcc",
      hash: "hash-1",
      validityStartHeight: 42,
      preparedAt: "2026-07-19T00:00:00.000Z"
    });
    await repository.markUnknown("hash-1", "simulated response loss");
    await repository.markBroadcast("hash-1");
    await repository.markConfirmed("hash-1");

    const stored = await repository.getByHash("hash-1");
    const filePath = join(directory, "hash-1.json");
    const raw = JSON.parse(await readFile(filePath, "utf8")) as Record<string, unknown>;

    expect(stored?.valueLuna).toBe(1_000n);
    expect(stored?.rawTransactionHex).toBe("aabbcc");
    expect(raw.valueLuna).toBe("1000");
    expect(raw.state).toBe("confirmed");
    expect(raw.unknownReason).toBe("simulated response loss");
    expect((await stat(filePath)).mode & 0o777).toBe(0o600);
  });
});
