import { createHash } from "node:crypto";

import { KeyPair, PrivateKey } from "@nimiq/core";
import { describe, expect, it } from "vitest";

import {
  completeWalletSession,
  createChallengeMessage,
  hashSessionToken,
  issueWalletChallenge,
  normalizeWalletAddress,
  safeReturnTarget,
  verifyWalletSignature
} from "../src/lib/auth";

const encoder = new TextEncoder();
const signedMessagePrefix = "\x16Nimiq Signed Message:\n";

function signAsNimiqPay(keyPair: KeyPair, message: string) {
  const messageBytes = encoder.encode(message);
  const payload = Buffer.concat([
    Buffer.from(signedMessagePrefix, "utf8"),
    Buffer.from(String(messageBytes.byteLength), "utf8"),
    Buffer.from(messageBytes)
  ]);
  const digest = createHash("sha256").update(payload).digest();
  return keyPair.sign(digest).toHex();
}

describe("wallet signature contract", () => {
  it("verifies that the public key owns the challenged Nimiq address", () => {
    const keyPair = KeyPair.derive(PrivateKey.fromHex("44".repeat(32)));
    const walletAddress = keyPair.toAddress().toUserFriendlyAddress();
    const message = "Pods wallet sign-in test";
    const signature = signAsNimiqPay(keyPair, message);

    expect(verifyWalletSignature({
      walletAddress,
      message,
      publicKey: keyPair.publicKey.toHex(),
      signature
    })).toBe(true);
    expect(verifyWalletSignature({
      walletAddress,
      message: `${message} changed`,
      publicKey: keyPair.publicKey.toHex(),
      signature
    })).toBe(false);
    expect(verifyWalletSignature({
      walletAddress,
      message,
      publicKey: keyPair.publicKey.toHex(),
      signature: keyPair.sign(encoder.encode(message)).toHex()
    })).toBe(false);
  });

  it("normalizes Nimiq addresses and rejects unsafe return targets", () => {
    const keyPair = KeyPair.derive(PrivateKey.fromHex("55".repeat(32)));
    const address = keyPair.toAddress().toUserFriendlyAddress();
    expect(normalizeWalletAddress(address.replaceAll(" ", ""))).toBe(address);
    expect(safeReturnTarget("/pods/create/template")).toBe("/pods/create/template");
    expect(safeReturnTarget("https://attacker.example/steal")).toBe("/today");
    expect(safeReturnTarget("//attacker.example/steal")).toBe("/today");
  });

  it("creates a single-use session from the stored challenge message", async () => {
    const keyPair = KeyPair.derive(PrivateKey.fromHex("66".repeat(32)));
    const walletAddress = keyPair.toAddress().toUserFriendlyAddress();
    const now = new Date("2026-07-19T12:00:00.000Z");
    const message = createChallengeMessage({
      walletAddress,
      nonce: "a1b2c3",
      issuedAt: now,
      expiresAt: new Date(now.getTime() + 300_000)
    });
    let createdTokenHash = "";
    const repository = {
      consumeChallenge: async () => ({
        id: "challenge-id",
        walletAddress,
        message,
        expiresAt: new Date(now.getTime() + 300_000)
      }),
      createSession: async (input: {
        walletAddress: string;
        publicKey: string;
        tokenHash: string;
        expiresAt: Date;
      }) => {
        createdTokenHash = input.tokenHash;
        return { userId: "user-id", tokenHash: input.tokenHash, walletAddress };
      }
    };

    const result = await completeWalletSession(
      repository,
      {
        challengeId: "challenge-id",
        publicKey: keyPair.publicKey.toHex(),
        signature: signAsNimiqPay(keyPair, message)
      },
      now
    );

    expect(result.walletAddress).toBe(walletAddress);
    expect(result.expiresAt.getTime()).toBe(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    expect(createdTokenHash).toBe(hashSessionToken(result.token));
    expect(createdTokenHash).not.toBe(result.token);
  });

  it("issues a five-minute challenge for the normalized wallet", async () => {
    const keyPair = KeyPair.derive(PrivateKey.fromHex("77".repeat(32)));
    const walletAddress = keyPair.toAddress().toUserFriendlyAddress();
    const now = new Date("2026-07-19T12:00:00.000Z");
    let storedInput: { walletAddress: string; message: string; expiresAt: Date } | undefined;

    const challenge = await issueWalletChallenge(
      {
        createChallenge: async (input) => {
          storedInput = input;
          return { id: "challenge-id", ...input };
        }
      },
      walletAddress.replaceAll(" ", ""),
      now
    );

    expect(challenge.id).toBe("challenge-id");
    expect(storedInput?.walletAddress).toBe(walletAddress);
    expect(storedInput?.expiresAt.getTime()).toBe(now.getTime() + 300_000);
    expect(storedInput?.message).toContain("Signing proves wallet ownership");
  });
});
