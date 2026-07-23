import { createHmac } from "node:crypto";

import { podsRepository } from "./server-db";

type LimitPolicy = {
  action: string;
  limit: number;
  windowMs: number;
};

function rateLimitsEnabled() {
  return process.env.PODS_RATE_LIMITS_ENABLED === "true";
}

function opaqueBucket(value: string) {
  const secret = process.env.PODS_RATE_LIMIT_HMAC_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("PODS_RATE_LIMIT_HMAC_SECRET is required when public limits are enabled");
  }
  return createHmac("sha256", secret).update(value).digest("hex");
}

function requestNetwork(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    forwarded ||
    "unknown-network"
  ).slice(0, 128);
}

async function consume(scope: string, policy: LimitPolicy) {
  if (!rateLimitsEnabled()) {
    return {
      allowed: true,
      remaining: policy.limit,
      resetAt: new Date(0)
    };
  }
  return podsRepository.consumePublicRateLimit({
    bucketKey: opaqueBucket(scope),
    action: policy.action,
    now: new Date(),
    windowMs: policy.windowMs,
    limit: policy.limit
  });
}

export function consumeNetworkPublicLimit(
  request: Request,
  policy: LimitPolicy & { discriminator: string }
) {
  return consume(
    `network:${requestNetwork(request)}:${policy.discriminator}`,
    policy
  );
}

export function consumeAccountPublicLimit(
  userId: string,
  policy: LimitPolicy
) {
  return consume(`account:${userId}`, policy);
}
