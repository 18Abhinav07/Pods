import { createHmac, timingSafeEqual } from "node:crypto";

const sessionDurationMs = 12 * 60 * 60 * 1000;

function equalSecrets(left: string, right: string) {
  const leftDigest = createHmac("sha256", "pods-ops-constant-time")
    .update(left)
    .digest();
  const rightDigest = createHmac("sha256", "pods-ops-constant-time")
    .update(right)
    .digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function verifyOpsAccessToken(candidate: string, configured: string) {
  return candidate.length > 0 && configured.length > 0 && equalSecrets(candidate, configured);
}

export function createOpsSessionValue(input: { secret: string; now: Date }) {
  const expiresAt = new Date(input.now.getTime() + sessionDurationMs);
  const payload = `v1.${expiresAt.getTime()}`;
  return {
    value: `${payload}.${signature(payload, input.secret)}`,
    expiresAt
  };
}

export function verifyOpsSessionValue(input: {
  value: string;
  secret: string;
  now: Date;
}): { valid: true; expiresAt: Date } | { valid: false } {
  const [version, expiresText, suppliedSignature, ...rest] = input.value.split(".");
  if (version !== "v1" || rest.length > 0 || !expiresText || !suppliedSignature) {
    return { valid: false };
  }
  const expiresAt = new Date(Number(expiresText));
  if (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= input.now.getTime()) {
    return { valid: false };
  }
  const payload = `${version}.${expiresText}`;
  if (!equalSecrets(suppliedSignature, signature(payload, input.secret))) {
    return { valid: false };
  }
  return { valid: true, expiresAt };
}
