import type { TransactionLookup, TransferRpc } from "./transfer-service";

interface JsonRpcSuccess<T> {
  jsonrpc: "2.0";
  id: number;
  result: T | { data: T; metadata?: unknown };
}

interface JsonRpcFailure {
  jsonrpc: "2.0";
  id: number;
  error: {
    code: number;
    message: string;
    data?: unknown;
  };
}

interface RpcTransaction {
  hash: string;
  blockNumber: number;
  executionResult: boolean;
}

interface RpcBlock {
  number: number;
  batch: number;
  network?: string;
}

export class NimiqRpcClient implements TransferRpc {
  private requestId = 0;

  constructor(
    private readonly rpcUrl: string,
    private readonly fetchImplementation: typeof fetch = fetch
  ) {}

  async getBlockNumber(): Promise<number> {
    return this.call<number>("getBlockNumber", []);
  }

  async getNetworkName(): Promise<string> {
    const block = await this.call<RpcBlock>("getLatestBlock", [false]);
    if (!block.network) {
      throw new Error("Latest block did not include a network name");
    }
    return block.network;
  }

  async sendRawTransaction(rawTransactionHex: string): Promise<string> {
    return this.call<string>("sendRawTransaction", [rawTransactionHex]);
  }

  async getTransactionByHash(hash: string): Promise<TransactionLookup | undefined> {
    const transaction = await this.call<RpcTransaction | null>(
      "getTransactionByHash",
      [hash]
    );
    if (!transaction) {
      return undefined;
    }
    if (transaction.hash !== hash) {
      throw new Error(`RPC returned a different transaction hash for ${hash}`);
    }

    const [containingBlock, latestBlock] = await Promise.all([
      this.call<RpcBlock>("getBlockByNumber", [transaction.blockNumber, false]),
      this.call<RpcBlock>("getLatestBlock", [false])
    ]);

    return {
      hash: transaction.hash,
      finalized: latestBlock.batch > containingBlock.batch,
      executionResult: transaction.executionResult,
      blockNumber: transaction.blockNumber,
      transactionBatch: containingBlock.batch,
      latestBatch: latestBlock.batch
    };
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
    if (
      typeof result === "object" &&
      result !== null &&
      "data" in result
    ) {
      return result.data;
    }
    return result;
  }
}
