import type { DepositBlock, DepositTransaction } from "./deposit-reconciler";

interface JsonRpcSuccess<T> {
  jsonrpc: "2.0";
  id: number;
  result: T | { data: T; metadata?: unknown };
}

interface JsonRpcFailure {
  jsonrpc: "2.0";
  id: number;
  error: { code: number; message: string; data?: unknown };
}

type RawTransaction = Omit<DepositTransaction, "recipientData" | "transactionIndex"> & {
  recipientData: unknown;
  transactionIndex?: number;
  index?: number;
};

function decodeRecipientData(value: unknown): string {
  if (Array.isArray(value) && value.every((item) => Number.isInteger(item) && item >= 0 && item <= 255)) {
    return new TextDecoder().decode(Uint8Array.from(value as number[]));
  }
  if (typeof value !== "string") {
    throw new Error("RPC transaction recipientData is not text or bytes");
  }
  if (/^(?:[a-f0-9]{2})+$/i.test(value)) {
    return new TextDecoder().decode(Uint8Array.from(value.match(/.{2}/g)!.map((byte) => Number.parseInt(byte, 16))));
  }
  return value;
}

function transactionFromRpc(value: RawTransaction): DepositTransaction {
  if (
    typeof value.hash !== "string" ||
    typeof value.from !== "string" ||
    !Number.isInteger(value.fromType) ||
    typeof value.to !== "string" ||
    !Number.isSafeInteger(value.value) ||
    !Number.isInteger(value.networkId) ||
    typeof value.executionResult !== "boolean" ||
    !Number.isInteger(value.blockNumber) ||
    !Array.isArray(value.relatedAddresses) ||
    !value.relatedAddresses.every((address) => typeof address === "string")
  ) {
    throw new Error("RPC returned an incomplete deposit transaction");
  }
  const transactionIndex = value.transactionIndex ?? value.index ?? 0;
  if (!Number.isInteger(transactionIndex) || transactionIndex < 0) {
    throw new Error("RPC returned an invalid transaction index");
  }
  return {
    hash: value.hash,
    from: value.from,
    fromType: value.fromType,
    to: value.to,
    value: value.value,
    recipientData: decodeRecipientData(value.recipientData),
    networkId: value.networkId,
    executionResult: value.executionResult,
    blockNumber: value.blockNumber,
    transactionIndex,
    relatedAddresses: [...value.relatedAddresses]
  };
}

function blockFromRpc(value: DepositBlock): DepositBlock {
  if (
    !Number.isInteger(value.number) ||
    !Number.isInteger(value.batch) ||
    typeof value.network !== "string"
  ) {
    throw new Error("RPC returned an incomplete block");
  }
  return { number: value.number, batch: value.batch, network: value.network };
}

export interface DepositRpc {
  getTransactionsByAddress(address: string, limit: number): Promise<DepositTransaction[]>;
  getTransactionByHash(hash: string): Promise<DepositTransaction | undefined>;
  getBlockByNumber(blockNumber: number): Promise<DepositBlock>;
  getLatestBlock(): Promise<DepositBlock>;
}

export class NimiqDepositRpc implements DepositRpc {
  private requestId = 0;

  constructor(
    private readonly rpcUrl: string,
    private readonly fetchImplementation: typeof fetch = fetch
  ) {}

  async getTransactionsByAddress(address: string, limit: number) {
    if (!Number.isInteger(limit) || limit <= 0 || limit > 500) {
      throw new Error("Deposit scan limit must be between 1 and 500");
    }
    const transactions = await this.call<RawTransaction[]>(
      "getTransactionsByAddress",
      [address, limit, null]
    );
    return transactions.map(transactionFromRpc);
  }

  async getTransactionByHash(hash: string) {
    const transaction = await this.call<RawTransaction | null>("getTransactionByHash", [hash]);
    return transaction ? transactionFromRpc(transaction) : undefined;
  }

  async getBlockByNumber(blockNumber: number) {
    return blockFromRpc(
      await this.call<DepositBlock>("getBlockByNumber", [blockNumber, false])
    );
  }

  async getLatestBlock() {
    return blockFromRpc(await this.call<DepositBlock>("getLatestBlock", [false]));
  }

  private async call<T>(method: string, params: unknown[]): Promise<T> {
    const response = await this.fetchImplementation(this.rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: ++this.requestId,
        method,
        params
      })
    });
    if (!response.ok) {
      throw new Error(`${method} RPC request failed with HTTP ${response.status}`);
    }
    const body = (await response.json()) as JsonRpcSuccess<T> | JsonRpcFailure;
    if ("error" in body) {
      throw new Error(`${method} RPC error ${body.error.code}: ${body.error.message}`);
    }
    const result = body.result;
    if (typeof result === "object" && result !== null && "data" in result) {
      return result.data;
    }
    return result;
  }
}
