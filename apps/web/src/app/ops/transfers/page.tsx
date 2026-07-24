import type { TransferLegState } from "@pods/domain";
import Link from "next/link";

import { PayoutRetryControls } from "../../../components/payout-retry-controls";
import { formatZonedMoment } from "../../../lib/format-moment";
import { requireOpsSession } from "../../../lib/ops-session";
import { podsRepository } from "../../../lib/server-db";

const filters = [
  ["unknown", "Unknown"],
  ["retryable_failed", "Retryable failed"],
  ["mismatched", "Mismatched"],
  ["late", "Late"],
  ["manual_review", "Manual review"]
] as const satisfies readonly (readonly [TransferLegState, string])[];

type OperationsState = (typeof filters)[number][0];

function isOperationsState(value: string | undefined): value is OperationsState {
  return filters.some(([state]) => state === value);
}

function formatNim(luna: number) {
  return new Intl.NumberFormat("en", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 5
  }).format(luna / 100_000);
}

export default async function TransferOperationsPage({
  searchParams
}: {
  searchParams: Promise<{ state?: string | string[] }>;
}) {
  await requireOpsSession("/ops/transfers");
  const requested = (await searchParams).state;
  const activeState = typeof requested === "string" && isOperationsState(requested)
    ? requested
    : undefined;
  const states = activeState
    ? [activeState]
    : filters.map(([state]) => state);
  const transfers = await podsRepository.listPayoutTransferOperations({
    states,
    limit: 100
  });

  return (
    <main className="app-shell ops-shell transfer-ops-shell">
      <header className="app-topbar">
        <Link className="wordmark" href="/ops/transfers">
          <span className="pod-mark" aria-hidden="true" />
          pods
        </Link>
        <nav aria-label="Operations">
          <Link href="/ops/public-safety">Public safety</Link>
          <Link aria-current="page" href="/ops/transfers">Transfers</Link>
        </nav>
      </header>
      <section className="today-hero entrance entrance-hero">
        <p className="eyebrow">Testnet payout operations</p>
        <h1>{transfers.length} {transfers.length === 1 ? "transfer needs" : "transfers need"} attention.</h1>
        <p className="screen-copy">
          A replacement is available only after a fresh chain check proves the
          latest immutable attempt failed or expired.
        </p>
      </section>
      <nav className="transfer-ops-filters" aria-label="Transfer state filters">
        <Link aria-current={!activeState ? "page" : undefined} href="/ops/transfers">
          All
        </Link>
        {filters.map(([state, label]) => (
          <Link
            aria-current={activeState === state ? "page" : undefined}
            href={`/ops/transfers?state=${state}`}
            key={state}
          >
            {label}
          </Link>
        ))}
      </nav>
      {transfers.length > 0 ? (
        <section className="transfer-ops-queue" aria-label="Payout transfer queue">
          {transfers.map((transfer) => (
            <article key={transfer.id}>
              <header>
                <span>{transfer.state.replaceAll("_", " ")}</span>
                <time dateTime={transfer.updatedAt.toISOString()}>
                  {formatZonedMoment(transfer.updatedAt, {
                    timeZone: "UTC",
                    includeZone: true
                  })}
                </time>
              </header>
              <h2>{transfer.podName}</h2>
              <p>{formatNim(transfer.amountLuna)} NIM on {transfer.network}</p>
              <dl>
                <div><dt>Pod</dt><dd>{transfer.podId}</dd></div>
                <div><dt>Leg</dt><dd>{transfer.id}</dd></div>
                <div><dt>Attempt</dt><dd>{transfer.attempt ? `#${transfer.attempt.sequence}` : "Not prepared"}</dd></div>
                <div><dt>Hash</dt><dd>{transfer.attempt?.transactionHash ?? "None"}</dd></div>
                <div><dt>Reason</dt><dd>{transfer.errorCode ?? "Manual review required"}</dd></div>
              </dl>
              {transfer.state === "retryable_failed" || transfer.state === "late" ? (
                <PayoutRetryControls legId={transfer.id} />
              ) : (
                <p className="transfer-ops-lock">
                  This state requires reconciliation, not a replacement transaction.
                </p>
              )}
            </article>
          ))}
        </section>
      ) : (
        <section className="neutral-empty">
          <span>Queue clear</span>
          <p>No payout transfers match this recovery filter.</p>
        </section>
      )}
    </main>
  );
}
