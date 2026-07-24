export type AlphaAccess = "closed" | "allowlist" | "public";
export type AlphaDepositMode = "off" | "allowlist_refund_only" | "public";
export type RealtimeTransport = "poll" | "sse";

export type AlphaCapabilities = {
  access: AlphaAccess;
  network: "testnet";
  profiles: boolean;
  podChat: boolean;
  socialGraph: boolean;
  directMessages: boolean;
  directMessageRequests: boolean;
  uploads: boolean;
  gifs: boolean;
  moderation: boolean;
  rateLimits: boolean;
  reviewExceptions: boolean;
  settlement: boolean;
  proportionalPublishing: boolean;
  payoutBroadcast: boolean;
  financialIncidentPaused: boolean;
  alphaRefund: boolean;
  depositMode: AlphaDepositMode;
  realtimeTransport: RealtimeTransport;
};

type Environment = Record<string, string | undefined>;

function oneOf<T extends string>(
  environment: Environment,
  name: string,
  allowed: readonly T[],
  fallback: T
): T {
  const value = environment[name] ?? fallback;
  if (!allowed.includes(value as T)) {
    throw new Error(`${name} must be one of ${allowed.join(", ")}`);
  }
  return value as T;
}

function enabled(environment: Environment, name: string) {
  const value = environment[name] ?? "false";
  if (value !== "true" && value !== "false") {
    throw new Error(`${name} must be true or false`);
  }
  return value === "true";
}

export function parseAlphaCapabilities(environment: Environment): AlphaCapabilities {
  const network = environment.NIMIQ_NETWORK;
  if (environment.APP_ENV === "alpha" && network !== "testnet") {
    throw new Error("Alpha deployments require NIMIQ_NETWORK=testnet");
  }
  if (network !== "testnet") {
    throw new Error("Pods currently requires NIMIQ_NETWORK=testnet");
  }

  const directMessages = enabled(environment, "PODS_DMS_ENABLED");
  const directMessageRequests = enabled(environment, "PODS_DM_REQUESTS_ENABLED");
  const moderation = enabled(environment, "PODS_MODERATION_ENABLED");
  const rateLimits = enabled(environment, "PODS_RATE_LIMITS_ENABLED");
  const settlement = enabled(environment, "PODS_SETTLEMENT_ENABLED");
  const alphaRefund = enabled(environment, "PODS_ALPHA_REFUND_ENABLED");
  const depositMode = oneOf(
    environment,
    "PODS_DEPOSIT_MODE",
    ["off", "allowlist_refund_only", "public"] as const,
    "off"
  );
  const proportionalPublishing = enabled(
    environment,
    "PODS_PROPORTIONAL_PUBLISHING_ENABLED"
  );
  const payoutBroadcast = enabled(
    environment,
    "PODS_PAYOUT_BROADCAST_ENABLED"
  );
  const financialIncidentPaused = enabled(
    environment,
    "PODS_FINANCIAL_INCIDENT_PAUSED"
  );
  if (proportionalPublishing && !settlement) {
    throw new Error("Proportional publication requires settlement processing");
  }
  if (proportionalPublishing && depositMode !== "public") {
    throw new Error("Proportional publication requires public deposit intake");
  }
  if (depositMode === "allowlist_refund_only" && !alphaRefund) {
    throw new Error("Allowlisted alpha deposits require the full refund path");
  }
  if (directMessageRequests && (!directMessages || !moderation || !rateLimits)) {
    throw new Error("Message requests require DMs, moderation, and rate limits");
  }

  return {
    access: oneOf(
      environment,
      "PODS_ALPHA_ACCESS",
      ["closed", "allowlist", "public"] as const,
      "closed"
    ),
    network: "testnet",
    profiles: enabled(environment, "PODS_PROFILES_ENABLED"),
    podChat: enabled(environment, "PODS_POD_CHAT_ENABLED"),
    socialGraph: enabled(environment, "PODS_SOCIAL_GRAPH_ENABLED"),
    directMessages,
    directMessageRequests,
    uploads: enabled(environment, "PODS_UPLOADS_ENABLED"),
    gifs: enabled(environment, "PODS_GIF_ENABLED"),
    moderation,
    rateLimits,
    reviewExceptions: enabled(environment, "PODS_REVIEW_EXCEPTIONS_ENABLED"),
    settlement,
    proportionalPublishing,
    payoutBroadcast,
    financialIncidentPaused,
    alphaRefund,
    depositMode,
    realtimeTransport: oneOf(
      environment,
      "REALTIME_TRANSPORT",
      ["poll", "sse"] as const,
      "poll"
    )
  };
}

export function publicAlphaCapabilities(capabilities: AlphaCapabilities) {
  return {
    access: capabilities.access,
    network: capabilities.network,
    profiles: capabilities.profiles,
    podChat: capabilities.podChat,
    socialGraph: capabilities.socialGraph,
    directMessages: capabilities.directMessages,
    directMessageRequests: capabilities.directMessageRequests,
    uploads: capabilities.uploads,
    gifs: capabilities.gifs,
    reviewExceptions: capabilities.reviewExceptions,
    settlement: capabilities.settlement,
    depositMode: capabilities.depositMode,
    realtimeTransport: capabilities.realtimeTransport
  } as const;
}
