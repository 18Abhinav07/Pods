import {
  ArrowRight,
  CaretDown,
  Check,
  Clock,
  Receipt,
  ShieldCheck,
  WarningCircle
} from "@phosphor-icons/react/dist/ssr";
import type {
  SettlementEntitlementState,
  SettlementOutcomeState,
  SettlementRunState,
  TransferLegState
} from "@pods/domain";
import Image from "next/image";
import Link from "next/link";

import styles from "./settlement-flow.module.css";

function nim(luna: number) {
  return `${new Intl.NumberFormat("en", {
    maximumFractionDigits: 5
  }).format(luna / 100_000)} NIM`;
}

type SettlementHeader = {
  state: SettlementRunState;
  totalDepositLuna: number;
  totalPayoutLuna: number;
};

type ParticipantProps = {
  mode: "participant";
  podId?: string;
  settlement: SettlementHeader;
  entitlement: {
    state: SettlementEntitlementState;
    depositLuna: number;
    principalLuna: number;
    provisionalForfeitureLuna: number;
    restorationLuna: number;
    bonusLuna: number;
    payoutLuna: number;
  };
  outcomes: {
    ordinal: number;
    state: SettlementOutcomeState;
    principalLuna: number;
    provisionalForfeitureLuna: number;
    restorationLuna: number;
    bonusLuna: number;
    payoutLuna: number;
  }[];
  transfer: {
    state: TransferLegState;
    amountLuna: number;
    transactionHash: string | null;
  } | null;
};

type CreatorProps = {
  mode: "creator";
  podId?: string;
  settlement: SettlementHeader;
  occurrenceCount: number;
  entitlementCount: number;
  entitlements: {
    displayName: string;
    handle: string;
    state: SettlementEntitlementState;
    principalLuna: number;
    restorationLuna: number;
    bonusLuna: number;
    payoutLuna: number;
    transferState: TransferLegState | null;
  }[];
};

type ParticipantPresentation = {
  eyebrow: string;
  title: string;
  detail: string;
  stateLabel: string;
  reason: string;
  nextAction: string;
  completedThrough: number;
  activeIndex: number | null;
  tone: "neutral" | "success" | "attention";
  terminal: boolean;
};

const payoutStages = [
  "Final",
  "Calculated",
  "Prepared",
  "Submitted",
  "Confirming",
  "Paid"
] as const;

const attentionStates = new Set<TransferLegState>([
  "unknown",
  "retryable_failed",
  "mismatched",
  "late",
  "manual_review"
]);

function outcomeLabel(state: SettlementOutcomeState) {
  if (state === "timeout_protected") return "Timeout protected";
  return `${state.slice(0, 1).toUpperCase()}${state.slice(1)}`;
}

function transferLabel(state: TransferLegState) {
  if (state === "queued") return "Queued";
  if (state === "prepared") return "Prepared safely";
  if (state === "broadcast") return "Confirming on chain";
  if (state === "unknown") return "Checking chain";
  if (state === "confirmed") return "Confirmed";
  if (state === "retryable_failed") return "Retry required";
  if (state === "mismatched") return "Transfer mismatch";
  if (state === "late") return "Late confirmation";
  return "Manual review";
}

function entitlementLabel(state: SettlementEntitlementState) {
  if (state === "transfer_queued") return "Transfer queued";
  if (state === "transfer_confirmed") return "Transfer confirmed";
  if (state === "no_transfer_required") return "No transfer required";
  return "Manual review";
}

