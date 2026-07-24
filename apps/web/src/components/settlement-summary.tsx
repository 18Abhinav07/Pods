import type {
  SettlementEntitlementState,
  SettlementOutcomeState,
  SettlementRunState,
  TransferLegState
} from "@pods/domain";

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
  settlement: SettlementHeader;
  occurrenceCount: number;
  entitlementCount: number;
};

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
  return "Operations review";
}

export function SettlementSummary(props: ParticipantProps | CreatorProps) {
  if (props.mode === "creator") {
    const conserved =
      props.settlement.totalDepositLuna === props.settlement.totalPayoutLuna;
    return (
      <section className="settlement-summary settlement-summary-creator">
        <div className="settlement-balance">
          <span>{conserved ? "Treasury conserved" : "Conservation review required"}</span>
          <strong>{nim(props.settlement.totalPayoutLuna)}</strong>
          <p>
            {nim(props.settlement.totalDepositLuna)} deposited,{" "}
            {nim(props.settlement.totalPayoutLuna)} allocated
          </p>
        </div>
        <div className="settlement-facts">
          <p>{props.entitlementCount} participant entitlements</p>
          <p>{props.occurrenceCount} frozen occurrences</p>
          <p>{props.settlement.state === "settled" ? "Transfers complete" : "Transfers in progress"}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="settlement-summary settlement-summary-participant">
      <div className="settlement-balance">
        <span>Your final entitlement</span>
        <strong>{nim(props.entitlement.payoutLuna)}</strong>
        <div className="settlement-balance-parts">
          <p>{nim(props.entitlement.principalLuna)} principal</p>
          <p>{nim(props.entitlement.bonusLuna)} bonus</p>
          {props.entitlement.restorationLuna > 0 ? (
            <p>{nim(props.entitlement.restorationLuna)} restored</p>
          ) : null}
        </div>
      </div>
      <ol className="settlement-outcomes" aria-label="Occurrence outcomes">
        {props.outcomes.map((outcome) => (
          <li key={outcome.ordinal}>
            <span>Occurrence {outcome.ordinal}</span>
            <strong>{outcomeLabel(outcome.state)}</strong>
            <small>{nim(outcome.payoutLuna)}</small>
          </li>
        ))}
      </ol>
      <div className="settlement-transfer">
        <span>Transfer</span>
        <strong>
          {props.transfer
            ? transferLabel(props.transfer.state)
            : "No transfer required"}
        </strong>
        {props.transfer?.transactionHash ? (
          <code>{props.transfer.transactionHash}</code>
        ) : null}
      </div>
    </section>
  );
}
