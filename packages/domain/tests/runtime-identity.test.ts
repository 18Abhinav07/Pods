import { describe, expect, it } from "vitest";

import { parsePublicRuntimeIdentity } from "../src/runtime-identity";

const schemaVersion = "0017_robust_loners";
const releaseSha = "ABCDEF0123456789ABCDEF0123456789ABCDEF01";

describe("public runtime identity", () => {
  it("exposes a bounded Testnet deployment identity", () => {
    expect(
      parsePublicRuntimeIdentity(
        {
          APP_ENV: "alpha",
          NIMIQ_NETWORK: "testnet",
          PODS_RELEASE_SHA: releaseSha
        },
        schemaVersion
      )
    ).toEqual({
      deploymentFlavor: "testnet",
      fundsNetwork: "nimiq-testnet",
      commitSha: "abcdef012345",
      schemaVersion
    });
  });

  it("uses an explicit local identity without requiring a release SHA", () => {
    expect(
      parsePublicRuntimeIdentity(
        {
          APP_ENV: "local",
          NIMIQ_NETWORK: "testnet"
        },
        schemaVersion
      )
    ).toEqual({
      deploymentFlavor: "local",
      fundsNetwork: "nimiq-testnet",
      commitSha: "local",
      schemaVersion
    });
  });

  it("rejects untrusted release metadata without reflecting it", () => {
    const secretShapedValue = "postgresql://pods:secret@internal/pods";

    expect(() =>
      parsePublicRuntimeIdentity(
        {
          APP_ENV: "alpha",
          NIMIQ_NETWORK: "testnet",
          PODS_RELEASE_SHA: secretShapedValue
        },
        schemaVersion
      )
    ).toThrow("Alpha deployments require PODS_RELEASE_SHA");

    try {
      parsePublicRuntimeIdentity(
        {
          APP_ENV: "alpha",
          NIMIQ_NETWORK: "testnet",
          PODS_RELEASE_SHA: secretShapedValue
        },
        schemaVersion
      );
    } catch (error) {
      expect(String(error)).not.toContain(secretShapedValue);
      expect(String(error)).not.toContain("secret");
    }
  });

  it("rejects unsupported environments and funds networks", () => {
    expect(() =>
      parsePublicRuntimeIdentity(
        {
          APP_ENV: "production",
          NIMIQ_NETWORK: "testnet",
          PODS_RELEASE_SHA: releaseSha
        },
        schemaVersion
      )
    ).toThrow("APP_ENV must be local or alpha");

    expect(() =>
      parsePublicRuntimeIdentity(
        {
          APP_ENV: "alpha",
          NIMIQ_NETWORK: "mainnet",
          PODS_RELEASE_SHA: releaseSha
        },
        schemaVersion
      )
    ).toThrow("Runtime identity requires NIMIQ_NETWORK=testnet");
  });

  it("rejects an untrusted schema label instead of reflecting it", () => {
    expect(() =>
      parsePublicRuntimeIdentity(
        {
          APP_ENV: "local",
          NIMIQ_NETWORK: "testnet"
        },
        "schema=postgresql://secret"
      )
    ).toThrow("Schema version is invalid");
  });
});
