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
}

export interface OpsTransactionLookup {
  hash: string;
  finalized: boolean;
  executionResult: boolean;
  blockNumber: number;
}

export class OpsNimiqRpc {
  private requestId = 0;

  constructor(
    private readonly rpcUrl: string,
    private readonly fetchImplementation: typeof fetch = fetch
  ) {}

  getBlockNumber() {
    return this.call<number>("getBlockNumber", []);
  }

  async getTransactionByHash(
    hash: string
  ): Promise<OpsTransactionLookup | undefined> {
    const transaction = await this.call<RpcTransaction | null>(
      "getTransactionByHash",
      [hash]
    );
    if (!transaction) return undefined;
    if (transaction.hash !== hash) {
      throw new Error("RPC returned a different transaction hash");
    }
    const [containingBlock, latestBlock] = await Promise.all([
      this.call<RpcBlock>("getBlockByNumber", [transaction.blockNumber, false]),
      this.call<RpcBlock>("getLatestBlock", [false])
    ]);
    return {
      hash: transaction.hash,
      finalized: latestBlock.batch > containingBlock.batch,
      executionResult: transaction.executionResult,
      blockNumber: transaction.blockNumber
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
      const transactionHash = params[0];
      if (
        method === "getTransactionByHash" &&
        body.error.code === -32603 &&
        typeof transactionHash === "string" &&
        body.error.data === `Transaction not found: ${transactionHash}`
      ) {
        return null as T;
      }
      throw new Error(`${method} RPC error ${body.error.code}: ${body.error.message}`);
    }
    const result = body.result;
    if (typeof result === "object" && result !== null && "data" in result) {
      return result.data;
    }
    return result;
  }
}

export function createOpsNimiqRpc() {
  const rpcUrl = process.env.NIMIQ_RPC_URL;
  if (!rpcUrl) throw new Error("NIMIQ_RPC_URL is required");
  return new OpsNimiqRpc(rpcUrl);
}
