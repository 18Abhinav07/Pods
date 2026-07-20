import { randomUUID } from "node:crypto";

import { asc, desc, eq, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import * as schema from "./schema";
import { clockEvents } from "./schema";

type PodsDatabase = NodePgDatabase<typeof schema>;

export function createClockMethods(database: PodsDatabase) {
  return {
    async getEffectiveTime(realNow: Date) {
      const [latest] = await database
        .select({ effectiveTime: clockEvents.effectiveTime })
        .from(clockEvents)
        .orderBy(desc(clockEvents.effectiveTime))
        .limit(1);
      return latest?.effectiveTime ?? realNow;
    },

    async advanceClock(input: {
      effectiveTime: Date;
      reason: string;
      actor: string;
      realNow: Date;
    }) {
      const reason = input.reason.trim();
      if (!reason) throw new Error("Clock advance requires a non-empty reason");
      if (!Number.isFinite(input.effectiveTime.getTime())) {
        throw new Error("Clock advance requires a valid effective time");
      }

      return database.transaction(async (transaction) => {
        await transaction.execute(sql`select pg_advisory_xact_lock(1347374163)`);
        const [latest] = await transaction
          .select({ effectiveTime: clockEvents.effectiveTime })
          .from(clockEvents)
          .orderBy(desc(clockEvents.effectiveTime))
          .limit(1);
        const previousTime = latest?.effectiveTime ?? input.realNow;
        if (input.effectiveTime.getTime() <= previousTime.getTime()) {
          throw new Error("Clock can only advance beyond the current effective time");
        }

        const [event] = await transaction
          .insert(clockEvents)
          .values({
            id: randomUUID(),
            previousTime,
            effectiveTime: input.effectiveTime,
            reason,
            actor: input.actor,
            createdAt: input.realNow
          })
          .returning();
        if (!event) throw new Error("Clock event could not be recorded");
        return event;
      });
    },

    listClockEvents(actor: string) {
      return database
        .select()
        .from(clockEvents)
        .where(eq(clockEvents.actor, actor))
        .orderBy(asc(clockEvents.effectiveTime));
    }
  };
}
