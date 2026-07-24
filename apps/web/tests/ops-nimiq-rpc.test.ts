import { describe, expect, it, vi } from "vitest";

import { OpsNimiqRpc } from "../src/lib/ops-nimiq-rpc";

function rpcResponse(result: unknown) {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}

describe("operations Nimiq read RPC", () => {
  it("reads execution and macro-block finality without exposing a broadcast method", async () => {
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        rpcResponse({
          hash: "a".repeat(64),
          blockNumber: 150,
          executionResult: false
        })
      )
      .mockResolvedValueOnce(rpcResponse({ number: 150, batch: 10 }))
      .mockResolvedValueOnce(rpcResponse({ number: 180, batch: 11 }));
    const rpc = new OpsNimiqRpc(
      "https://rpc.invalid",
      fetchImplementation
    );

    await expect(rpc.getTransactionByHash("a".repeat(64))).resolves.toEqual({
      hash: "a".repeat(64),
      blockNumber: 150,
      executionResult: false,
      finalized: true
    });
    expect("sendRawTransaction" in rpc).toBe(false);
  });

  it("treats the Nimiq transaction-not-found response as an absent transaction", async () => {
    const hash = "b".repeat(64);
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          error: {
            code: -32603,
            message: "Internal error",
            data: `Transaction not found: ${hash}`
          }
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );
    const rpc = new OpsNimiqRpc(
      "https://rpc.invalid",
      fetchImplementation
    );

    await expect(rpc.getTransactionByHash(hash)).resolves.toBeUndefined();
  });
});
