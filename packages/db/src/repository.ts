import { createHash, randomUUID } from "node:crypto";

import type {
  ActivityStepInput,
  CommitmentStepInput,
  CommunityStepInput,
  FrozenOccurrence,
  PublishedPodContract,
  TemplateId
} from "@pods/domain";
import { isPublicVisitorContract, serializePublishedContract } from "@pods/domain";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { createEnrollmentMethods } from "./enrollment-repository";
import { createActivityMethods } from "./activity-repository";
import { createFundingMethods } from "./funding-repository";
import { createInboxMethods } from "./inbox-repository";
import { createProfileMethods } from "./profile-repository";
import { createPublicRoomMethods } from "./public-room-repository";
import { createPublicSafetyMethods } from "./public-safety-repository";
import { createSettlementMethods } from "./settlement-repository";
import { createSocialMethods } from "./social-repository";
import { createMessagingMethods } from "./messaging-repository";
import { createClockMethods } from "./clock-repository";
import { createCutoffMethods } from "./cutoff-repository";
import { createTransferMethods } from "./transfer-repository";
import { createWaitingRoomMethods } from "./waiting-room-repository";
import { createVerifierOverrideMethods } from "./verifier-override-repository";
import * as schema from "./schema";
import { conversations, occurrences, pods, sessions, users, walletChallenges } from "./schema";
import type { PodDraftData } from "./schema";

type DraftStep = keyof PodDraftData;

