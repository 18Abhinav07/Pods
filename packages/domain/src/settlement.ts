export type SettlementOutcomeState =
  | "approved"
  | "timeout_protected"
  | "rejected"
  | "missed";

export type SettlementOccurrenceState =
  | "closed"
  | "closed_no_bonus_recipient";

export interface SettlementMemberInput {
  membershipId: string;
  depositLuna: number;
}

export interface SettlementOutcomeInput {
  membershipId: string;
  state: SettlementOutcomeState;
}

export interface SettlementOccurrenceInput {
  occurrenceId: string;
  outcomes: readonly SettlementOutcomeInput[];
}

export interface SettlementInput {
  lunaPerOccurrence: number;
  members: readonly SettlementMemberInput[];
  occurrences: readonly SettlementOccurrenceInput[];
}

export interface CalculatedSettlementOutcome {
  membershipId: string;
  state: SettlementOutcomeState;
  principalLuna: number;
  provisionalForfeitureLuna: number;
  restorationLuna: number;
  bonusLuna: number;
  payoutLuna: number;
}

export interface CalculatedSettlementOccurrence {
  occurrenceId: string;
  state: SettlementOccurrenceState;
  forfeiturePoolLuna: number;
  bonusRecipientCount: number;
  outcomes: CalculatedSettlementOutcome[];
}

export interface CalculatedSettlementMember {
  membershipId: string;
  depositLuna: number;
  principalLuna: number;
  provisionalForfeitureLuna: number;
  restorationLuna: number;
  bonusLuna: number;
  payoutLuna: number;
}

export interface CalculatedSettlement {
  lunaPerOccurrence: number;
  totalDepositLuna: number;
  totalPayoutLuna: number;
  occurrences: CalculatedSettlementOccurrence[];
  members: CalculatedSettlementMember[];
}

const terminalStates = new Set<SettlementOutcomeState>([
  "approved",
  "timeout_protected",
  "rejected",
  "missed"
]);

function requirePositiveSafeInteger(value: number, message: string) {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(message);
}

function checkedAdd(left: number, right: number, message: string) {
  const total = left + right;
  if (!Number.isSafeInteger(total)) throw new Error(message);
  return total;
}

function checkedMultiply(left: number, right: number, message: string) {
  const total = left * right;
  if (!Number.isSafeInteger(total)) throw new Error(message);
  return total;
}

