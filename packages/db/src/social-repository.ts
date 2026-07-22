import { randomUUID } from "node:crypto";

import { canonicalUserPair, publicProfileProjection, type FriendRequestState, type ReportReason } from "@pods/domain";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";

import type { PodsDatabase } from "./enrollment-repository";
import {
  friendRequests,
  friendships,
  notifications,
  profiles,
  userBlocks,
  userFollows,
  userReports
} from "./schema";

async function profileByHandle(database: PodsDatabase, handle: string) {
  const [profile] = await database
    .select()
    .from(profiles)
    .where(eq(profiles.handle, handle.trim().toLowerCase()));
  return profile ?? null;
}

async function blocked(database: PodsDatabase, firstUserId: string, secondUserId: string) {
  const [row] = await database
    .select({ blockerUserId: userBlocks.blockerUserId })
    .from(userBlocks)
    .where(
      or(
        and(
          eq(userBlocks.blockerUserId, firstUserId),
          eq(userBlocks.blockedUserId, secondUserId)
        ),
        and(
          eq(userBlocks.blockerUserId, secondUserId),
          eq(userBlocks.blockedUserId, firstUserId)
        )
      )
    );
  return Boolean(row);
}

function pairWhere(firstUserId: string, secondUserId: string) {
  const pair = canonicalUserPair(firstUserId, secondUserId);
  return and(
    eq(friendships.firstUserId, pair.firstUserId),
    eq(friendships.secondUserId, pair.secondUserId)
  );
}

