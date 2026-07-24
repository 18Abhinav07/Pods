import { beforeEach, describe, expect, it, vi } from "vitest";

const hasOpsSession = vi.hoisted(() => vi.fn());
const listPayoutTransferOperations = vi.hoisted(() => vi.fn());
const getPayoutRetryCandidate = vi.hoisted(() => vi.fn());
const requestPayoutRetry = vi.hoisted(() => vi.fn());
const getEffectiveTime = vi.hoisted(() => vi.fn());
const getTransactionByHash = vi.hoisted(() => vi.fn());
const getBlockNumber = vi.hoisted(() => vi.fn());

vi.mock("../src/lib/ops-session", () => ({ hasOpsSession }));
vi.mock("../src/lib/server-db", () => ({
  podsRepository: {
    listPayoutTransferOperations,
    getPayoutRetryCandidate,
    requestPayoutRetry,
    getEffectiveTime
  }
}));
vi.mock("../src/lib/ops-nimiq-rpc", () => ({
  createOpsNimiqRpc: () => ({ getTransactionByHash, getBlockNumber })
}));

import { GET } from "../src/app/api/ops/transfers/route";
import { POST } from "../src/app/api/ops/transfers/[legId]/retry/route";

const legId = "430296c7-9554-43e6-9b43-bfd063391028";
const attemptId = "530296c7-9554-43e6-9b43-bfd063391029";
const transactionHash = "a".repeat(64);

describe("payout transfer operations routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("PODS_OPS_REVIEWER_ID", "pods-finance");
    hasOpsSession.mockResolvedValue(true);
    listPayoutTransferOperations.mockResolvedValue([]);
    requestPayoutRetry.mockResolvedValue({ id: legId, state: "queued" });
    getEffectiveTime.mockResolvedValue(new Date("2027-05-04T00:00:00.000Z"));
    getPayoutRetryCandidate.mockResolvedValue({
      id: legId,
      state: "retryable_failed",
      attempt: {
        id: attemptId,
        state: "retryable_failed",
        transactionHash,
        validityStartHeight: 1_000
      }
    });
  });

  it("rejects an unauthenticated queue read", async () => {
    hasOpsSession.mockResolvedValue(false);

    const response = await GET(
      new Request("http://localhost/api/ops/transfers")
    );

    expect(response.status).toBe(401);
    expect(listPayoutTransferOperations).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated retry mutation", async () => {
    hasOpsSession.mockResolvedValue(false);

    const response = await POST(
      new Request(`http://localhost/api/ops/transfers/${legId}/retry`, {
        method: "POST",
        body: JSON.stringify({
          reason: "This request must never reach the repository."
        })
      }),
      { params: Promise.resolve({ legId }) }
    );

    expect(response.status).toBe(401);
    expect(getPayoutRetryCandidate).not.toHaveBeenCalled();
    expect(requestPayoutRetry).not.toHaveBeenCalled();
  });

  it("accepts only the five operations transfer filters", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/ops/transfers?state=unknown&state=retryable_failed&state=mismatched&state=late&state=manual_review"
      )
    );

    expect(response.status).toBe(200);
    expect(listPayoutTransferOperations).toHaveBeenCalledWith({
      states: [
        "unknown",
        "retryable_failed",
        "mismatched",
        "late",
        "manual_review"
      ],
      limit: 100
    });
  });

  it("requires a fresh failed chain result before retrying", async () => {
    getTransactionByHash.mockResolvedValue({
      hash: transactionHash,
      executionResult: false,
      finalized: true
    });

    const response = await POST(
      new Request(`http://localhost/api/ops/transfers/${legId}/retry`, {
        method: "POST",
        body: JSON.stringify({
          reason: "Execution failed and a replacement is required."
        })
      }),
      { params: Promise.resolve({ legId }) }
    );

    expect(response.status).toBe(200);
    expect(getTransactionByHash).toHaveBeenCalledWith(transactionHash);
    expect(requestPayoutRetry).toHaveBeenCalledWith(expect.objectContaining({
      legId,
      attemptId,
      actor: "pods-finance"
    }));
  });

  it("requires a fresh absent lookup and expired validity window for a late retry", async () => {
    getPayoutRetryCandidate.mockResolvedValue({
      id: legId,
      state: "late",
      attempt: {
        id: attemptId,
        state: "late",
        transactionHash,
        validityStartHeight: 1_000
      }
    });
    getTransactionByHash.mockResolvedValue(undefined);
    getBlockNumber.mockResolvedValue(8_201);

    const response = await POST(
      new Request(`http://localhost/api/ops/transfers/${legId}/retry`, {
        method: "POST",
        body: JSON.stringify({
          reason: "Validity expired and the transaction remains absent."
        })
      }),
      { params: Promise.resolve({ legId }) }
    );

    expect(response.status).toBe(200);
    expect(getBlockNumber).toHaveBeenCalledTimes(1);
    expect(requestPayoutRetry).toHaveBeenCalledTimes(1);
  });

  it("does not retry a transaction that is present and successful", async () => {
    getTransactionByHash.mockResolvedValue({
      hash: transactionHash,
      executionResult: true,
      finalized: false
    });

    const response = await POST(
      new Request(`http://localhost/api/ops/transfers/${legId}/retry`, {
        method: "POST",
        body: JSON.stringify({
          reason: "This should remain under reconciliation."
        })
      }),
      { params: Promise.resolve({ legId }) }
    );

    expect(response.status).toBe(409);
    expect(requestPayoutRetry).not.toHaveBeenCalled();
  });
});
