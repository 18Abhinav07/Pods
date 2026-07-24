import { randomUUID } from "node:crypto";

import {
  canonicalUserPair,
  validateDirectIntroduction,
  type MessageKind,
  type MessageReplyPreview,
  type ReactionCode
} from "@pods/domain";
import { and, asc, desc, eq, gt, inArray, max, or, sql } from "drizzle-orm";

import type { PodsDatabase } from "./enrollment-repository";
import { projectProofForAudience } from "./proof-projection";
import {
  activityMessages,
  conversationReads,
  conversations,
  friendships,
  memberships,
  messageReactions,
  messages,
  occurrenceCommitments,
  occurrences,
  pods,
  profiles,
  realtimeEvents,
  submissions,
  userBlocks,
  notifications
} from "./schema";

const roomMembershipStates = ["roster_locked", "active"] as const;

async function requireConversationAccess(
  database: PodsDatabase,
  conversationId: string,
  userId: string,
  options?: { lock?: boolean }
) {
  let query = database
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId));
  if (options?.lock) query = query.for("update") as typeof query;
  const [conversation] = await query;
  if (!conversation) throw new Error("Conversation not found");

  if (conversation.kind === "direct") {
    if (conversation.firstUserId !== userId && conversation.secondUserId !== userId) {
      throw new Error("Conversation access denied");
    }
    if (conversation.directState !== "active") {
      throw new Error("Direct conversation is not active");
    }
    return { conversation, isCreator: false };
  }

  if (!conversation.podId) throw new Error("Pod conversation is invalid");
  const [pod] = await database.select().from(pods).where(eq(pods.id, conversation.podId));
  if (!pod) throw new Error("Pod conversation is invalid");
  if (pod.creatorUserId === userId) return { conversation, isCreator: true };
  const [membership] = await database
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.podId, conversation.podId),
        eq(memberships.userId, userId),
        inArray(memberships.state, [...roomMembershipStates])
      )
    );
  if (!membership) throw new Error("Pod room access requires a locked roster place");
  return { conversation, isCreator: false };
}

