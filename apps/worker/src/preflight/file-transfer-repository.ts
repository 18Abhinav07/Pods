import { chmod, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type {
  PersistedTransfer,
  PersistedTransferState,
  PreparedTransfer,
  TransferRepository
} from "./transfer-service";

interface StoredTransferFile {
  recipient: string;
  valueLuna: string;
  network: PreparedTransfer["network"];
  rawTransactionHex: string;
  hash: string;
  validityStartHeight: number;
  preparedAt: string;
  state: PersistedTransferState;
  broadcastAt?: string;
  confirmedAt?: string;
  unknownAt?: string;
  unknownReason?: string;
  failedAt?: string;
  failureReason?: string;
}

export class FileTransferRepository implements TransferRepository {
  constructor(
    private readonly directory: string,
    private readonly now: () => Date = () => new Date()
  ) {}

  async savePrepared(transfer: PreparedTransfer): Promise<void> {
    await this.write({
      ...transfer,
      valueLuna: transfer.valueLuna.toString(),
      state: "prepared"
    });
  }

  async getByHash(hash: string): Promise<PersistedTransfer | undefined> {
    const record = await this.read(hash);
    if (!record) {
      return undefined;
    }
    return {
      recipient: record.recipient,
      valueLuna: BigInt(record.valueLuna),
      network: record.network,
      rawTransactionHex: record.rawTransactionHex,
      hash: record.hash,
      validityStartHeight: record.validityStartHeight,
      preparedAt: record.preparedAt,
      state: record.state
    };
  }

  async markBroadcast(hash: string): Promise<void> {
    await this.update(hash, {
      state: "broadcast",
      broadcastAt: this.now().toISOString()
    });
  }

  async markConfirmed(hash: string): Promise<void> {
    await this.update(hash, {
      state: "confirmed",
      confirmedAt: this.now().toISOString()
    });
  }

  async markUnknown(hash: string, reason: string): Promise<void> {
    await this.update(hash, {
      state: "unknown",
      unknownAt: this.now().toISOString(),
      unknownReason: reason
    });
  }

  async markFailed(hash: string, reason: string): Promise<void> {
    await this.update(hash, {
      state: "failed",
      failedAt: this.now().toISOString(),
      failureReason: reason
    });
  }

  private async update(
    hash: string,
    change: Partial<StoredTransferFile>
  ): Promise<void> {
    const record = await this.read(hash);
    if (!record) {
      throw new Error(`Prepared transfer not found: ${hash}`);
    }
    await this.write({ ...record, ...change });
  }

  private async read(hash: string): Promise<StoredTransferFile | undefined> {
    const filePath = this.filePath(hash);
    try {
      return JSON.parse(await readFile(filePath, "utf8")) as StoredTransferFile;
    } catch (error) {
      if (isNodeError(error) && error.code === "ENOENT") {
        return undefined;
      }
      throw error;
    }
  }

  private async write(record: StoredTransferFile): Promise<void> {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    await chmod(this.directory, 0o700);
    const filePath = this.filePath(record.hash);
    const temporaryPath = `${filePath}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(record, null, 2)}\n`, {
      mode: 0o600
    });
    await chmod(temporaryPath, 0o600);
    await rename(temporaryPath, filePath);
    await chmod(filePath, 0o600);
  }

  private filePath(hash: string): string {
    if (!/^[a-zA-Z0-9_-]+$/.test(hash)) {
      throw new Error("Transfer hash contains unsafe path characters");
    }
    return join(this.directory, `${hash}.json`);
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
