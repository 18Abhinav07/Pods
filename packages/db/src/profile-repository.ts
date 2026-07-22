import type { ProfileInput } from "@pods/domain";
import { normalizeProfileHandle, publicProfileProjection } from "@pods/domain";
import { and, asc, eq, ilike, or } from "drizzle-orm";

import type { PodsDatabase } from "./enrollment-repository";
import { profiles, users } from "./schema";

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  if ("code" in error && (error as { code?: unknown }).code === "23505") return true;
  return "cause" in error && isUniqueViolation((error as { cause?: unknown }).cause);
}

export function createProfileMethods(database: PodsDatabase) {
  return {
    async saveProfile(userId: string, input: ProfileInput) {
      const now = new Date();
      try {
        const [profile] = await database
          .insert(profiles)
          .values({
            userId,
            handle: normalizeProfileHandle(input.handle),
            displayName: input.displayName,
            bio: input.bio,
            avatar: input.avatar,
            visibility: input.visibility,
            dmPolicy: input.dmPolicy,
            activityStatusVisible: input.activityStatusVisible,
            onboardingCompletedAt: now,
            createdAt: now,
            updatedAt: now
          })
          .onConflictDoUpdate({
            target: profiles.userId,
            set: {
              handle: normalizeProfileHandle(input.handle),
              displayName: input.displayName,
              bio: input.bio,
              avatar: input.avatar,
              visibility: input.visibility,
              dmPolicy: input.dmPolicy,
              activityStatusVisible: input.activityStatusVisible,
              updatedAt: now
            }
          })
          .returning();
        if (!profile) throw new Error("Profile could not be saved");
        return profile;
      } catch (error) {
        if (isUniqueViolation(error)) throw new Error("Profile handle is already taken");
        throw error;
      }
    },

    async getProfileForUser(userId: string) {
      const [profile] = await database
        .select()
        .from(profiles)
        .where(eq(profiles.userId, userId));
      return profile ?? null;
    },

    async isProfileHandleAvailable(handle: string, currentUserId?: string) {
      const [profile] = await database
        .select({ userId: profiles.userId })
        .from(profiles)
        .where(eq(profiles.handle, normalizeProfileHandle(handle)));
      return !profile || profile.userId === currentUserId;
    },

    async getPublicProfilePresence(handle: string) {
      const [row] = await database
        .select({ profile: profiles, walletAddress: users.walletAddress })
        .from(profiles)
        .innerJoin(users, eq(users.id, profiles.userId))
        .where(eq(profiles.handle, normalizeProfileHandle(handle)));
      if (!row) return { kind: "not_found" as const };
      if (row.profile.visibility === "private") return { kind: "private" as const };
      return {
        kind: "public" as const,
        profile: publicProfileProjection({
          ...row.profile,
          walletAddress: row.walletAddress
        })
      };
    },

    async listPublicProfiles(input?: { limit?: number }) {
      const rows = await database
        .select({ profile: profiles, walletAddress: users.walletAddress })
        .from(profiles)
        .innerJoin(users, eq(users.id, profiles.userId))
        .where(eq(profiles.visibility, "public"))
        .orderBy(asc(profiles.handle))
        .limit(Math.min(Math.max(input?.limit ?? 40, 1), 100));
      return rows.map(({ profile, walletAddress }) =>
        publicProfileProjection({ ...profile, walletAddress })
      );
    },

    async searchPublicProfiles(input: { query: string; limit?: number }) {
      const query = input.query.trim();
      if (query.length < 2) return [];
      const pattern = `%${query}%`;
      const rows = await database
        .select({ profile: profiles, walletAddress: users.walletAddress })
        .from(profiles)
        .innerJoin(users, eq(users.id, profiles.userId))
        .where(
          and(
            eq(profiles.visibility, "public"),
            or(ilike(profiles.handle, pattern), ilike(profiles.displayName, pattern))
          )
        )
        .orderBy(asc(profiles.handle))
        .limit(Math.min(Math.max(input.limit ?? 20, 1), 40));
      return rows.map(({ profile, walletAddress }) =>
        publicProfileProjection({ ...profile, walletAddress })
      );
    }
  };
}
