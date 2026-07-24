import { NextResponse } from "next/server";

import { createOpsNimiqRpc } from "../../../../../../lib/ops-nimiq-rpc";
import { hasOpsSession } from "../../../../../../lib/ops-session";
import { isUuidRouteParam } from "../../../../../../lib/route-params";
import { podsRepository } from "../../../../../../lib/server-db";

const NIMIQ_TRANSACTION_VALIDITY_BLOCKS = 7_200;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ legId: string }> }
) {
  if (!(await hasOpsSession())) {
    return NextResponse.json(
      { error: "Operations session required" },
      { status: 401 }
    );
  }
  const { legId } = await params;
  if (!isUuidRouteParam(legId)) {
    return NextResponse.json({ error: "Payout transfer not found" }, { status: 404 });
  }
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Retry request is invalid" }, { status: 400 });
  }
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (reason.length < 10 || reason.length > 500) {
    return NextResponse.json({ error: "Retry reason is invalid" }, { status: 400 });
  }
  const candidate = await podsRepository.getPayoutRetryCandidate(legId);
  if (!candidate) {
    return NextResponse.json(
      { error: "Payout is not eligible for a replacement attempt" },
      { status: 409 }
    );
  }

  try {
    const rpc = createOpsNimiqRpc();
    const chainTransaction = await rpc.getTransactionByHash(
      candidate.attempt.transactionHash
    );
    let proof: string;
    if (chainTransaction) {
      if (chainTransaction.executionResult) {
        return NextResponse.json(
          { error: "The existing payout is present and cannot be replaced" },
          { status: 409 }
        );
      }
      proof = "Fresh chain lookup confirmed executionResult=false.";
    } else {
      const blockNumber = await rpc.getBlockNumber();
      if (
        blockNumber <=
        candidate.attempt.validityStartHeight +
          NIMIQ_TRANSACTION_VALIDITY_BLOCKS
      ) {
        return NextResponse.json(
          { error: "The payout validity window has not expired" },
          { status: 409 }
        );
      }
      proof = `Fresh chain lookup found no transaction at height ${blockNumber}.`;
    }
    const now = await podsRepository.getEffectiveTime(new Date());
    const transfer = await podsRepository.requestPayoutRetry({
      legId,
      attemptId: candidate.attempt.id,
      actor: process.env.PODS_OPS_REVIEWER_ID ?? "pods-team-reviewer",
      reason: `${reason} ${proof}`,
      now
    });
    return NextResponse.json({
      transfer: { id: transfer.id, state: transfer.state }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Payout could not be rechecked"
      },
      { status: 409 }
    );
  }
}
