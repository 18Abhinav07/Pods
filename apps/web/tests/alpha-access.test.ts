import { KeyPair, PrivateKey } from "@nimiq/core";
import { describe, expect, it } from "vitest";

import {
  alphaDepositsEnabled,
  alphaFundingPolicy,
  publicVisitorRoomsEnabled,
  walletHasAlphaAccess
} from "../src/lib/alpha-access";

const wallet = KeyPair.derive(PrivateKey.fromHex("88".repeat(32)))
  .toAddress()
  .toUserFriendlyAddress();

describe("alpha access enforcement", () => {
  it("does not alter local development behavior", () => {
    expect(walletHasAlphaAccess({ APP_ENV: "local" }, wallet)).toBe(true);
    expect(alphaDepositsEnabled({ APP_ENV: "local" })).toBe(true);
  });

  it("denies every wallet when alpha access is closed", () => {
    expect(
      walletHasAlphaAccess(
        { APP_ENV: "alpha", NIMIQ_NETWORK: "testnet", PODS_ALPHA_ACCESS: "closed" },
        wallet
      )
    ).toBe(false);
  });

  it("normalizes and enforces the alpha wallet allowlist", () => {
    const compact = wallet.replaceAll(" ", "");
    const environment = {
      APP_ENV: "alpha",
      NIMIQ_NETWORK: "testnet",
      PODS_ALPHA_ACCESS: "allowlist",
      PODS_ALPHA_WALLET_ALLOWLIST: ` ${compact} `
    };

    expect(walletHasAlphaAccess(environment, wallet)).toBe(true);
    expect(walletHasAlphaAccess(environment, "NQ38 PLXF NXKJ LFGA TRDP VRA8 F810 2BKN N4X6")).toBe(false);
  });

  it("keeps deposits disabled when the alpha deposit mode is off", () => {
    expect(
      alphaDepositsEnabled({ APP_ENV: "alpha", NIMIQ_NETWORK: "testnet" })
    ).toBe(false);
  });

  it("keeps public visitor rooms fail closed unless explicitly enabled", () => {
    expect(publicVisitorRoomsEnabled({})).toBe(false);
    expect(publicVisitorRoomsEnabled({ PODS_PUBLIC_VISITOR_ROOMS_ENABLED: "false" }))
      .toBe(false);
    expect(publicVisitorRoomsEnabled({ PODS_PUBLIC_VISITOR_ROOMS_ENABLED: "true" }))
      .toBe(true);
  });

  it("projects the immutable refund-only contract without deposit caps", () => {
    expect(alphaFundingPolicy({
      APP_ENV: "alpha",
      NIMIQ_NETWORK: "testnet",
      PODS_DEPOSIT_MODE: "allowlist_refund_only",
      PODS_ALPHA_REFUND_ENABLED: "true"
    })).toEqual({
      settlementMode: "full_refund_alpha"
    });
  });
});