export function createSocialMethods(database: PodsDatabase) {
  return {
    async followProfile(input: { viewerUserId: string; handle: string }) {
      const target = await profileByHandle(database, input.handle);
      if (!target || target.visibility !== "public") throw new Error("Public profile not found");
      if (target.userId === input.viewerUserId) throw new Error("You cannot follow yourself");
      if (await blocked(database, input.viewerUserId, target.userId)) {
        throw new Error("Social access is blocked");
      }
      const [follow] = await database
        .insert(userFollows)
        .values({
          followerUserId: input.viewerUserId,
          followedUserId: target.userId,
          createdAt: new Date()
        })
        .onConflictDoNothing()
        .returning();
      return follow ?? { followerUserId: input.viewerUserId, followedUserId: target.userId };
    },

    async unfollowProfile(input: { viewerUserId: string; handle: string }) {
      const target = await profileByHandle(database, input.handle);
      if (!target) return false;
      const deleted = await database
        .delete(userFollows)
        .where(
          and(
            eq(userFollows.followerUserId, input.viewerUserId),
            eq(userFollows.followedUserId, target.userId)
          )
        )
        .returning({ userId: userFollows.followedUserId });
      return deleted.length > 0;
    },

    async listFollowingProfiles(viewerUserId: string) {
      const rows = await database
        .select({ profile: profiles })
        .from(userFollows)
        .innerJoin(profiles, eq(profiles.userId, userFollows.followedUserId))
        .where(
          and(
            eq(userFollows.followerUserId, viewerUserId),
            eq(profiles.visibility, "public")
          )
        )
        .orderBy(desc(userFollows.createdAt));
      return rows.map(({ profile }) => publicProfileProjection(profile));
    },

    async areFriends(firstUserId: string, secondUserId: string) {
      if (firstUserId === secondUserId) return false;
      const [friendship] = await database
        .select({ firstUserId: friendships.firstUserId })
        .from(friendships)
        .where(pairWhere(firstUserId, secondUserId));
      return Boolean(friendship);
    },

    async sendFriendRequest(input: { senderUserId: string; handle: string; now: Date }) {
      const target = await profileByHandle(database, input.handle);
      if (!target) throw new Error("Profile not found");
      if (target.userId === input.senderUserId) throw new Error("You cannot friend yourself");
      if (await blocked(database, input.senderUserId, target.userId)) {
        throw new Error("Social access is blocked");
      }
      return database.transaction(async (transaction) => {
        const connection = transaction as unknown as PodsDatabase;
        const [friendship] = await connection
          .select()
          .from(friendships)
          .where(pairWhere(input.senderUserId, target.userId));
        if (friendship) return { state: "accepted" as const, friendship };

        const [reverse] = await connection
          .select()
          .from(friendRequests)
          .where(
            and(
              eq(friendRequests.senderUserId, target.userId),
              eq(friendRequests.recipientUserId, input.senderUserId),
              eq(friendRequests.state, "pending")
            )
          )
          .for("update");
        if (reverse) {
          const pair = canonicalUserPair(input.senderUserId, target.userId);
          const [createdFriendship] = await connection
            .insert(friendships)
            .values({ ...pair, createdAt: input.now })
            .onConflictDoNothing()
            .returning();
          const [accepted] = await connection
            .update(friendRequests)
            .set({ state: "accepted", decidedAt: input.now, updatedAt: input.now })
            .where(eq(friendRequests.id, reverse.id))
            .returning();
          return { state: "accepted" as const, request: accepted, friendship: createdFriendship };
        }

        const [existing] = await connection
          .select()
          .from(friendRequests)
          .where(
            and(
              eq(friendRequests.senderUserId, input.senderUserId),
              eq(friendRequests.recipientUserId, target.userId)
            )
          )
          .for("update");
        const [request] = existing
          ? await connection
              .update(friendRequests)
              .set({ state: "pending", decidedAt: null, updatedAt: input.now })
              .where(eq(friendRequests.id, existing.id))
              .returning()
          : await connection
              .insert(friendRequests)
              .values({
                id: randomUUID(),
                senderUserId: input.senderUserId,
                recipientUserId: target.userId,
                state: "pending",
                decidedAt: null,
                createdAt: input.now,
                updatedAt: input.now
              })
              .returning();
        if (!request) throw new Error("Friend request could not be sent");
        await connection.insert(notifications).values({
          id: randomUUID(),
          userId: target.userId,
          kind: "friend_request.received",
          payload: { requestId: request.id },
          readAt: null,
          createdAt: input.now
        });
        return request;
      });
    },

    async respondToFriendRequest(input: {
      requestId: string;
      userId: string;
      action: "accept" | "decline" | "cancel";
      now: Date;
    }) {
      return database.transaction(async (transaction) => {
        const connection = transaction as unknown as PodsDatabase;
        const [request] = await connection
          .select()
          .from(friendRequests)
          .where(eq(friendRequests.id, input.requestId))
          .for("update");
        if (!request || request.state !== "pending") throw new Error("Friend request not found");
        const isSender = request.senderUserId === input.userId;
        const isRecipient = request.recipientUserId === input.userId;
        const allowed =
          (input.action === "cancel" && isSender) ||
          ((input.action === "accept" || input.action === "decline") && isRecipient);
        if (!allowed) throw new Error("Friend request action is not allowed");
        const state: FriendRequestState = input.action === "accept"
          ? "accepted"
          : input.action === "decline"
            ? "declined"
            : "cancelled";
        const [updated] = await connection
          .update(friendRequests)
          .set({ state, decidedAt: input.now, updatedAt: input.now })
          .where(eq(friendRequests.id, input.requestId))
          .returning();
        if (state === "accepted") {
          const pair = canonicalUserPair(request.senderUserId, request.recipientUserId);
          await connection.insert(friendships).values({ ...pair, createdAt: input.now }).onConflictDoNothing();
          await connection.insert(notifications).values({
            id: randomUUID(),
            userId: request.senderUserId,
            kind: "friend_request.accepted",
            payload: { requestId: request.id },
            readAt: null,
            createdAt: input.now
          });
        }
        return updated;
      });
    },

    async listFriendRequests(userId: string) {
      const rows = await database
        .select({ request: friendRequests })
        .from(friendRequests)
        .where(
          and(
            or(
              eq(friendRequests.senderUserId, userId),
              eq(friendRequests.recipientUserId, userId)
            ),
            eq(friendRequests.state, "pending")
          )
        )
        .orderBy(desc(friendRequests.updatedAt));
      const otherIds = rows.map(({ request }) =>
        request.senderUserId === userId ? request.recipientUserId : request.senderUserId
      );
      const otherProfiles = otherIds.length > 0
        ? await database.select().from(profiles).where(inArray(profiles.userId, otherIds))
        : [];
      const byId = new Map(otherProfiles.map((profile) => [profile.userId, profile]));
      return rows.flatMap(({ request }) => {
        const incoming = request.recipientUserId === userId;
        const other = byId.get(incoming ? request.senderUserId : request.recipientUserId);
        if (!other) return [];
        return [{
          id: request.id,
          direction: incoming ? "incoming" as const : "outgoing" as const,
          profile: publicProfileProjection(other),
          createdAt: request.createdAt
        }];
      });
    },

    async listFriends(userId: string) {
      const rows = await database
        .select()
        .from(friendships)
        .where(or(eq(friendships.firstUserId, userId), eq(friendships.secondUserId, userId)))
        .orderBy(desc(friendships.createdAt));
      const ids = rows.map((row) => row.firstUserId === userId ? row.secondUserId : row.firstUserId);
      if (ids.length === 0) return [];
      const friendProfiles = await database.select().from(profiles).where(inArray(profiles.userId, ids));
      const byId = new Map(friendProfiles.map((profile) => [profile.userId, profile]));
      return ids.flatMap((id) => {
        const profile = byId.get(id);
        return profile ? [publicProfileProjection(profile)] : [];
      });
    },

    async removeFriend(input: { userId: string; handle: string }) {
      const target = await profileByHandle(database, input.handle);
      if (!target || target.userId === input.userId) return false;
      const deleted = await database.delete(friendships).where(pairWhere(input.userId, target.userId)).returning();
      return deleted.length > 0;
    },

    async blockProfile(input: { blockerUserId: string; handle: string; now: Date }) {
      const target = await profileByHandle(database, input.handle);
      if (!target) throw new Error("Profile not found");
      if (target.userId === input.blockerUserId) throw new Error("You cannot block yourself");
      return database.transaction(async (transaction) => {
        const connection = transaction as unknown as PodsDatabase;
        await connection
          .insert(userBlocks)
          .values({
            blockerUserId: input.blockerUserId,
            blockedUserId: target.userId,
            createdAt: input.now
          })
          .onConflictDoNothing();
        await connection.delete(userFollows).where(
          or(
            and(eq(userFollows.followerUserId, input.blockerUserId), eq(userFollows.followedUserId, target.userId)),
            and(eq(userFollows.followerUserId, target.userId), eq(userFollows.followedUserId, input.blockerUserId))
          )
        );
        await connection.delete(friendRequests).where(
          or(
            and(eq(friendRequests.senderUserId, input.blockerUserId), eq(friendRequests.recipientUserId, target.userId)),
            and(eq(friendRequests.senderUserId, target.userId), eq(friendRequests.recipientUserId, input.blockerUserId))
          )
        );
        await connection.delete(friendships).where(pairWhere(input.blockerUserId, target.userId));
        return { blocked: true, handle: target.handle };
      });
    },

    async unblockProfile(input: { blockerUserId: string; handle: string }) {
      const target = await profileByHandle(database, input.handle);
      if (!target) return false;
      const deleted = await database
        .delete(userBlocks)
        .where(
          and(
            eq(userBlocks.blockerUserId, input.blockerUserId),
            eq(userBlocks.blockedUserId, target.userId)
          )
        )
        .returning();
      return deleted.length > 0;
    },

    async reportProfile(input: {
      reporterUserId: string;
      handle: string;
      reason: ReportReason;
      details: string;
      now: Date;
    }) {
      const target = await profileByHandle(database, input.handle);
      if (!target || target.userId === input.reporterUserId) throw new Error("Profile not found");
      const [report] = await database
        .insert(userReports)
        .values({
          id: randomUUID(),
          reporterUserId: input.reporterUserId,
          reportedUserId: target.userId,
          reason: input.reason,
          details: input.details,
          createdAt: input.now
        })
        .returning();
      return report;
    },

    async getSocialProfilePresence(input: { viewerUserId: string | null; handle: string }) {
      const target = await profileByHandle(database, input.handle);
      if (!target) return { kind: "not_found" as const };
      if (target.visibility === "private") return { kind: "private" as const };
      const [followers, following] = await Promise.all([
        database.select({ count: sql<number>`count(*)::int` }).from(userFollows).where(eq(userFollows.followedUserId, target.userId)),
        database.select({ count: sql<number>`count(*)::int` }).from(userFollows).where(eq(userFollows.followerUserId, target.userId))
      ]);
      if (!input.viewerUserId || input.viewerUserId === target.userId) {
        return {
          kind: "public" as const,
          profile: publicProfileProjection(target),
          counts: { followers: followers[0]?.count ?? 0, following: following[0]?.count ?? 0 },
          relationship: { self: input.viewerUserId === target.userId, following: false, friend: false, request: null },
          messageRequestsAllowed: target.dmPolicy === "requests"
        };
      }
      const [follow, friendship, request] = await Promise.all([
        database.select().from(userFollows).where(and(eq(userFollows.followerUserId, input.viewerUserId), eq(userFollows.followedUserId, target.userId))),
        database.select().from(friendships).where(pairWhere(input.viewerUserId, target.userId)),
        database.select().from(friendRequests).where(and(
          or(
            and(eq(friendRequests.senderUserId, input.viewerUserId), eq(friendRequests.recipientUserId, target.userId)),
            and(eq(friendRequests.senderUserId, target.userId), eq(friendRequests.recipientUserId, input.viewerUserId))
          ),
          eq(friendRequests.state, "pending")
        ))
      ]);
      return {
        kind: "public" as const,
        profile: publicProfileProjection(target),
        counts: { followers: followers[0]?.count ?? 0, following: following[0]?.count ?? 0 },
        relationship: {
          self: false,
          following: follow.length > 0,
          friend: friendship.length > 0,
          request: request[0]
            ? {
                id: request[0].id,
                direction: request[0].senderUserId === input.viewerUserId ? "outgoing" as const : "incoming" as const
              }
            : null
        },
        messageRequestsAllowed: target.dmPolicy === "requests"
      };
    }
  };
}
