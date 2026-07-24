export type PublicRuntimeIdentity = {
  deploymentFlavor: "local" | "testnet";
  fundsNetwork: "nimiq-testnet";
  commitSha: string;
  schemaVersion: string;
};

type Environment = Record<string, string | undefined>;

const releaseShaPattern = /^[0-9a-f]{40}$/i;
const schemaVersionPattern = /^\d{4}_[a-z0-9_]+$/;

export function parsePublicRuntimeIdentity(
  environment: Environment,
  schemaVersion: string
): PublicRuntimeIdentity {
  if (environment.NIMIQ_NETWORK !== "testnet") {
    throw new Error("Runtime identity requires NIMIQ_NETWORK=testnet");
  }
  if (!schemaVersionPattern.test(schemaVersion)) {
    throw new Error("Schema version is invalid");
  }

  if (environment.APP_ENV === "local") {
    return {
      deploymentFlavor: "local",
      fundsNetwork: "nimiq-testnet",
      commitSha: "local",
      schemaVersion
    };
  }
  if (environment.APP_ENV !== "alpha") {
    throw new Error("APP_ENV must be local or alpha");
  }

  const releaseSha = environment.PODS_RELEASE_SHA ?? "";
  if (!releaseShaPattern.test(releaseSha)) {
    throw new Error("Alpha deployments require PODS_RELEASE_SHA as a 40-character Git SHA");
  }

  return {
    deploymentFlavor: "testnet",
    fundsNetwork: "nimiq-testnet",
    commitSha: releaseSha.toLowerCase().slice(0, 12),
    schemaVersion
  };
}