export function calculateSettlement(input: SettlementInput): CalculatedSettlement {
  requirePositiveSafeInteger(
    input.lunaPerOccurrence,
    "Settlement slice must be a positive safe integer Luna amount"
  );
  if (input.members.length === 0) {
    throw new Error("Settlement requires at least one funded member");
  }
  if (input.occurrences.length === 0) {
    throw new Error("Settlement requires at least one frozen occurrence");
  }

  const memberIds = new Set<string>();
  const occurrenceAllocation = checkedMultiply(
    input.lunaPerOccurrence,
    input.occurrences.length,
    "Frozen occurrence allocation is too large"
  );
  const memberTotals = new Map<string, CalculatedSettlementMember>();
  for (const member of input.members) {
    if (!member.membershipId || memberIds.has(member.membershipId)) {
      throw new Error("Settlement members must be unique");
    }
    memberIds.add(member.membershipId);
    requirePositiveSafeInteger(
      member.depositLuna,
      "Member deposit must be a positive safe integer Luna amount"
    );
    if (member.depositLuna !== occurrenceAllocation) {
      throw new Error("Member deposit does not match the frozen occurrence allocation");
    }
    memberTotals.set(member.membershipId, {
      membershipId: member.membershipId,
      depositLuna: member.depositLuna,
      principalLuna: 0,
      provisionalForfeitureLuna: 0,
      restorationLuna: 0,
      bonusLuna: 0,
      payoutLuna: 0
    });
  }

  const occurrenceIds = new Set<string>();
  const calculatedOccurrences: CalculatedSettlementOccurrence[] = [];
  for (const occurrence of input.occurrences) {
    if (!occurrence.occurrenceId || occurrenceIds.has(occurrence.occurrenceId)) {
      throw new Error("Settlement occurrences must be unique");
    }
    occurrenceIds.add(occurrence.occurrenceId);

    const outcomeByMember = new Map<string, SettlementOutcomeState>();
    for (const outcome of occurrence.outcomes) {
      if (
        !memberIds.has(outcome.membershipId) ||
        outcomeByMember.has(outcome.membershipId) ||
        !terminalStates.has(outcome.state)
      ) {
        throw new Error("Occurrence outcomes must include every member exactly once");
      }
      outcomeByMember.set(outcome.membershipId, outcome.state);
    }
    if (
      outcomeByMember.size !== memberIds.size ||
      [...memberIds].some((membershipId) => !outcomeByMember.has(membershipId))
    ) {
      throw new Error("Occurrence outcomes must include every member exactly once");
    }

    const approvedIds = [...outcomeByMember.entries()]
      .filter(([, state]) => state === "approved")
      .map(([membershipId]) => membershipId)
      .sort((left, right) => left.localeCompare(right));
    const forfeitingIds = [...outcomeByMember.entries()]
      .filter(([, state]) => state === "rejected" || state === "missed")
      .map(([membershipId]) => membershipId);
    const forfeiturePoolLuna = checkedMultiply(
      forfeitingIds.length,
      input.lunaPerOccurrence,
      "Occurrence forfeiture pool is too large"
    );
    const baseBonus =
      approvedIds.length > 0
        ? Math.floor(forfeiturePoolLuna / approvedIds.length)
        : 0;
    const remainder =
      approvedIds.length > 0 ? forfeiturePoolLuna % approvedIds.length : 0;
    const bonusByMember = new Map(
      approvedIds.map((membershipId, index) => [
        membershipId,
        baseBonus + (index < remainder ? 1 : 0)
      ])
    );

    const outcomes: CalculatedSettlementOutcome[] = [];
    for (const member of input.members) {
      const state = outcomeByMember.get(member.membershipId);
      if (!state) {
        throw new Error("Occurrence outcomes must include every member exactly once");
      }
      const principalLuna =
        state === "approved" || state === "timeout_protected"
          ? input.lunaPerOccurrence
          : 0;
      const provisionalForfeitureLuna =
        state === "rejected" || state === "missed"
          ? input.lunaPerOccurrence
          : 0;
      const restorationLuna =
        approvedIds.length === 0 ? provisionalForfeitureLuna : 0;
      const bonusLuna = bonusByMember.get(member.membershipId) ?? 0;
      const payoutLuna = checkedAdd(
        checkedAdd(principalLuna, restorationLuna, "Outcome payout is too large"),
        bonusLuna,
        "Outcome payout is too large"
      );
      const outcome: CalculatedSettlementOutcome = {
        membershipId: member.membershipId,
        state,
        principalLuna,
        provisionalForfeitureLuna,
        restorationLuna,
        bonusLuna,
        payoutLuna
      };
      outcomes.push(outcome);

      const total = memberTotals.get(member.membershipId);
      if (!total) throw new Error("Settlement member total is missing");
      total.principalLuna = checkedAdd(
        total.principalLuna,
        principalLuna,
        "Member principal is too large"
      );
      total.provisionalForfeitureLuna = checkedAdd(
        total.provisionalForfeitureLuna,
        provisionalForfeitureLuna,
        "Member forfeiture is too large"
      );
      total.restorationLuna = checkedAdd(
        total.restorationLuna,
        restorationLuna,
        "Member restoration is too large"
      );
      total.bonusLuna = checkedAdd(
        total.bonusLuna,
        bonusLuna,
        "Member bonus is too large"
      );
      total.payoutLuna = checkedAdd(
        total.payoutLuna,
        payoutLuna,
        "Member payout is too large"
      );
    }
    calculatedOccurrences.push({
      occurrenceId: occurrence.occurrenceId,
      state:
        approvedIds.length === 0 ? "closed_no_bonus_recipient" : "closed",
      forfeiturePoolLuna,
      bonusRecipientCount: approvedIds.length,
      outcomes
    });
  }

  const members = input.members.map((member) => {
    const total = memberTotals.get(member.membershipId);
    if (!total) throw new Error("Settlement member total is missing");
    return total;
  });
  const totalDepositLuna = members.reduce(
    (total, member) =>
      checkedAdd(total, member.depositLuna, "Settlement deposit total is too large"),
    0
  );
  const totalPayoutLuna = members.reduce(
    (total, member) =>
      checkedAdd(total, member.payoutLuna, "Settlement payout total is too large"),
    0
  );
  if (totalDepositLuna !== totalPayoutLuna) {
    throw new Error("Settlement does not conserve participant deposits");
  }

  return {
    lunaPerOccurrence: input.lunaPerOccurrence,
    totalDepositLuna,
    totalPayoutLuna,
    occurrences: calculatedOccurrences,
    members
  };
}