function participantPresentation(
  entitlement: ParticipantProps["entitlement"],
  transfer: ParticipantProps["transfer"]
): ParticipantPresentation {
  if (entitlement.state === "no_transfer_required") {
    return {
      eyebrow: "Settlement closed",
      title: "No payout transfer required",
      detail:
        "Your final entitlement is zero, so the ledger closed without creating an empty transaction.",
      stateLabel: "No transfer required",
      reason: "Final entitlement is 0 NIM",
      nextAction: "Review your occurrence outcomes",
      completedThrough: 2,
      activeIndex: null,
      tone: "neutral",
      terminal: true
    };
  }

  if (!transfer) {
    if (entitlement.state === "manual_review") {
      return {
        eyebrow: "Delivery paused",
        title: "Payout under manual review",
        detail:
          "Your entitlement is final. Operations is reviewing delivery before any transfer is attempted.",
      stateLabel: "Manual review",
      reason: "Transfer delivery requires an operator decision",
      nextAction: "No action is required",
        completedThrough: 1,
        activeIndex: 2,
        tone: "attention",
        terminal: false
      };
    }
    return {
      eyebrow: "Entitlement final",
      title: "Payout queued",
      detail:
        "Your final amount is conserved in the ledger and waiting for the payout worker.",
      stateLabel: "Transfer queued",
      reason: "Settlement calculation is complete",
      nextAction: "Wait for transfer preparation",
      completedThrough: 1,
      activeIndex: 2,
      tone: "neutral",
      terminal: false
    };
  }

  const presentations: Record<TransferLegState, ParticipantPresentation> = {
    queued: {
      eyebrow: "Entitlement final",
      title: "Payout queued",
      detail:
        "Your final amount is conserved in the ledger and waiting for the payout worker.",
      stateLabel: "Queued",
      reason: "Settlement calculation is complete",
      nextAction: "Wait for transfer preparation",
      completedThrough: 1,
      activeIndex: 2,
      tone: "neutral",
      terminal: false
    },
    prepared: {
      eyebrow: "Transfer secured",
      title: "Payout prepared",
      detail:
        "One idempotent transfer is safely persisted and ready for Testnet broadcast.",
      stateLabel: "Prepared safely",
      reason: "The worker has frozen the exact transfer amount",
      nextAction: "Wait for Testnet submission",
      completedThrough: 2,
      activeIndex: 3,
      tone: "neutral",
      terminal: false
    },
    broadcast: {
      eyebrow: "On Nimiq Testnet",
      title: "Payout submitted",
      detail:
        "The transfer is on chain. Pods is waiting for final confirmation before calling it paid.",
      stateLabel: "Confirming on chain",
      reason: "Transaction broadcast succeeded",
      nextAction: "No action is required",
      completedThrough: 3,
      activeIndex: 4,
      tone: "neutral",
      terminal: false
    },
    confirmed: {
      eyebrow: "Settlement complete",
      title: "Payout paid",
      detail:
        "The Testnet transfer is confirmed and your Pod financial record is complete.",
      stateLabel: "Confirmed",
      reason: "Chain confirmation is final",
      nextAction: "View the final Pod archive",
      completedThrough: 5,
      activeIndex: null,
      tone: "success",
      terminal: true
    },
    unknown: {
      eyebrow: "Retry safety active",
      title: "Payout confirmation delayed",
      detail:
        "Pods is checking the existing chain state before allowing another broadcast.",
      stateLabel: "Checking chain",
      reason: "The latest broadcast result is ambiguous",
      nextAction: "No action is required",
      completedThrough: 3,
      activeIndex: 4,
      tone: "attention",
      terminal: false
    },
    retryable_failed: {
      eyebrow: "Delivery paused",
      title: "Payout retry paused",
      detail:
        "The failed attempt is safely stopped until operations confirms a retry is appropriate.",
      stateLabel: "Retry required",
      reason: "The previous transfer attempt failed",
      nextAction: "Operations will retry safely",
      completedThrough: 2,
      activeIndex: 3,
      tone: "attention",
      terminal: false
    },
    mismatched: {
      eyebrow: "Delivery review",
      title: "Payout details need review",
      detail:
        "The observed transaction does not match the prepared payout. Automatic delivery is paused.",
      stateLabel: "Transfer mismatch",
      reason: "Prepared and observed transfer details differ",
      nextAction: "Operations will reconcile the record",
      completedThrough: 3,
      activeIndex: 4,
      tone: "attention",
      terminal: false
    },
    late: {
      eyebrow: "Delivery review",
      title: "Late payout under review",
      detail:
        "A confirmation arrived outside the expected window and needs a timing review.",
      stateLabel: "Late confirmation",
      reason: "Confirmation arrived after the delivery window",
      nextAction: "Operations will reconcile the timing",
      completedThrough: 3,
      activeIndex: 4,
      tone: "attention",
      terminal: false
    },
    manual_review: {
      eyebrow: "Delivery paused",
      title: "Payout under manual review",
      detail:
        "Your entitlement remains final while operations resolves the transfer safely.",
      stateLabel: "Manual review",
      reason: "Automatic delivery needs an operator decision",
      nextAction: "No action is required",
      completedThrough: 3,
      activeIndex: 4,
      tone: "attention",
      terminal: false
    }
  };
  return presentations[transfer.state];
}

