import type { TransferLegState } from "@pods/domain";
import Link from "next/link";

import styles from "../../../components/ops-flow.module.css";
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

function recoveryDescription(state: OperationsState) {
  switch (state) {
    case "unknown":
      return "The latest chain outcome has not been proven.";
    case "retryable_failed":
      return "The immutable attempt failed and is eligible for a fresh chain check.";
    case "mismatched":
      return "The recorded attempt and observed chain result do not match.";
    case "late":
      return "The transaction validity window expired before confirmation.";
    case "manual_review":
      return "Automated recovery stopped for an operator decision.";
  }
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
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <Link
          className={`wordmark ${styles.wordmark}`}
          href="/ops/transfers"
        >
          <span className="pod-mark" aria-hidden="true" />
          pods
        </Link>
        <nav aria-label="Operations" className={styles.opsNav}>
          <Link href="/ops/public-safety">Public safety</Link>
          <Link aria-current="page" href="/ops/transfers">Transfers</Link>
        </nav>
      </header>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Testnet payout operations</p>
        <h1>{transfers.length} {transfers.length === 1 ? "transfer needs" : "transfers need"} attention.</h1>
        <p className={styles.heroCopy}>
          A replacement is available only after a fresh chain check proves the
          latest immutable attempt failed or expired.
        </p>
      </section>
      <nav className={styles.filterBar} aria-label="Transfer state filters">
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
        <section
          aria-label="Payout transfer queue"
          className={styles.queueLayout}
        >
          {transfers.map((transfer) => (
            <article className={styles.queueCard} key={transfer.id}>
              <header className={styles.cardHeader}>
                <span
                  className={styles.stateBadge}
                  data-state={transfer.state}
                >
                  {transfer.state.replaceAll("_", " ")}
                </span>
                <time
                  className={styles.cardTime}
                  dateTime={transfer.updatedAt.toISOString()}
                >
                  {formatZonedMoment(transfer.updatedAt, {
                    timeZone: "UTC",
                    includeZone: true
                  })}
                </time>
              </header>
              <div className={styles.cardLead}>
                <p className={styles.amount}>
                  {formatNim(transfer.amountLuna)}
                  <small>NIM</small>
                </p>
                <h2>{transfer.podName ?? "Payout transfer"}</h2>
                <p>{transfer.network} network</p>
              </div>
              <div className={styles.reasonBlock}>
                <span>Recovery reason</span>
                <strong>
                  {transfer.errorCode ?? (
                    isOperationsState(transfer.state)
                      ? recoveryDescription(transfer.state)
                      : "Manual review required"
                  )}
                </strong>
              </div>
              <dl className={styles.detailList}>
                <div><dt>Pod ID</dt><dd>{transfer.podId}</dd></div>
                <div><dt>Transfer leg</dt><dd>{transfer.id}</dd></div>
                <div>
                  <dt>Attempt</dt>
                  <dd>{transfer.attempt ? `#${transfer.attempt.sequence}` : "Not prepared"}</dd>
                </div>
                <div>
                  <dt>Transaction hash</dt>
                  <dd><code>{transfer.attempt?.transactionHash ?? "None"}</code></dd>
                </div>
              </dl>
              {transfer.state === "retryable_failed" || transfer.state === "late" ? (
                <PayoutRetryControls legId={transfer.id} />
              ) : (
                <p className={styles.recoveryNote}>
                  This state requires reconciliation, not a replacement transaction.
                </p>
              )}
            </article>
          ))}
        </section>
      ) : (
        <section className={styles.emptyCard}>
          <strong>Queue clear</strong>
          <p>No payout transfers match this recovery filter.</p>
        </section>
      )}
    </main>
  );
}
