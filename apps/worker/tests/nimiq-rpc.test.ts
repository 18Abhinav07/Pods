import { describe, expect, it, vi } from "vitest";

import { NimiqRpcClient } from "../src/preflight/nimiq-rpc";

function response(data: unknown) {
  return new Response(
    JSON.stringify({ jsonrpc: "2.0", id: 1, result: { data, metadata: null } }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}

describe("NimiqRpcClient", () => {
  it("uses the documented raw transaction and block-number RPC shapes", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response({ number: 6_407_500, batch: 12, network: "TestAlbatross" }))
      .mockResolvedValueOnce(response(6_407_500))
      .mockResolvedValueOnce(response("transaction-hash"));
    const rpc = new NimiqRpcClient("https://rpc.testnet.example", fetchMock);

    await expect(rpc.getNetworkName()).resolves.toBe("TestAlbatross");
    await expect(rpc.getBlockNumber()).resolves.toBe(6_407_500);
    await expect(rpc.sendRawTransaction("aabbcc")).resolves.toBe("transaction-hash");

    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
      method: "getLatestBlock",
      params: [false]
    });
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toMatchObject({
      method: "getBlockNumber",
      params: []
    });
    expect(JSON.parse(String(fetchMock.mock.calls[2]?.[1]?.body))).toMatchObject({
      method: "sendRawTransaction",
      params: ["aabbcc"]
    });
  });

  it("reports finality only after a later macro batch is observed", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        response({
          hash: "hash-1",
          blockNumber: 100,
          executionResult: true
        })
      )
      .mockResolvedValueOnce(response({ number: 100, batch: 12 }))
      .mockResolvedValueOnce(response({ number: 121, batch: 13 }));
    const rpc = new NimiqRpcClient("https://rpc.testnet.example", fetchMock);

    await expect(rpc.getTransactionByHash("hash-1")).resolves.toEqual({
      hash: "hash-1",
      finalized: true,
      executionResult: true,
      blockNumber: 100,
      transactionBatch: 12,
      latestBatch: 13
    });
  });

  it("does not mark a transaction final inside its containing batch", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        response({
          hash: "hash-2",
          blockNumber: 120,
          executionResult: true
        })
      )
      .mockResolvedValueOnce(response({ number: 120, batch: 14 }))
      .mockResolvedValueOnce(response({ number: 125, batch: 14 }));
    const rpc = new NimiqRpcClient("https://rpc.testnet.example", fetchMock);

    await expect(rpc.getTransactionByHash("hash-2")).resolves.toMatchObject({
      finalized: false,
      transactionBatch: 14,
      latestBatch: 14
    });
  });
});
