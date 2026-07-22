import { createHash, randomBytes } from "node:crypto";

import { Address, PublicKey, Signature } from "@nimiq/core";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const NIMIQ_SIGNED_MESSAGE_PREFIX = "\x16Nimiq Signed Message:\n";
const allowedReturnPrefixes = [
  "/today",
  "/discover",
  "/my-pods",
  "/applications",
  "/profile",
  "/onboarding/",
  "/updates",
  "/messages",
  "/messages/",
  "/report/",
  "/inbox",
  "/u/",
  "/pods/",
  "/invite/",
  "/validation/"
] as const;

export function normalizeWalletAddress(address: string): string {
  return Address.fromString(address).toUserFriendlyAddress();
}

export function safeReturnTarget(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/today";
  }
  if (/^\/invite#[A-Za-z0-9_-]{43}$/.test(value)) return value;
  return allowedReturnPrefixes.some(
    (prefix) => value === prefix || (prefix.endsWith("/") && value.startsWith(prefix))
  )
    ? value
    : "/today";
}

export function createChallengeMessage(input: {
  walletAddress: string;
  nonce: string;
  issuedAt: Date;
  expiresAt: Date;
}): string {
  return [
    "Pods wallet sign-in",
    `Wallet: ${normalizeWalletAddress(input.walletAddress)}`,
    `Challenge: ${input.nonce}`,
    `Issued: ${input.issuedAt.toISOString()}`,
    `Expires: ${input.expiresAt.toISOString()}`,
    "Signing proves wallet ownership. It does not send a transaction."
  ].join("\n");
}

function nimiqSignedMessageDigest(message: string): Uint8Array {
  const messageBytes = new TextEncoder().encode(message);
  const payload = Buffer.concat([
    Buffer.from(NIMIQ_SIGNED_MESSAGE_PREFIX, "utf8"),
    Buffer.from(String(messageBytes.byteLength), "utf8"),
    Buffer.from(messageBytes)
  ]);
  return createHash("sha256").update(payload).digest();
}

export function verifyWalletSignature(input: {
  walletAddress: string;
  message: string;
  publicKey: string;
  signature: string;
}): boolean {
  let publicKey: PublicKey | undefined;
  let signature: Signature | undefined;
  try {
    publicKey = PublicKey.fromHex(input.publicKey);
    signature = Signature.fromHex(input.signature);
    const derivedAddress = publicKey.toAddress();
    const expectedAddress = Address.fromString(input.walletAddress);
    return (
      derivedAddress.equals(expectedAddress) &&
      publicKey.verify(signature, nimiqSignedMessageDigest(input.message))
    );
  } catch {
    return false;
  } finally {
    signature?.free();
    publicKey?.free();
  }
}

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface WalletSessionRepository {
  consumeChallenge: (
    id: string,
    now: Date
  ) => Promise<{
    id: string;
    walletAddress: string;
    message: string;
    expiresAt: Date;
  } | null>;
  createSession: (input: {
    walletAddress: string;
    publicKey: string;
    tokenHash: string;
    expiresAt: Date;
  }) => Promise<{ userId: string; tokenHash: string; walletAddress: string }>;
}

export interface WalletChallengeRepository {
  createChallenge: (input: {
    walletAddress: string;
    message: string;
    expiresAt: Date;
  }) => Promise<{ id: string; walletAddress: string; message: string; expiresAt: Date }>;
}

export async function issueWalletChallenge(
  repository: WalletChallengeRepository,
  walletAddress: string,
  now = new Date()
) {
  const normalizedAddress = normalizeWalletAddress(walletAddress);
  const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);
  const message = createChallengeMessage({
    walletAddress: normalizedAddress,
    nonce: randomBytes(24).toString("hex"),
    issuedAt: now,
    expiresAt
  });
  return repository.createChallenge({
    walletAddress: normalizedAddress,
    message,
    expiresAt
  });
}

export async function completeWalletSession(
  repository: WalletSessionRepository,
  input: { challengeId: string; publicKey: string; signature: string },
  now = new Date()
) {
  const challenge = await repository.consumeChallenge(input.challengeId, now);
  if (!challenge) throw new Error("Wallet challenge expired or was already used");
  if (
    !verifyWalletSignature({
      walletAddress: challenge.walletAddress,
      message: challenge.message,
      publicKey: input.publicKey,
      signature: input.signature
    })
  ) {
    throw new Error("Wallet signature could not be verified");
  }

  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);
  const session = await repository.createSession({
    walletAddress: normalizeWalletAddress(challenge.walletAddress),
    publicKey: input.publicKey,
    tokenHash,
    expiresAt
  });
  return {
    ...session,
    token,
    expiresAt
  };
}