function PayoutRail({
  presentation,
  noTransfer = false
}: {
  presentation: ParticipantPresentation;
  noTransfer?: boolean;
}) {
  const visibleStages = noTransfer
    ? (["Final", "Calculated", "Closed"] as const)
    : payoutStages;
  return (
    <ol
      aria-label="Payout progress"
      className={styles.payoutRail}
      data-condensed={noTransfer ? "" : undefined}
    >
      {visibleStages.map((stage, index) => {
        const relation =
          index <= presentation.completedThrough
            ? "complete"
            : index === presentation.activeIndex
              ? "current"
              : "upcoming";
        return (
          <li
            aria-current={relation === "current" ? "step" : undefined}
            data-state={relation}
            key={stage}
          >
            <i aria-hidden="true">
              {relation === "complete" ? (
                <Check weight="bold" />
              ) : relation === "current" ? (
                presentation.tone === "attention" ? (
                  <WarningCircle weight="fill" />
                ) : (
                  <Clock weight="bold" />
                )
              ) : (
                index + 1
              )}
            </i>
            <span>{stage}</span>
          </li>
        );
      })}
    </ol>
  );
}

function TerminalActions({
  podId,
  roomLabel = "Open read-only Pod archive"
}: {
  podId?: string;
  roomLabel?: string;
}) {
  return (
    <nav aria-label="Settlement actions" className={styles.terminalActions}>
      <Link className={styles.primaryAction} href="/my-pods">
        Return to My Pods
        <ArrowRight aria-hidden="true" weight="bold" />
      </Link>
      {podId ? (
        <Link
          className={styles.secondaryAction}
          href={`/pods/${podId}/room`}
        >
          {roomLabel}
        </Link>
      ) : null}
    </nav>
  );
}

