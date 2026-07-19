import type {
  ActivityStepInput,
  CommitmentStepInput,
  CommunityStepInput,
  PublishedPodContract,
  TemplateId
} from "@pods/domain";
import {
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";

export type PodDraftData = {
  activity?: ActivityStepInput;
  community?: CommunityStepInput;
  commitment?: CommitmentStepInput;
};

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  walletAddress: text("wallet_address").notNull().unique(),
  publicKey: text("public_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull()
});

export const walletChallenges = pgTable(
  "wallet_challenges",
  {
    id: uuid("id").primaryKey(),
    walletAddress: text("wallet_address").notNull(),
    message: text("message").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull()
  },
  (table) => [index("wallet_challenges_wallet_idx").on(table.walletAddress)]
);

export const sessions = pgTable(
  "sessions",
  {
    tokenHash: text("token_hash").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull()
  },
  (table) => [
    primaryKey({ columns: [table.tokenHash] }),
    index("sessions_user_idx").on(table.userId)
  ]
);

export const pods = pgTable(
  "pods",
  {
    id: uuid("id").primaryKey(),
    creatorUserId: uuid("creator_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    state: text("state").notNull(),
    templateId: text("template_id").$type<TemplateId>().notNull(),
    draftData: jsonb("draft_data").$type<PodDraftData>().notNull(),
    contractData: jsonb("contract_data").$type<PublishedPodContract>(),
    contractHash: text("contract_hash"),
    publishedAt: timestamp("published_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull()
  },
  (table) => [index("pods_creator_state_idx").on(table.creatorUserId, table.state)]
);

export const occurrences = pgTable(
  "occurrences",
  {
    id: uuid("id").primaryKey(),
    podId: uuid("pod_id")
      .notNull()
      .references(() => pods.id, { onDelete: "cascade" }),
    ordinal: integer("ordinal").notNull(),
    localDate: date("local_date", { mode: "string" }).notNull(),
    opensAt: timestamp("opens_at", { withTimezone: true, mode: "date" }).notNull(),
    closesAt: timestamp("closes_at", { withTimezone: true, mode: "date" }).notNull(),
    commitmentDeadlineAt: timestamp("commitment_deadline_at", {
      withTimezone: true,
      mode: "date"
    })
  },
  (table) => [
    uniqueIndex("occurrences_pod_ordinal_unique").on(table.podId, table.ordinal),
    index("occurrences_pod_window_idx").on(table.podId, table.opensAt)
  ]
);
