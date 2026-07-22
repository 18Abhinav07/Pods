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
    return parseAlphaCapabilities(environment).depositMode !== "off";
  } catch {
    return false;
  }
}

function positiveCap(environment: Environment, name: string, fallback: number) {
  const value = Number(environment[name] ?? fallback);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive safe integer`);
  }
  return value;
}

export function alphaFundingPolicy(environment: Environment) {
  if (environment.NIMIQ_NETWORK !== "testnet") {
    throw new Error("The Phase 4 funding contract requires Nimiq Testnet");
  }
  if (environment.APP_ENV === "alpha") {
    const capabilities = parseAlphaCapabilities(environment);
    if (capabilities.depositMode !== "allowlist_refund_only") {
      throw new Error("Alpha deposits must use the refund-only mode");
    }
    return {
      settlementMode: "full_refund_alpha" as const,
      maximumDepositLuna: capabilities.maximumDepositLuna,
      maximumTreasuryExposureLuna: capabilities.maximumTreasuryExposureLuna
    };
  }
  return {
    settlementMode: "full_refund_alpha" as const,
    maximumDepositLuna: positiveCap(
      environment,
      "PODS_MAX_DEPOSIT_LUNA",
      1_000_000
    ),
    maximumTreasuryExposureLuna: positiveCap(
      environment,
      "PODS_MAX_TREASURY_EXPOSURE_LUNA",
      5_000_000
    )
  };
}

export function alphaRequiresAuthenticatedBrowsing(environment: Environment) {
  if (environment.APP_ENV !== "alpha") return false;
  try {
    return parseAlphaCapabilities(environment).access !== "public";
  } catch {
    return true;
  }
}
