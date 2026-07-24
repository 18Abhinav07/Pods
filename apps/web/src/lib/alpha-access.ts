import { Address } from "@nimiq/core";
import { parseAlphaCapabilities } from "@pods/domain";

type Environment = Record<string, string | undefined>;

function normalizeAddress(value: string) {
  try {
    return Address.fromString(value.trim()).toUserFriendlyAddress();
  } catch {
    return null;
  }
}

export function walletHasAlphaAccess(
  environment: Environment,
  walletAddress: string
) {
  if (environment.APP_ENV !== "alpha") return true;
  try {
    const capabilities = parseAlphaCapabilities(environment);
    if (capabilities.access === "public") return true;
    if (capabilities.access === "closed") return false;
    const wallet = normalizeAddress(walletAddress);
    if (!wallet) return false;
    const allowed = new Set(
      (environment.PODS_ALPHA_WALLET_ALLOWLIST ?? "")
        .split(/[\n,]/)
        .map(normalizeAddress)
        .filter((address): address is string => address !== null)
    );
    return allowed.has(wallet);
  } catch {
    return false;
  }
}

export function alphaDepositsEnabled(environment: Environment) {
  if (environment.APP_ENV !== "alpha") return true;
  try {
    const capabilities = parseAlphaCapabilities(environment);
    return (
      capabilities.depositMode !== "off" &&
      (capabilities.depositMode !== "public" || capabilities.settlement) &&
      !capabilities.financialIncidentPaused
    );
  } catch {
    return false;
  }
}

export function alphaFundingPolicy(environment: Environment) {
  if (environment.NIMIQ_NETWORK !== "testnet") {
    throw new Error("The Phase 4 funding contract requires Nimiq Testnet");
  }
  const capabilities = parseAlphaCapabilities(environment);
  if (capabilities.financialIncidentPaused) {
    throw new Error("Financial activity is paused");
  }
  if (capabilities.depositMode === "public") {
    if (!capabilities.proportionalPublishing) {
      throw new Error("Proportional Pod publication is paused");
    }
    return {
      settlementMode: "proportional" as const
    };
  }
  return {
    settlementMode: "full_refund_alpha" as const
  };
}

export function alphaSettlementProcessingEnabled(environment: Environment) {
  try {
    const capabilities = parseAlphaCapabilities(environment);
    return capabilities.settlement && !capabilities.financialIncidentPaused;
  } catch {
    return false;
  }
}

export function alphaPayoutBroadcastEnabled(environment: Environment) {
  try {
    const capabilities = parseAlphaCapabilities(environment);
    return (
      capabilities.payoutBroadcast &&
      !capabilities.financialIncidentPaused
    );
  } catch {
    return false;
  }
}

export function alphaFinancialMutationsEnabled(environment: Environment) {
  try {
    return !parseAlphaCapabilities(environment).financialIncidentPaused;
  } catch {
    return false;
  }
}

export function alphaRequiresAuthenticatedBrowsing(environment: Environment) {
  if (environment.APP_ENV !== "alpha") return false;
  try {
    return parseAlphaCapabilities(environment).access !== "public";
  } catch {
    return true;
  }
}

export function publicVisitorRoomsEnabled(environment: Environment) {
  return environment.PODS_PUBLIC_VISITOR_ROOMS_ENABLED === "true";
}
