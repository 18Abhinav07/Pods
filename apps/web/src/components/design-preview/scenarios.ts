import type {
  PreviewActorId,
  PreviewState,
  ScenarioId,
  ScreenId
} from "./model";

export type ScenarioDefinition = {
  id: ScenarioId;
  label: string;
  screen?: ScreenId;
  actor?: PreviewActorId;
  description: string;
};

export const SCENARIOS: readonly ScenarioDefinition[] = [
  {
    id: "happy-path",
    label: "Happy path",
    description: "The next authoritative state is available."
  },
  {
    id: "loading",
    label: "Loading",
    description: "Layout-matched content is still resolving."
  },
  {
    id: "empty",
    label: "Empty",
    description: "No relevant records are available yet."
  },
  {
    id: "error",
    label: "Recoverable error",
    description: "The action explains how to recover."
  },
  {
    id: "wallet-rejected",
    label: "Wallet rejected",
    screen: "wallet-confirmation",
    actor: "accepted-member",
    description: "The wallet did not approve the transaction."
  },
  {
    id: "wrong-network",
    label: "Wrong network",
    screen: "wallet-confirmation",
    actor: "accepted-member",
    description: "Nimiq Pay must be switched to Testnet."
  },
  {
    id: "reference-mismatch",
    label: "Reference mismatch",
    screen: "transaction-submitted",
    actor: "accepted-member",
    description: "The deposit needs reconciliation."
  },
  {
    id: "capacity-excluded",
    label: "Capacity excluded",
    screen: "funding-waiting",
    actor: "waiting-member",
    description: "The finalized deposit missed the locked roster."
  },
  {
    id: "below-minimum",
    label: "Below minimum",
    screen: "refund-reason",
    actor: "waiting-member",
    description: "The Pod did not reach its minimum roster."
  },
  {
    id: "zero-recipient-restoration",
    label: "Principal restored",
    screen: "settlement-calculated",
    actor: "participant",
    description: "No occurrence member qualified for a bonus."
  },
  {
    id: "no-transfer-required",
    label: "No transfer required",
    screen: "payout-paid",
    actor: "participant",
    description: "The entitlement is zero and no transfer is created."
  },
  {
    id: "transfer-delayed",
    label: "Transfer delayed",
    screen: "payout-confirming",
    actor: "participant",
    description: "The transfer remains safe while chain state is checked."
  },
  {
    id: "manual-review",
    label: "Manual review",
    screen: "transfer-manual-review",
    actor: "operations",
    description: "Operations must reconcile this transfer."
  }
];

export function stateForScenario(
  state: PreviewState,
  scenarioId: ScenarioId
): PreviewState {
  const scenario = SCENARIOS.find((candidate) => candidate.id === scenarioId);
  if (!scenario) return state;
  return {
    ...state,
    scenario: scenario.id,
    ...(scenario.actor ? { actor: scenario.actor } : {}),
    ...(scenario.screen ? { screen: scenario.screen } : {})
  };
}
