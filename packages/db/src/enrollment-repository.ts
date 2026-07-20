import { randomUUID } from "node:crypto";

import {
  canDecideApplication,
  validateApplicationAnswers,
  type ApplicationAnswer,
  type ApplicationDecision
} from "@pods/domain";
import { and, asc, desc, eq, gt, inArray, isNull } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import * as schema from "./schema";
import { applications, invitations, memberships, occurrences, pods } from "./schema";

export type PodsDatabase = NodePgDatabase<typeof schema>;

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  if ("code" in error && (error as { code?: unknown }).code === "23505") return true;
  return "cause" in error && isUniqueViolation((error as { cause?: unknown }).cause);
}

function isEnrollmentOpen(
  pod: typeof pods.$inferSelect,
  firstOccurrenceOpensAt: Date | null,
  now: Date
) {
  return (
    pod.state === "enrollment_open" &&
    pod.contractData !== null &&
    firstOccurrenceOpensAt !== null &&
    firstOccurrenceOpensAt.getTime() > now.getTime()
  );
}

export function createEnrollmentMethods(database: PodsDatabase) {
  return {
    async listPublicPods(input: { now: Date }) {
      const candidates = await database
        .select({ pod: pods, firstOccurrenceOpensAt: occurrences.opensAt })
        .from(pods)
        .innerJoin(
          occurrences,
          and(eq(occurrences.podId, pods.id), eq(occurrences.ordinal, 1))
        )
        .where(eq(pods.state, "enrollment_open"))
        .orderBy(asc(occurrences.opensAt), desc(pods.publishedAt));

      return candidates
        .filter(
          ({ pod, firstOccurrenceOpensAt }) =>
            isEnrollmentOpen(pod, firstOccurrenceOpensAt, input.now) &&
            pod.contractData?.community.visibility === "public"
        )
        .map(({ pod, firstOccurrenceOpensAt }) => ({
          ...pod,
          firstOccurrenceOpensAt
        }));
    },

    async getPublicPod(podId: string, now: Date) {
      const [candidate] = await database
        .select({ pod: pods, firstOccurrenceOpensAt: occurrences.opensAt })
        .from(pods)
        .innerJoin(
          occurrences,
          and(eq(occurrences.podId, pods.id), eq(occurrences.ordinal, 1))
        )
        .where(and(eq(pods.id, podId), eq(pods.state, "enrollment_open")));
      if (
        !candidate ||
        !isEnrollmentOpen(candidate.pod, candidate.firstOccurrenceOpensAt, now) ||
        candidate.pod.contractData?.community.visibility !== "public"
      ) {
        return null;
      }
      return { ...candidate.pod, firstOccurrenceOpensAt: candidate.firstOccurrenceOpensAt };
    },

    async applyToPublicPod(input: {
      podId: string;
      applicantUserId: string;
      answers: ApplicationAnswer[];
      now: Date;
    }) {
      try {
        return await database.transaction(async (transaction) => {
          const [pod] = await transaction
            .select()
            .from(pods)
            .where(eq(pods.id, input.podId))
            .for("update");
          if (!pod || pod.contractData?.community.visibility !== "public") {
            throw new Error("Pod is not accepting public applications");
          }
          const [firstOccurrence] = await transaction
            .select({ opensAt: occurrences.opensAt })
            .from(occurrences)
            .where(and(eq(occurrences.podId, pod.id), eq(occurrences.ordinal, 1)));
          if (!isEnrollmentOpen(pod, firstOccurrence?.opensAt ?? null, input.now)) {
            throw new Error("Pod is not accepting public applications");
          }

          const expectedQuestions = pod.contractData.community.applicationQuestions;
          const answerValidation = validateApplicationAnswers(
            input.answers.map(({ answer }) => answer),
            expectedQuestions.length
          );
          if (!answerValidation.success) {
            throw new Error(answerValidation.errors[0] ?? "Application answers are invalid");
          }
          if (
            input.answers.some(
              ({ question }, index) => question.trim() !== expectedQuestions[index]?.trim()
            )
          ) {
            throw new Error("Application questions no longer match the frozen Pod rules");
          }

          const normalizedAnswers = expectedQuestions.map((question, index) => ({
            question,
            answer: answerValidation.value[index] ?? ""
          }));
          const applicationId = randomUUID();
          const [application] = await transaction
            .insert(applications)
            .values({
              id: applicationId,
              podId: pod.id,
              applicantUserId: input.applicantUserId,
              answers: normalizedAnswers,
              state: "applied",
              decidedAt: null,
              createdAt: input.now,
              updatedAt: input.now
            })
            .returning();
          if (!application) throw new Error("Application could not be created");
          await transaction.insert(memberships).values({
            id: randomUUID(),
            podId: pod.id,
            userId: input.applicantUserId,
            admissionSource: "public_application",
            state: "applied",
            applicationId,
            invitationId: null,
            acceptedAt: null,
            createdAt: input.now,
            updatedAt: input.now
          });
          return application;
        });
      } catch (error) {
        if (isUniqueViolation(error)) throw new Error("Application already exists");
        throw error;
      }
    },

    async decideApplication(input: {
      creatorUserId: string;
      podId: string;
      applicationId: string;
      decision: ApplicationDecision;
      now: Date;
    }) {
      return database.transaction(async (transaction) => {
        const [pod] = await transaction
          .select()
          .from(pods)
          .where(
            and(eq(pods.id, input.podId), eq(pods.creatorUserId, input.creatorUserId))
          )
          .for("update");
        if (!pod || pod.state !== "enrollment_open") return null;

        const [application] = await transaction
          .select()
          .from(applications)
          .where(
            and(
              eq(applications.id, input.applicationId),
              eq(applications.podId, input.podId)
            )
          )
          .for("update");
        if (!application || !canDecideApplication(application.state, input.decision)) {
          return null;
        }

        const state =
          input.decision === "accept" ? "accepted_unfunded" : "application_rejected";
        const [updated] = await transaction
          .update(applications)
          .set({ state, decidedAt: input.now, updatedAt: input.now })
          .where(and(eq(applications.id, application.id), eq(applications.state, "applied")))
          .returning();
        if (!updated) return null;
        await transaction
          .update(memberships)
          .set({
            state,
            acceptedAt: input.decision === "accept" ? input.now : null,
            updatedAt: input.now
          })
          .where(
            and(
              eq(memberships.applicationId, application.id),
              eq(memberships.state, "applied")
            )
          );
        return updated;
      });
    },

    async listApplicationsForUser(userId: string) {
      return database
        .select({ application: applications, pod: pods })
        .from(applications)
        .innerJoin(pods, eq(applications.podId, pods.id))
        .where(eq(applications.applicantUserId, userId))
        .orderBy(desc(applications.updatedAt));
    },

    async listApplicationsForCreator(input: { creatorUserId: string; podId?: string }) {
      return database
        .select({ application: applications, pod: pods })
        .from(applications)
        .innerJoin(pods, eq(applications.podId, pods.id))
        .where(
          input.podId
            ? and(
                eq(pods.creatorUserId, input.creatorUserId),
                eq(pods.id, input.podId)
              )
            : eq(pods.creatorUserId, input.creatorUserId)
        )
        .orderBy(desc(applications.createdAt));
    },

    async createInvitation(input: {
      creatorUserId: string;
      podId: string;
      tokenHash: string;
      now: Date;
    }) {
      return database.transaction(async (transaction) => {
        const [pod] = await transaction
          .select()
          .from(pods)
          .where(
            and(eq(pods.id, input.podId), eq(pods.creatorUserId, input.creatorUserId))
          )
          .for("update");
        if (!pod || pod.contractData?.community.visibility !== "private") {
          throw new Error("Private Pod not found");
        }
        const [firstOccurrence] = await transaction
          .select({ opensAt: occurrences.opensAt })
          .from(occurrences)
          .where(and(eq(occurrences.podId, pod.id), eq(occurrences.ordinal, 1)));
        if (!isEnrollmentOpen(pod, firstOccurrence?.opensAt ?? null, input.now)) {
          throw new Error("Private Pod is no longer accepting invitations");
        }
        const activeInvitations = await transaction
          .select({ id: invitations.id })
          .from(invitations)
          .where(
            and(
              eq(invitations.podId, pod.id),
              isNull(invitations.revokedAt),
              isNull(invitations.usedAt),
              gt(invitations.expiresAt, input.now)
            )
          );
        if (activeInvitations.length >= 5) {
          throw new Error("Revoke an active invitation before creating another");
        }

        const requestedExpiry = new Date(
          input.now.getTime() + pod.contractData.community.inviteExpiryHours * 60 * 60 * 1000
        );
        const expiresAt = new Date(
          Math.min(requestedExpiry.getTime(), firstOccurrence?.opensAt.getTime() ?? 0)
        );
        const [invitation] = await transaction
          .insert(invitations)
          .values({
            id: randomUUID(),
            podId: pod.id,
            createdByUserId: input.creatorUserId,
            tokenHash: input.tokenHash,
            expiresAt,
            revokedAt: null,
            usedAt: null,
            acceptedByUserId: null,
            createdAt: input.now
          })
          .returning();
        if (!invitation) throw new Error("Invitation could not be created");
        return invitation;
      });
    },

    async listInvitationsForCreator(input: { creatorUserId: string; podId: string }) {
      const [pod] = await database
        .select({ id: pods.id })
        .from(pods)
        .where(
          and(eq(pods.id, input.podId), eq(pods.creatorUserId, input.creatorUserId))
        );
      if (!pod) return [];
      return database
        .select()
        .from(invitations)
        .where(eq(invitations.podId, input.podId))
        .orderBy(desc(invitations.createdAt));
    },

    async revokeInvitation(input: {
      creatorUserId: string;
      podId: string;
      invitationId: string;
      now: Date;
    }) {
      return database.transaction(async (transaction) => {
        const [pod] = await transaction
          .select({ id: pods.id })
          .from(pods)
          .where(
            and(eq(pods.id, input.podId), eq(pods.creatorUserId, input.creatorUserId))
          );
        if (!pod) return false;
        const revoked = await transaction
          .update(invitations)
          .set({ revokedAt: input.now })
          .where(
            and(
              eq(invitations.id, input.invitationId),
              eq(invitations.podId, input.podId),
              isNull(invitations.revokedAt),
              isNull(invitations.usedAt),
              gt(invitations.expiresAt, input.now)
            )
          )
          .returning({ id: invitations.id });
        return revoked.length === 1;
      });
    },

    async getInvitationPreviewByTokenHash(tokenHash: string, now: Date) {
      const [candidate] = await database
        .select({ invitation: invitations, pod: pods, firstOccurrenceOpensAt: occurrences.opensAt })
        .from(invitations)
        .innerJoin(pods, eq(invitations.podId, pods.id))
        .innerJoin(
          occurrences,
          and(eq(occurrences.podId, pods.id), eq(occurrences.ordinal, 1))
        )
        .where(
          and(
            eq(invitations.tokenHash, tokenHash),
            isNull(invitations.revokedAt),
            isNull(invitations.usedAt),
            gt(invitations.expiresAt, now)
          )
        );
      if (
        !candidate ||
        candidate.pod.contractData?.community.visibility !== "private" ||
        !isEnrollmentOpen(candidate.pod, candidate.firstOccurrenceOpensAt, now)
      ) {
        return null;
      }
      const contract = candidate.pod.contractData;
      return {
        podId: candidate.pod.id,
        templateId: candidate.pod.templateId,
        activityName: contract.activity.name,
        purpose: contract.activity.purpose,
        startDate: contract.activity.startDate,
        endDate: contract.activity.endDate,
        occurrenceCount: contract.commitment.occurrenceCount,
        totalLuna: contract.commitment.totalLuna,
        minParticipants: contract.community.minParticipants,
        maxParticipants: contract.community.maxParticipants,
        expiresAt: candidate.invitation.expiresAt
      };
    },

    async acceptInvitation(input: { tokenHash: string; userId: string; now: Date }) {
      try {
        return await database.transaction(async (transaction) => {
          const [invitation] = await transaction
            .update(invitations)
            .set({ usedAt: input.now, acceptedByUserId: input.userId })
            .where(
              and(
                eq(invitations.tokenHash, input.tokenHash),
                isNull(invitations.revokedAt),
                isNull(invitations.usedAt),
                gt(invitations.expiresAt, input.now)
              )
            )
            .returning();
          if (!invitation) return null;

          const [pod] = await transaction
            .select()
            .from(pods)
            .where(eq(pods.id, invitation.podId))
            .for("update");
          const [firstOccurrence] = await transaction
            .select({ opensAt: occurrences.opensAt })
            .from(occurrences)
            .where(and(eq(occurrences.podId, invitation.podId), eq(occurrences.ordinal, 1)));
          if (
            !pod ||
            pod.contractData?.community.visibility !== "private" ||
            !isEnrollmentOpen(pod, firstOccurrence?.opensAt ?? null, input.now)
          ) {
            throw new Error("Invitation is unavailable");
          }

          const [membership] = await transaction
            .insert(memberships)
            .values({
              id: randomUUID(),
              podId: pod.id,
              userId: input.userId,
              admissionSource: "private_invitation",
              state: "accepted_unfunded",
              applicationId: null,
              invitationId: invitation.id,
              acceptedAt: input.now,
              createdAt: input.now,
              updatedAt: input.now
            })
            .returning();
          if (!membership) throw new Error("Invitation could not be accepted");
          return membership;
        });
      } catch (error) {
        if (isUniqueViolation(error)) return null;
        throw error;
      }
    },

    async getMembershipForUser(userId: string, podId: string) {
      const [membership] = await database
        .select()
        .from(memberships)
        .where(and(eq(memberships.userId, userId), eq(memberships.podId, podId)));
      return membership ?? null;
    },

    async getPodForAcceptedMember(userId: string, podId: string) {
      const [pod] = await database
        .select({ pod: pods })
        .from(memberships)
        .innerJoin(pods, eq(memberships.podId, pods.id))
        .where(
          and(
            eq(memberships.userId, userId),
            eq(memberships.podId, podId),
            inArray(memberships.state, [
              "accepted_unfunded",
              "funding_failed",
              "deposit_pending"
            ])
          )
        );
      return pod?.pod ?? null;
    },

    async listMembershipsForUser(userId: string) {
      return database
        .select({ membership: memberships, pod: pods })
        .from(memberships)
        .innerJoin(pods, eq(memberships.podId, pods.id))
        .where(eq(memberships.userId, userId))
        .orderBy(desc(memberships.updatedAt));
    }
  };
}