function CreatorSettlement(props: CreatorProps) {
  const conserved =
    props.settlement.totalDepositLuna === props.settlement.totalPayoutLuna;
  const hasAttention =
    props.settlement.state === "manual_review" ||
    props.entitlements.some(
      (entitlement) =>
        entitlement.transferState !== null &&
        attentionStates.has(entitlement.transferState)
    );
  const complete =
    props.settlement.state === "settled" &&
    props.entitlements.every(
      (entitlement) =>
        entitlement.state === "no_transfer_required" ||
        entitlement.transferState === "confirmed"
    );
  const hasRestoration = props.entitlements.some(
    (entitlement) => entitlement.restorationLuna > 0
  );
  const title = hasAttention
    ? "Payout delivery needs operations"
    : complete
      ? "Settlement complete"
      : "Payouts are processing";
  const creatorReason = hasAttention
    ? "At least one payout leg is outside automatic delivery"
    : complete
      ? "Every participant entitlement is terminal"
      : "The worker is delivering frozen participant entitlements";
  const creatorNext = hasAttention
    ? "Operations will reconcile the affected transfer"
    : complete
      ? "Open the permanent read-only Pod archive"
      : "Wait for every payout leg to reach a terminal state";

  return (
    <section className={styles.summary} data-mode="creator">
      <div
        className={`${styles.creatorHero} ${hasAttention ? styles.attentionHero : ""} ${complete ? styles.successHero : ""}`}
      >
        <div className={styles.heroTop}>
          <div className={styles.nimMedallion}>
            <Image
              alt=""
              aria-hidden="true"
              height={72}
              src="/media/nimiq-signet.svg"
              width={72}
            />
          </div>
          <span>{conserved ? "Treasury conserved" : "Conservation review"}</span>
        </div>
        <p className={styles.eyebrow}>Creator settlement</p>
        <h2>{title}</h2>
        <strong>{nim(props.settlement.totalPayoutLuna)}</strong>
        <p>
          {nim(props.settlement.totalDepositLuna)} deposited and{" "}
          {nim(props.settlement.totalPayoutLuna)} allocated.
        </p>
      </div>

      <div className={styles.creatorFacts}>
        <article>
          <strong>{props.entitlementCount}</strong>
          <span>Participant entitlements</span>
        </article>
        <article>
          <strong>{props.occurrenceCount}</strong>
          <span>Frozen outcomes</span>
        </article>
        <article>
          <strong>{conserved ? "Exact" : "Review"}</strong>
          <span>Conservation</span>
        </article>
      </div>

      <section className={styles.stateCard}>
        <div>
          <small>Reason</small>
          <strong>{creatorReason}</strong>
        </div>
        <div>
          <small>Next</small>
          <strong>{creatorNext}</strong>
        </div>
      </section>

      {hasRestoration ? (
        <aside className={styles.restorationNotice}>
          <ShieldCheck aria-hidden="true" weight="regular" />
          <span>
            <strong>Unused forfeiture restored</strong>
            No manually approved recipient existed for at least one occurrence,
            so its forfeiture returned to the original owner.
          </span>
        </aside>
      ) : null}

      <section className={styles.entitlementSection}>
        <header>
          <p className={styles.eyebrow}>Participant delivery</p>
          <h3>Every final amount</h3>
        </header>
        <ol
          aria-label="Participant entitlements"
          className={styles.entitlementList}
        >
          {props.entitlements.map((entitlement) => {
            const deliveryState = entitlement.transferState
              ? entitlement.transferState === "queued"
                ? entitlementLabel(entitlement.state)
                : transferLabel(entitlement.transferState)
              : entitlementLabel(entitlement.state);
            return (
              <li key={entitlement.handle}>
                <div className={styles.person}>
                  <span aria-hidden="true">
                    {entitlement.displayName.slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <strong>{entitlement.displayName}</strong>
                    <small>@{entitlement.handle}</small>
                  </div>
                </div>
                <div className={styles.entitlementAmount}>
                  <strong>{nim(entitlement.payoutLuna)}</strong>
                  <small>{deliveryState}</small>
                </div>
                <p>
                  {nim(entitlement.principalLuna)} principal
                  {entitlement.bonusLuna > 0
                    ? ` + ${nim(entitlement.bonusLuna)} bonus`
                    : ""}
                  {entitlement.restorationLuna > 0
                    ? ` + ${nim(entitlement.restorationLuna)} restored`
                    : ""}
                </p>
              </li>
            );
          })}
        </ol>
      </section>

      <details className={styles.explanation}>
        <summary>
          <span>
            <Receipt aria-hidden="true" />
            <strong>How settlement works</strong>
          </span>
          <CaretDown aria-hidden="true" />
        </summary>
        <div>
          <p>
            Manually approved work receives protected principal and an equal
            share of eligible forfeiture for that occurrence.
          </p>
          <p>
            Timeout-protected and grace outcomes return principal but never
            receive a bonus.
          </p>
          <p>
            If nobody qualifies for a bonus, the unused forfeiture returns to
            its original owner.
          </p>
        </div>
      </details>

      {complete ? (
        <TerminalActions
          {...(props.podId ? { podId: props.podId } : {})}
        />
      ) : null}
    </section>
  );
}

function ParticipantSettlement(props: ParticipantProps) {
  const presentation = participantPresentation(
    props.entitlement,
    props.transfer
  );
  const restored = props.entitlement.restorationLuna > 0;

  return (
    <section className={styles.summary} data-mode="participant">
      <div
        className={`${styles.participantHero} ${presentation.tone === "attention" ? styles.attentionHero : ""} ${presentation.tone === "success" ? styles.successHero : ""}`}
        role={presentation.tone === "attention" ? "alert" : "status"}
      >
        <div className={styles.heroTop}>
          <div className={styles.nimMedallion}>
            <Image
              alt=""
              aria-hidden="true"
              height={72}
              src="/media/nimiq-signet.svg"
              width={72}
            />
          </div>
          <span>{presentation.stateLabel}</span>
        </div>
        <p className={styles.eyebrow}>{presentation.eyebrow}</p>
        <h2>{presentation.title}</h2>
        <strong>{nim(props.entitlement.payoutLuna)}</strong>
        <p>{presentation.detail}</p>
      </div>

      <PayoutRail
        noTransfer={props.entitlement.state === "no_transfer_required"}
        presentation={presentation}
      />

      <section className={styles.stateCard}>
        <div>
          <small>Reason</small>
          <strong>{presentation.reason}</strong>
        </div>
        <div>
          <small>Next</small>
          <strong>{presentation.nextAction}</strong>
        </div>
      </section>

      {restored ? (
        <aside className={styles.restorationNotice}>
          <ShieldCheck aria-hidden="true" weight="regular" />
          <span>
            <strong>Unused forfeiture restored</strong>
            No manually approved bonus recipient existed for at least one
            occurrence, so your provisional forfeiture returned to you.
          </span>
        </aside>
      ) : null}

      <section className={styles.breakdown}>
        <header>
          <p className={styles.eyebrow}>Final calculation</p>
          <h3>Your payout breakdown</h3>
        </header>
        <dl>
          <div>
            <dt>Principal</dt>
            <dd>{nim(props.entitlement.principalLuna)} principal</dd>
          </div>
          <div>
            <dt>Earned bonus</dt>
            <dd>{nim(props.entitlement.bonusLuna)} bonus</dd>
          </div>
          {restored ? (
            <div>
              <dt>Restored</dt>
              <dd>{nim(props.entitlement.restorationLuna)} restored</dd>
            </div>
          ) : null}
          <div data-total="">
            <dt>Final payout</dt>
            <dd>{nim(props.entitlement.payoutLuna)}</dd>
          </div>
        </dl>
      </section>

      {props.outcomes.length > 0 ? (
        <section className={styles.outcomeSection}>
          <header>
            <p className={styles.eyebrow}>Frozen record</p>
            <h3>Occurrence outcomes</h3>
          </header>
          <ol aria-label="Occurrence outcomes" className={styles.outcomeList}>
            {props.outcomes.map((outcome) => (
              <li key={outcome.ordinal}>
                <span>
                  <small>Occurrence {outcome.ordinal}</small>
                  <strong>{outcomeLabel(outcome.state)}</strong>
                </span>
                <b>{nim(outcome.payoutLuna)}</b>
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <ol
          aria-label="Occurrence outcomes"
          className={styles.visuallyHidden}
        />
      )}

      <details
        className={styles.receipt}
        open={
          presentation.terminal ||
          presentation.tone === "attention" ||
          Boolean(props.transfer?.transactionHash)
        }
      >
        <summary>
          <span>
            <Receipt aria-hidden="true" />
            <span>
              <small>Payout receipt</small>
              <strong>Transfer details</strong>
            </span>
          </span>
          <CaretDown aria-hidden="true" />
        </summary>
        <dl>
          <div>
            <dt>Amount</dt>
            <dd>{nim(props.entitlement.payoutLuna)}</dd>
          </div>
          {props.transfer?.transactionHash ? (
            <div data-wide="">
              <dt>Transaction hash</dt>
              <dd>
                <code>{props.transfer.transactionHash}</code>
              </dd>
            </div>
          ) : null}
        </dl>
      </details>

      <details className={styles.explanation}>
        <summary>
          <span>
            <ShieldCheck aria-hidden="true" />
            <strong>How settlement works</strong>
          </span>
          <CaretDown aria-hidden="true" />
        </summary>
        <div>
          <p>
            Approved work returns its principal and can earn an equal share of
            that occurrence&apos;s eligible forfeiture.
          </p>
          <p>
            Timeout-protected and grace outcomes return principal without
            entering the bonus pool.
          </p>
          <p>
            Rejected and missed outcomes forfeit their slice unless no approved
            bonus recipient exists.
          </p>
        </div>
      </details>

      {presentation.terminal ? (
        <TerminalActions
          {...(props.podId ? { podId: props.podId } : {})}
        />
      ) : null}
    </section>
  );
}

export function SettlementSummary(props: ParticipantProps | CreatorProps) {
  return props.mode === "creator" ? (
    <CreatorSettlement {...props} />
  ) : (
    <ParticipantSettlement {...props} />
  );
}