export function createMessagingMethods(database: PodsDatabase) {
  return {
    async openDirectConversation(input: {
      senderUserId: string;
      handle: string;
      introduction: unknown;
      now: Date;
    }) {
      const [target] = await database
        .select()
        .from(profiles)
        .where(eq(profiles.handle, input.handle.trim().toLowerCase()));
      if (!target || target.userId === input.senderUserId) throw new Error("Profile not found");
      const [blocked] = await database
        .select()
        .from(userBlocks)
        .where(or(
          and(eq(userBlocks.blockerUserId, input.senderUserId), eq(userBlocks.blockedUserId, target.userId)),
          and(eq(userBlocks.blockerUserId, target.userId), eq(userBlocks.blockedUserId, input.senderUserId))
        ));
      if (blocked) throw new Error("Social access is blocked");
      const pair = canonicalUserPair(input.senderUserId, target.userId);
      const [friendship] = await database
        .select()
        .from(friendships)
        .where(and(
          eq(friendships.firstUserId, pair.firstUserId),
          eq(friendships.secondUserId, pair.secondUserId)
        ));
      const isFriend = Boolean(friendship);
      if (!isFriend && target.dmPolicy !== "requests") {
        throw new Error("This profile does not accept message requests");
      }
      const validated = validateDirectIntroduction(input.introduction);
      if (!validated.success) throw new Error(validated.errors[0]);

      return database.transaction(async (transaction) => {
        const [existing] = await transaction
          .select()
          .from(conversations)
          .where(eq(conversations.directPairKey, pair.key))
          .for("update");
        if (existing) {
          return {
            conversation: existing,
            visibleState: existing.directState === "active" ? "active" as const : "pending" as const
          };
        }
        const directState = isFriend ? "active" as const : "pending" as const;
        const conversationId = randomUUID();
        const [conversation] = await transaction
          .insert(conversations)
          .values({
            id: conversationId,
            kind: "direct",
            podId: null,
            directPairKey: pair.key,
            firstUserId: pair.firstUserId,
            secondUserId: pair.secondUserId,
            requestSenderUserId: input.senderUserId,
            directState,
            roomState: "open",
            lastSequence: 1,
            archivedAt: null,
            createdAt: input.now,
            updatedAt: input.now
          })
          .returning();
        if (!conversation) throw new Error("Conversation could not be opened");
        const [message] = await transaction
          .insert(messages)
          .values({
            id: randomUUID(),
            conversationId,
            sequence: 1,
            senderUserId: input.senderUserId,
            kind: "member_message",
            body: validated.value,
            clientMessageId: randomUUID(),
            replyToMessageId: null,
            hiddenAt: null,
            hiddenByUserId: null,
            editedAt: null,
            deletedAt: null,
            pinnedAt: null,
            createdAt: input.now,
            updatedAt: input.now
          })
          .returning();
        await transaction.insert(realtimeEvents).values({
          conversationId,
          recipientUserId: target.userId,
          kind: directState === "pending" ? "direct.requested" : "message.created",
          payload: { messageId: message?.id, sequence: 1 },
          createdAt: input.now
        });
        if (directState === "pending") {
          await transaction.insert(notifications).values({
            id: randomUUID(),
            userId: target.userId,
            kind: "direct.requested",
            payload: { conversationId },
            readAt: null,
            createdAt: input.now
          });
        }
        return { conversation, visibleState: directState };
      });
    },

    async listDirectConversationRequests(userId: string) {
      const rows = await database
        .select({ conversation: conversations, message: messages })
        .from(conversations)
        .innerJoin(
          messages,
          and(eq(messages.conversationId, conversations.id), eq(messages.sequence, 1))
        )
        .where(and(
          eq(conversations.kind, "direct"),
          eq(conversations.directState, "pending"),
          or(eq(conversations.firstUserId, userId), eq(conversations.secondUserId, userId))
        ))
        .orderBy(desc(conversations.updatedAt));
      const incoming = rows.filter(({ conversation }) => conversation.requestSenderUserId !== userId);
      const senderIds = incoming.flatMap(({ conversation }) => conversation.requestSenderUserId ? [conversation.requestSenderUserId] : []);
      const senderProfiles = senderIds.length > 0
        ? await database.select().from(profiles).where(inArray(profiles.userId, senderIds))
        : [];
      const byId = new Map(senderProfiles.map((profile) => [profile.userId, profile]));
      return incoming.flatMap(({ conversation, message }) => {
        const sender = conversation.requestSenderUserId
          ? byId.get(conversation.requestSenderUserId)
          : null;
        return sender ? [{
          conversationId: conversation.id,
          introduction: message.body,
          createdAt: conversation.createdAt,
          sender: {
            handle: sender.handle,
            displayName: sender.displayName,
            avatar: sender.avatar
          }
        }] : [];
      });
    },

    async respondToDirectConversation(input: {
      conversationId: string;
      recipientUserId: string;
      action: "accept" | "discard" | "block";
      now: Date;
    }) {
      return database.transaction(async (transaction) => {
        const [conversation] = await transaction
          .select()
          .from(conversations)
          .where(eq(conversations.id, input.conversationId))
          .for("update");
        if (
          !conversation ||
          conversation.kind !== "direct" ||
          conversation.directState !== "pending" ||
          conversation.requestSenderUserId === input.recipientUserId ||
          (conversation.firstUserId !== input.recipientUserId && conversation.secondUserId !== input.recipientUserId)
        ) {
          throw new Error("Message request not found");
        }
        const directState = input.action === "accept"
          ? "active" as const
          : input.action === "discard"
            ? "discarded" as const
            : "blocked" as const;
        const [updated] = await transaction
          .update(conversations)
          .set({ directState, updatedAt: input.now })
          .where(eq(conversations.id, input.conversationId))
          .returning();
        if (input.action === "accept" && conversation.requestSenderUserId) {
          await transaction.insert(notifications).values({
            id: randomUUID(),
            userId: conversation.requestSenderUserId,
            kind: "direct.accepted",
            payload: { conversationId: conversation.id },
            readAt: null,
            createdAt: input.now
          });
        }
        if (input.action === "block" && conversation.requestSenderUserId) {
          await transaction.insert(userBlocks).values({
            blockerUserId: input.recipientUserId,
            blockedUserId: conversation.requestSenderUserId,
            createdAt: input.now
          }).onConflictDoNothing();
        }
        return updated;
      });
    },

    async listDirectConversationSummaries(userId: string) {
      const rows = await database
        .select()
        .from(conversations)
        .where(and(
          eq(conversations.kind, "direct"),
          eq(conversations.directState, "active"),
          or(eq(conversations.firstUserId, userId), eq(conversations.secondUserId, userId))
        ))
        .orderBy(desc(conversations.updatedAt));
      const peerIds = rows.flatMap((row) => {
        const peerId = row.firstUserId === userId ? row.secondUserId : row.firstUserId;
        return peerId ? [peerId] : [];
      });
      const peerProfiles = peerIds.length > 0
        ? await database.select().from(profiles).where(inArray(profiles.userId, peerIds))
        : [];
      const byId = new Map(peerProfiles.map((profile) => [profile.userId, profile]));
      const result = [];
      for (const conversation of rows) {
        const peerId = conversation.firstUserId === userId ? conversation.secondUserId : conversation.firstUserId;
        const peer = peerId ? byId.get(peerId) : null;
        if (!peer) continue;
        const [lastMessage] = await database
          .select({ body: messages.body, createdAt: messages.createdAt })
          .from(messages)
          .where(eq(messages.conversationId, conversation.id))
          .orderBy(desc(messages.sequence))
          .limit(1);
        const [read] = await database
          .select({ sequence: conversationReads.lastReadSequence })
          .from(conversationReads)
          .where(and(
            eq(conversationReads.conversationId, conversation.id),
            eq(conversationReads.userId, userId)
          ));
        result.push({
          id: conversation.id,
          peer: {
            handle: peer.handle,
            displayName: peer.displayName,
            avatar: peer.avatar
          },
          lastMessage: lastMessage?.body ?? "Conversation opened",
          updatedAt: lastMessage?.createdAt ?? conversation.updatedAt,
          unreadCount: Math.max(conversation.lastSequence - (read?.sequence ?? 0), 0)
        });
      }
      return result;
    },
    async ensurePodConversation(input: { podId: string; userId: string }) {
      const [pod] = await database.select().from(pods).where(eq(pods.id, input.podId));
      if (!pod) throw new Error("Pod not found");
      if (pod.creatorUserId !== input.userId) {
        const [membership] = await database
          .select()
          .from(memberships)
          .where(
            and(
              eq(memberships.podId, input.podId),
              eq(memberships.userId, input.userId),
              inArray(memberships.state, [...roomMembershipStates])
            )
          );
        if (!membership) {
          throw new Error("Pod room access requires a locked roster place");
        }
      }

      const now = new Date();
      const [created] = await database
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
          createdAt: now,
          updatedAt: now
        })
        .onConflictDoNothing({ target: conversations.podId })
        .returning();
      if (created) return created;
      const [existing] = await database
        .select()
        .from(conversations)
        .where(eq(conversations.podId, input.podId));
      if (!existing) throw new Error("Pod conversation could not be created");
      return existing;
    },

    async listPodRoomMembers(input: { podId: string; userId: string }) {
      const [conversation] = await database
        .select({ id: conversations.id })
        .from(conversations)
        .where(and(eq(conversations.kind, "pod"), eq(conversations.podId, input.podId)));
      if (!conversation) throw new Error("Pod room not found");
      await requireConversationAccess(database, conversation.id, input.userId);
      const [pod] = await database
        .select({ creatorUserId: pods.creatorUserId })
        .from(pods)
        .where(eq(pods.id, input.podId));
      if (!pod) throw new Error("Pod not found");
      const roster = await database
        .select({ userId: memberships.userId })
        .from(memberships)
        .where(
          and(
            eq(memberships.podId, input.podId),
            inArray(memberships.state, [...roomMembershipStates])
          )
        );
      const userIds = [...new Set([pod.creatorUserId, ...roster.map(({ userId }) => userId)])];
      const memberProfiles = await database
        .select()
        .from(profiles)
        .where(inArray(profiles.userId, userIds));
      return memberProfiles.map((profile) => ({
        handle: profile.handle,
        displayName: profile.displayName,
        avatar: profile.avatar,
        role: profile.userId === pod.creatorUserId ? "creator" as const : "member" as const
      }));
    },

    async getSharedSubmissionEvidence(input: {
      podId: string;
      submissionId: string;
      userId: string;
    }) {
      const [conversation] = await database
        .select({ id: conversations.id })
        .from(conversations)
        .where(and(eq(conversations.kind, "pod"), eq(conversations.podId, input.podId)));
      if (!conversation) return null;
      const access = await requireConversationAccess(
        database,
        conversation.id,
        input.userId
      );
      const [result] = await database
        .select({
          submission: submissions,
          occurrence: occurrences,
          participantUserId: memberships.userId
        })
        .from(submissions)
        .innerJoin(occurrences, eq(submissions.occurrenceId, occurrences.id))
        .innerJoin(memberships, eq(submissions.membershipId, memberships.id))
        .where(
          and(
            eq(submissions.id, input.submissionId),
            eq(occurrences.podId, input.podId)
          )
        );
      if (
        !result ||
        result.submission.state === "draft"
      ) {
        return null;
      }
      const proof = projectProofForAudience({
        audience: access.isCreator
          ? "creator"
          : result.participantUserId === input.userId
            ? "owner"
            : "member",
        shareMode: result.submission.proofShareMode,
        templateEvidence: result.submission.templateEvidence,
        resultSummary: result.submission.resultSummary,
        artifactUrl: result.submission.artifactUrl,
        hasAttachment: Boolean(result.submission.evidenceObjectKey)
      });
      if (!proof.attachmentAvailable || !result.submission.evidenceObjectKey) {
        return null;
      }
      return {
        objectKey: result.submission.evidenceObjectKey,
        contentType: result.submission.evidenceContentType ?? "image/webp",
        byteSize: result.submission.evidenceByteSize
      };
    },

    async postConversationMessage(input: {
      conversationId: string;
      userId: string;
      clientMessageId: string;
      body: string;
      replyToMessageId: string | null;
      kind: MessageKind;
      now: Date;
    }) {
      return database.transaction(async (transaction) => {
        const connection = transaction as unknown as PodsDatabase;
        const access = await requireConversationAccess(
          connection,
          input.conversationId,
          input.userId,
          { lock: true }
        );
        if (access.conversation.roomState === "archived") {
          throw new Error("This room is archived and read only");
        }
        if (input.kind === "announcement" && !access.isCreator) {
          throw new Error("Only the Pod creator can post announcements");
        }
        if (input.kind === "system" || input.kind === "activity") {
          throw new Error("Authoritative room entries require a system projection");
        }

        const [retry] = await transaction
          .select()
          .from(messages)
          .where(
            and(
              eq(messages.conversationId, input.conversationId),
              eq(messages.senderUserId, input.userId),
              eq(messages.clientMessageId, input.clientMessageId)
            )
          );
        if (retry) return retry;

        if (input.replyToMessageId) {
          const [reply] = await transaction
            .select({ conversationId: messages.conversationId })
            .from(messages)
            .where(eq(messages.id, input.replyToMessageId));
          if (!reply || reply.conversationId !== input.conversationId) {
            throw new Error("Reply target must be in the same conversation");
          }
        }

        const [advanced] = await transaction
          .update(conversations)
          .set({
            lastSequence: sql`${conversations.lastSequence} + 1`,
            updatedAt: input.now
          })
          .where(eq(conversations.id, input.conversationId))
          .returning({ sequence: conversations.lastSequence });
        if (!advanced) throw new Error("Conversation could not be advanced");

        const [message] = await transaction
          .insert(messages)
          .values({
            id: randomUUID(),
            conversationId: input.conversationId,
            sequence: advanced.sequence,
            senderUserId: input.userId,
            kind: input.kind,
            body: input.body,
            clientMessageId: input.clientMessageId,
            replyToMessageId: input.replyToMessageId,
            hiddenAt: null,
            hiddenByUserId: null,
            editedAt: null,
            deletedAt: null,
            pinnedAt: null,
            createdAt: input.now,
            updatedAt: input.now
          })
          .returning();
        if (!message) throw new Error("Message could not be saved");
        await transaction.insert(realtimeEvents).values({
          conversationId: input.conversationId,
          recipientUserId: null,
          kind: "message.created",
          payload: { messageId: message.id, sequence: message.sequence },
          createdAt: input.now
        });
        return message;
      });
    },

    async listConversationMessages(input: {
      conversationId: string;
      userId: string;
      afterSequence: number;
      changeCursor?: number;
      aroundMessageId?: string | null;
      limit: number;
    }) {
      const access = await requireConversationAccess(database, input.conversationId, input.userId);
      const limit = Math.min(Math.max(input.limit, 1), 100);
      let afterSequence = Math.max(input.afterSequence, -1);
      const [cursorRow] = await database
        .select({ cursor: max(realtimeEvents.id) })
        .from(realtimeEvents)
        .where(eq(realtimeEvents.conversationId, input.conversationId));
      const changeCursor = cursorRow?.cursor ?? 0;
      if (
        !input.aroundMessageId &&
        input.changeCursor !== undefined &&
        changeCursor > Math.max(input.changeCursor, 0)
      ) {
        afterSequence = -1;
      }
      if (input.aroundMessageId) {
        const [target] = await database
          .select({ sequence: messages.sequence })
          .from(messages)
          .where(and(
            eq(messages.id, input.aroundMessageId),
            eq(messages.conversationId, input.conversationId)
          ));
        if (!target) throw new Error("Reply target not found");
        afterSequence = Math.max(target.sequence - Math.ceil(limit / 2) - 1, -1);
      }
      const rows = await database
        .select({ message: messages, profile: profiles })
        .from(messages)
        .leftJoin(profiles, eq(profiles.userId, messages.senderUserId))
        .where(
          and(
            eq(messages.conversationId, input.conversationId),
              gt(messages.sequence, afterSequence)
          )
        )
        .orderBy(asc(messages.sequence))
        .limit(limit);
      const messageIds = rows.map(({ message }) => message.id);
      const replyMessageIds = [...new Set(
        rows.flatMap(({ message }) => message.replyToMessageId ? [message.replyToMessageId] : [])
      )];
      const replyRows = replyMessageIds.length > 0
        ? await database
            .select({ message: messages, profile: profiles })
            .from(messages)
            .leftJoin(profiles, eq(profiles.userId, messages.senderUserId))
            .where(and(
              eq(messages.conversationId, input.conversationId),
              inArray(messages.id, replyMessageIds)
            ))
        : [];
      const replyById = new Map(
        replyRows.map((row) => [row.message.id, row] as const)
      );
      const reactions = messageIds.length > 0
        ? await database
            .select()
            .from(messageReactions)
            .where(inArray(messageReactions.messageId, messageIds))
        : [];
      const activityRows = messageIds.length > 0
        ? await database
            .select({
              messageId: activityMessages.messageId,
              commitment: occurrenceCommitments,
              occurrence: occurrences,
              submission: submissions,
              participantUserId: memberships.userId,
              templateId: pods.templateId
            })
            .from(activityMessages)
            .innerJoin(
              occurrenceCommitments,
              eq(activityMessages.commitmentId, occurrenceCommitments.id)
            )
            .innerJoin(
              occurrences,
              eq(occurrenceCommitments.occurrenceId, occurrences.id)
            )
            .innerJoin(
              memberships,
              eq(occurrenceCommitments.membershipId, memberships.id)
            )
            .innerJoin(pods, eq(occurrences.podId, pods.id))
            .leftJoin(
              submissions,
              eq(submissions.commitmentId, occurrenceCommitments.id)
            )
            .where(inArray(activityMessages.messageId, messageIds))
        : [];
      const activityByMessage = new Map(
        activityRows.map((row) => [row.messageId, row] as const)
      );
      const peerUserId = access.conversation.kind === "direct"
        ? access.conversation.firstUserId === input.userId
          ? access.conversation.secondUserId
          : access.conversation.firstUserId
        : null;
      const [peerRead] = peerUserId
        ? await database
            .select({ sequence: conversationReads.lastReadSequence })
            .from(conversationReads)
            .where(and(
              eq(conversationReads.conversationId, input.conversationId),
              eq(conversationReads.userId, peerUserId)
            ))
        : [];

      return {
        conversation: {
          id: access.conversation.id,
          kind: access.conversation.kind,
          roomState: access.conversation.roomState,
          lastSequence: access.conversation.lastSequence,
          changeCursor,
          peerReadSequence: peerRead?.sequence ?? 0
        },
        messages: rows.map(({ message, profile }) => {
          const activityRow = activityByMessage.get(message.id);
          const visibleSubmission = activityRow?.submission?.state !== "draft"
            ? activityRow?.submission ?? null
            : null;
          const visibleProof = visibleSubmission && activityRow
            ? projectProofForAudience({
                audience: access.isCreator
                  ? "creator"
                  : activityRow.participantUserId === input.userId
                    ? "owner"
                    : "member",
                shareMode: visibleSubmission.proofShareMode,
                templateEvidence: visibleSubmission.templateEvidence,
                resultSummary: visibleSubmission.resultSummary,
                artifactUrl: visibleSubmission.artifactUrl,
                hasAttachment: Boolean(visibleSubmission.evidenceObjectKey)
              })
            : null;
          const messageReactionsForRow = reactions.filter(
            (reaction) => reaction.messageId === message.id
          );
          const byCode = new Map<ReactionCode, { count: number; reactedByViewer: boolean }>();
          for (const reaction of messageReactionsForRow) {
            const current = byCode.get(reaction.code) ?? {
              count: 0,
              reactedByViewer: false
            };
            current.count += 1;
            if (reaction.userId === input.userId) current.reactedByViewer = true;
            byCode.set(reaction.code, current);
          }
          let replyPreview: MessageReplyPreview | null = null;
          if (message.replyToMessageId) {
            const target = replyById.get(message.replyToMessageId);
            if (!target) {
              replyPreview = {
                messageId: message.replyToMessageId,
                sequence: 0,
                senderDisplayName: null,
                kind: "member_message",
                excerpt: "Message unavailable",
                available: false
              };
            } else {
              const available = target.message.hiddenAt === null && target.message.deletedAt === null;
              const excerpt = !available
                ? "Message unavailable"
                : target.message.kind === "activity"
                  ? "Activity update"
                  : target.message.kind === "system"
                    ? "Pods system update"
                    : (target.message.body ?? "").slice(0, 120);
              replyPreview = {
                messageId: target.message.id,
                sequence: target.message.sequence,
                senderDisplayName: available
                  ? target.profile?.displayName ?? (target.message.kind === "system" ? "Pods" : null)
                  : null,
                kind: target.message.kind,
                excerpt,
                available
              };
            }
          }
          return {
            id: message.id,
            sequence: message.sequence,
            kind: message.kind,
            body: message.hiddenAt ? null : message.body,
            replyToMessageId: message.replyToMessageId,
            replyPreview,
            hidden: message.hiddenAt !== null,
            pinned: message.pinnedAt !== null,
            createdAt: message.createdAt,
            sender: profile
              ? {
                  handle: profile.handle,
                  displayName: profile.displayName,
                  avatar: profile.avatar,
                  isViewer: message.senderUserId === input.userId
                }
              : null,
            activity: activityRow
              ? {
                  commitmentId: activityRow.commitment.id,
                  occurrenceOrdinal: activityRow.occurrence.ordinal,
                  task: activityRow.commitment.task,
                  deliverableType: activityRow.commitment.deliverableType,
                  templateId: activityRow.templateId,
                  state: visibleSubmission?.state ?? "committed",
                  submissionId: visibleSubmission?.id ?? null,
                  templateEvidence: visibleProof?.templateEvidence ?? null,
                  resultSummary: visibleProof?.resultSummary ?? null,
                  artifactUrl: visibleProof?.artifactUrl ?? null,
                  sharedEvidenceAvailable:
                    visibleProof?.attachmentAvailable ?? false
                }
              : null,
            reactions: [...byCode.entries()].map(([code, summary]) => ({
              code,
              ...summary
            }))
          };
        })
      };
    },

    async setMessageReaction(input: {
      messageId: string;
      userId: string;
      reaction: ReactionCode;
      now: Date;
    }) {
      const [message] = await database
        .select({ conversationId: messages.conversationId })
        .from(messages)
        .where(eq(messages.id, input.messageId));
      if (!message) throw new Error("Message not found");
      const access = await requireConversationAccess(
        database,
        message.conversationId,
        input.userId
      );
      if (access.conversation.roomState === "archived") {
        throw new Error("This room is archived and read only");
      }
      const [reaction] = await database
        .insert(messageReactions)
        .values({
          messageId: input.messageId,
          userId: input.userId,
          code: input.reaction,
          createdAt: input.now,
          updatedAt: input.now
        })
        .onConflictDoUpdate({
          target: [messageReactions.messageId, messageReactions.userId],
          set: { code: input.reaction, updatedAt: input.now }
        })
        .returning();
      await database.insert(realtimeEvents).values({
        conversationId: message.conversationId,
        recipientUserId: null,
        kind: "message.reaction_changed",
        payload: { messageId: input.messageId },
        createdAt: input.now
      });
      return reaction;
    },

    async removeMessageReaction(input: {
      messageId: string;
      userId: string;
      now: Date;
    }) {
      const [message] = await database
        .select({ conversationId: messages.conversationId })
        .from(messages)
        .where(eq(messages.id, input.messageId));
      if (!message) throw new Error("Message not found");
      await requireConversationAccess(database, message.conversationId, input.userId);
      await database
        .delete(messageReactions)
        .where(
          and(
            eq(messageReactions.messageId, input.messageId),
            eq(messageReactions.userId, input.userId)
          )
        );
      await database.insert(realtimeEvents).values({
        conversationId: message.conversationId,
        recipientUserId: null,
        kind: "message.reaction_changed",
        payload: { messageId: input.messageId },
        createdAt: input.now
      });
    },

    async markConversationRead(input: {
      conversationId: string;
      userId: string;
      sequence: number;
    }) {
      const access = await requireConversationAccess(database, input.conversationId, input.userId);
      const safeSequence = Math.min(
        Math.max(Math.trunc(input.sequence), 0),
        access.conversation.lastSequence
      );
      const [read] = await database
        .insert(conversationReads)
        .values({
          conversationId: input.conversationId,
          userId: input.userId,
          lastReadSequence: safeSequence,
          updatedAt: new Date()
        })
        .onConflictDoUpdate({
          target: [conversationReads.conversationId, conversationReads.userId],
          set: {
            lastReadSequence: sql`GREATEST(${conversationReads.lastReadSequence}, ${safeSequence})`,
            updatedAt: new Date()
          }
        })
        .returning();
      return read;
    },

    async getConversationReadSequence(input: { conversationId: string; userId: string }) {
      await requireConversationAccess(database, input.conversationId, input.userId);
      const [read] = await database
        .select({ sequence: conversationReads.lastReadSequence })
        .from(conversationReads)
        .where(
          and(
            eq(conversationReads.conversationId, input.conversationId),
            eq(conversationReads.userId, input.userId)
          )
        );
      return read?.sequence ?? 0;
    },

    async hideConversationMessage(input: {
      conversationId: string;
      messageId: string;
      moderatorUserId: string;
      now: Date;
    }) {
      const access = await requireConversationAccess(
        database,
        input.conversationId,
        input.moderatorUserId
      );
      if (!access.isCreator) throw new Error("Only the Pod creator can moderate room chat");
      const [message] = await database
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.id, input.messageId),
            eq(messages.conversationId, input.conversationId)
          )
        );
      if (!message) throw new Error("Message not found");
      if (message.kind !== "member_message") {
        throw new Error("Authoritative room entries cannot be hidden");
      }
      const [hidden] = await database
        .update(messages)
        .set({
          hiddenAt: input.now,
          hiddenByUserId: input.moderatorUserId,
          updatedAt: input.now
        })
        .where(eq(messages.id, input.messageId))
        .returning();
      await database.insert(realtimeEvents).values({
        conversationId: input.conversationId,
        recipientUserId: null,
        kind: "message.hidden",
        payload: { messageId: input.messageId },
        createdAt: input.now
      });
      return hidden;
    },

    async pinConversationAnnouncement(input: {
      conversationId: string;
      messageId: string;
      creatorUserId: string;
      pinned: boolean;
      now: Date;
    }) {
      const access = await requireConversationAccess(
        database,
        input.conversationId,
        input.creatorUserId
      );
      if (!access.isCreator) {
        throw new Error("Only the Pod creator can pin announcements");
      }
      const [message] = await database
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.id, input.messageId),
            eq(messages.conversationId, input.conversationId)
          )
        );
      if (!message || message.kind !== "announcement") {
        throw new Error("Only creator announcements can be pinned");
      }
      const [updated] = await database
        .update(messages)
        .set({
          pinnedAt: input.pinned ? input.now : null,
          updatedAt: input.now
        })
        .where(eq(messages.id, input.messageId))
        .returning();
      await database.insert(realtimeEvents).values({
        conversationId: input.conversationId,
        recipientUserId: null,
        kind: "message.pin_changed",
        payload: { messageId: input.messageId, pinned: input.pinned },
        createdAt: input.now
      });
      return updated;
    },

    async setPodRoomState(input: {
      conversationId: string;
      creatorUserId: string;
      roomState: "open" | "archived";
      now: Date;
    }) {
      const access = await requireConversationAccess(
        database,
        input.conversationId,
        input.creatorUserId
      );
      if (!access.isCreator || access.conversation.kind !== "pod") {
        throw new Error("Only the Pod creator can change room access");
      }
      if (input.roomState === "open" && access.conversation.podId) {
        const [pod] = await database
          .select({ state: pods.state })
          .from(pods)
          .where(eq(pods.id, access.conversation.podId));
        if (pod?.state === "final_review" || pod?.state === "completed") {
          throw new Error("Completed Pod rooms are permanent archives");
        }
      }
      const [updated] = await database
        .update(conversations)
        .set({
          roomState: input.roomState,
          archivedAt: input.roomState === "archived" ? input.now : null,
          updatedAt: input.now
        })
        .where(eq(conversations.id, input.conversationId))
        .returning();
      await database.insert(realtimeEvents).values({
        conversationId: input.conversationId,
        recipientUserId: null,
        kind: "room.state_changed",
        payload: { roomState: input.roomState },
        createdAt: input.now
      });
      return updated;
    },

    async listConversationsForUser(userId: string) {
      const direct = await database
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.kind, "direct"),
            or(eq(conversations.firstUserId, userId), eq(conversations.secondUserId, userId))
          )
        )
        .orderBy(desc(conversations.updatedAt));
      const membershipsForUser = await database
        .select({ podId: memberships.podId })
        .from(memberships)
        .where(
          and(
            eq(memberships.userId, userId),
            inArray(memberships.state, [...roomMembershipStates])
          )
        );
      const owned = await database
        .select({ id: pods.id })
        .from(pods)
        .where(
          and(
            eq(pods.creatorUserId, userId),
            inArray(pods.state, ["locked_scheduled", "active", "final_review", "completed"])
          )
        );
      const podIds = [...new Set([
        ...membershipsForUser.map(({ podId }) => podId),
        ...owned.map(({ id }) => id)
      ])];
      if (podIds.length > 0) {
        const now = new Date();
        await database
          .insert(conversations)
          .values(podIds.map((podId) => ({
            id: randomUUID(),
            kind: "pod" as const,
            podId,
            directPairKey: null,
            firstUserId: null,
            secondUserId: null,
            requestSenderUserId: null,
            directState: null,
            roomState: "open" as const,
            lastSequence: 0,
            archivedAt: null,
            createdAt: now,
            updatedAt: now
          })))
          .onConflictDoNothing({ target: conversations.podId });
      }
      const rooms = podIds.length > 0
        ? await database
            .select()
            .from(conversations)
            .where(and(eq(conversations.kind, "pod"), inArray(conversations.podId, podIds)))
            .orderBy(desc(conversations.updatedAt))
        : [];
      return { rooms, direct };
    }
  };
}
