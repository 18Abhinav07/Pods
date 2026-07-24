import type { TransferLegState } from "@pods/domain";
import { NextResponse } from "next/server";

import { hasOpsSession } from "../../../../lib/ops-session";
import { podsRepository } from "../../../../lib/server-db";

const operationsStates = [
  "unknown",
  "retryable_failed",
  "mismatched",
  "late",
  "manual_review"
] as const satisfies readonly TransferLegState[];

type OperationsState = (typeof operationsStates)[number];

function isOperationsState(value: string): value is OperationsState {
  return operationsStates.includes(value as OperationsState);
}

export async function GET(request: Request) {
  if (!(await hasOpsSession())) {
    return NextResponse.json(
      { error: "Operations session required" },
      { status: 401 }
    );
  }
  const requested = new URL(request.url).searchParams.getAll("state");
  if (requested.some((state) => !isOperationsState(state))) {
    return NextResponse.json(
      { error: "Transfer state filter is invalid" },
      { status: 400 }
    );
  }
  const states = requested.length > 0
    ? requested as OperationsState[]
    : [...operationsStates];
  const transfers = await podsRepository.listPayoutTransferOperations({
    states,
    limit: 100
  });
  return NextResponse.json({ transfers });
}
