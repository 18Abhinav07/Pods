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

export function alphaRequiresAuthenticatedBrowsing(environment: Environment) {
  if (environment.APP_ENV !== "alpha") return false;
  try {
    return parseAlphaCapabilities(environment).access !== "public";
  } catch {
    return true;
  }
}