export function createPodsRepository(connectionString: string) {
  const pool = new Pool({ connectionString });
  const database = drizzle(pool, { schema });

  async function saveDraftStep(
    creatorUserId: string,
    podId: string,
    step: DraftStep,
    value: PodDraftData[DraftStep]
  ) {
    return database.transaction(async (transaction) => {
      const [pod] = await transaction
        .select()
        .from(pods)
        .where(and(eq(pods.id, podId), eq(pods.creatorUserId, creatorUserId)))
        .for("update");
      if (!pod) throw new Error("Pod not found");
      if (pod.state !== "draft") throw new Error("Pod contract is immutable after publication");

      const [updated] = await transaction
        .update(pods)
        .set({
          draftData: { ...pod.draftData, [step]: structuredClone(value) },
          updatedAt: new Date()
        })
        .where(and(eq(pods.id, podId), eq(pods.state, "draft")))
        .returning();
      if (!updated) throw new Error("Pod contract is immutable after publication");
      return updated;
    });
  }

  return {
    ...createActivityMethods(database),
    ...createClockMethods(database),
    ...createEnrollmentMethods(database),
    ...createFundingMethods(database),
    ...createInboxMethods(database),
    ...createProfileMethods(database),
    ...createPublicRoomMethods(database),
    ...createPublicSafetyMethods(database),
    ...createSettlementMethods(database),
    ...createSocialMethods(database),
    ...createMessagingMethods(database),
    ...createCutoffMethods(database),
    ...createTransferMethods(database),
    ...createWaitingRoomMethods(database),
    ...createVerifierOverrideMethods(database),

    async checkHealth() {
      await pool.query("select 1");
    },

    async close() {
      await pool.end();
    },

    async createChallenge(input: {
      walletAddress: string;
      message: string;
      expiresAt: Date;
    }) {
      const [challenge] = await database
        .insert(walletChallenges)
        .values({
          id: randomUUID(),
          walletAddress: input.walletAddress,
          message: input.message,
          expiresAt: input.expiresAt,
          consumedAt: null,
          createdAt: new Date()
        })
        .returning();
      if (!challenge) throw new Error("Challenge could not be created");
      return challenge;
    },

    async consumeChallenge(id: string, now: Date) {
      const [challenge] = await database
        .update(walletChallenges)
        .set({ consumedAt: now })
        .where(
          and(
            eq(walletChallenges.id, id),
            isNull(walletChallenges.consumedAt),
            gt(walletChallenges.expiresAt, now)
          )
        )
        .returning();
      return challenge ?? null;
    },

    async createSession(input: {
      walletAddress: string;
      publicKey: string;
      tokenHash: string;
      expiresAt: Date;
    }) {
      return database.transaction(async (transaction) => {
        const now = new Date();
        const [user] = await transaction
          .insert(users)
          .values({
            id: randomUUID(),
            walletAddress: input.walletAddress,
            publicKey: input.publicKey,
            createdAt: now,
            updatedAt: now
          })
          .onConflictDoUpdate({
            target: users.walletAddress,
            set: { publicKey: input.publicKey, updatedAt: now }
          })
          .returning();
        if (!user) throw new Error("Wallet user could not be created");
        const [session] = await transaction
          .insert(sessions)
          .values({
            tokenHash: input.tokenHash,
            userId: user.id,
            expiresAt: input.expiresAt,
            createdAt: now
          })
          .returning();
        if (!session) throw new Error("Session could not be created");
        return { ...session, walletAddress: user.walletAddress };
      });
    },

    async getSession(tokenHash: string, now: Date) {
      const [session] = await database
        .select({
          tokenHash: sessions.tokenHash,
          userId: sessions.userId,
          expiresAt: sessions.expiresAt,
          walletAddress: users.walletAddress,
          publicKey: users.publicKey
        })
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, now)));
      return session ?? null;
    },

    async deleteSession(tokenHash: string) {
      await database.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
    },

    async createDraft(creatorUserId: string, templateId: TemplateId) {
      const now = new Date();
      const [pod] = await database
        .insert(pods)
        .values({
          id: randomUUID(),
          creatorUserId,
          state: "draft",
          templateId,
          draftData: {},
          contractData: null,
          contractHash: null,
          creatorConsentContractHash: null,
          creatorConsentAt: null,
          publicRoomSuspendedAt: null,
          publishedAt: null,
          completedAt: null,
          createdAt: now,
          updatedAt: now
        })
        .returning();
      if (!pod) throw new Error("Pod draft could not be created");
      return pod;
    },

    saveActivityStep(creatorUserId: string, podId: string, value: ActivityStepInput) {
      return saveDraftStep(creatorUserId, podId, "activity", value);
    },

    saveCommunityStep(creatorUserId: string, podId: string, value: CommunityStepInput) {
      return saveDraftStep(creatorUserId, podId, "community", value);
    },

    saveCommitmentStep(creatorUserId: string, podId: string, value: CommitmentStepInput) {
      return saveDraftStep(creatorUserId, podId, "commitment", value);
    },

    async deleteDraft(creatorUserId: string, podId: string) {
      const deleted = await database
        .delete(pods)
        .where(
          and(
            eq(pods.id, podId),
            eq(pods.creatorUserId, creatorUserId),
            eq(pods.state, "draft")
          )
        )
        .returning({ id: pods.id });
      return deleted.length === 1;
    },

    async getPodForOwner(creatorUserId: string, podId: string) {
      const [pod] = await database
        .select()
        .from(pods)
        .where(and(eq(pods.id, podId), eq(pods.creatorUserId, creatorUserId)));
      return pod ?? null;
    },

    async listPodsForOwner(creatorUserId: string) {
      return database
        .select()
        .from(pods)
        .where(eq(pods.creatorUserId, creatorUserId))
        .orderBy(desc(pods.updatedAt));
    },

    async publishDraft(input: {
      creatorUserId: string;
      podId: string;
      contract: PublishedPodContract;
      occurrences: FrozenOccurrence[];
      creatorConsentAccepted?: boolean;
    }) {
      return database.transaction(async (transaction) => {
        const [pod] = await transaction
          .select()
          .from(pods)
          .where(
            and(eq(pods.id, input.podId), eq(pods.creatorUserId, input.creatorUserId))
          )
          .for("update");
        if (!pod) throw new Error("Pod not found");
        if (pod.state !== "draft") throw new Error("Pod contract is immutable after publication");

        const contractHash = createHash("sha256")
          .update(serializePublishedContract(input.contract))
          .digest("hex");
        const visitorContract = isPublicVisitorContract(input.contract);
        if (visitorContract && input.creatorConsentAccepted !== true) {
          throw new Error("Creator consent is required for a public visitor room");
        }
        await transaction.insert(occurrences).values(
          input.occurrences.map((occurrence) => ({
            id: randomUUID(),
            podId: input.podId,
            ordinal: occurrence.ordinal,
            localDate: occurrence.localDate,
            opensAt: new Date(occurrence.opensAt),
            closesAt: new Date(occurrence.closesAt),
            commitmentDeadlineAt: occurrence.commitmentDeadlineAt
              ? new Date(occurrence.commitmentDeadlineAt)
              : null
          }))
        );
        const publishedAt = new Date();
        if (visitorContract) {
          await transaction
            .insert(conversations)
            .values({
              id: randomUUID(),
              kind: "pod",
              podId: input.podId,
              directPairKey: null,
              firstUserId: null,
              secondUserId: null,
              requestSenderUserId: null,
              directState: null,
              roomState: "open",
              lastSequence: 0,
              archivedAt: null,
              createdAt: publishedAt,
              updatedAt: publishedAt
            })
            .onConflictDoNothing({ target: conversations.podId });
        }
        const [published] = await transaction
          .update(pods)
          .set({
            state: "enrollment_open",
            contractData: structuredClone(input.contract),
            contractHash,
            creatorConsentContractHash: visitorContract ? contractHash : null,
            creatorConsentAt: visitorContract ? publishedAt : null,
            publishedAt,
            updatedAt: publishedAt
          })
          .where(and(eq(pods.id, input.podId), eq(pods.state, "draft")))
          .returning();
        if (!published) throw new Error("Pod contract is immutable after publication");
        return {
          ...published,
          occurrenceCount: input.occurrences.length
        };
      });
    }
  };
}

export type PodsRepository = ReturnType<typeof createPodsRepository>;
