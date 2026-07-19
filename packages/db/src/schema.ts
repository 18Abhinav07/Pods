import type {
  AdmissionSource,
  ApplicationAnswer,
  ApplicationStatus,
  ActivityStepInput,
  CommitmentStepInput,
  CommunityStepInput,
  DepositExceptionCode,
  DepositState,
  FundingNetwork,
  LedgerMovementType,
  MembershipState,
  PublishedPodContract,
  TemplateId
} from "@pods/domain";
import {
  bigint,
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

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey(),
    podId: uuid("pod_id")
      .notNull()
      .references(() => pods.id, { onDelete: "cascade" }),
    applicantUserId: uuid("applicant_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    answers: jsonb("answers").$type<ApplicationAnswer[]>().notNull(),
    state: text("state").$type<ApplicationStatus>().notNull(),
    decidedAt: timestamp("decided_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull()
  },
  (table) => [
    uniqueIndex("applications_pod_applicant_unique").on(table.podId, table.applicantUserId),
    index("applications_pod_state_idx").on(table.podId, table.state),
    index("applications_applicant_state_idx").on(table.applicantUserId, table.state)
  ]
);

export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").primaryKey(),
    podId: uuid("pod_id")
      .notNull()
      .references(() => pods.id, { onDelete: "cascade" }),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
    usedAt: timestamp("used_at", { withTimezone: true, mode: "date" }),
    acceptedByUserId: uuid("accepted_by_user_id").references(() => users.id, {
      onDelete: "set null"
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull()
  },
  (table) => [
    uniqueIndex("invitations_token_hash_unique").on(table.tokenHash),
    index("invitations_pod_expiry_idx").on(table.podId, table.expiresAt)
  ]
);

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey(),
    podId: uuid("pod_id")
      .notNull()
      .references(() => pods.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    admissionSource: text("admission_source").$type<AdmissionSource>().notNull(),
    state: text("state").$type<MembershipState>().notNull(),
    applicationId: uuid("application_id").references(() => applications.id, {
      onDelete: "set null"
    }),
    invitationId: uuid("invitation_id").references(() => invitations.id, {
      onDelete: "set null"
    }),
    depositIntentId: uuid("deposit_intent_id"),
    acceptedAt: timestamp("accepted_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull()
  },
  (table) => [
    uniqueIndex("memberships_pod_user_unique").on(table.podId, table.userId),
    uniqueIndex("memberships_application_unique").on(table.applicationId),
    uniqueIndex("memberships_invitation_unique").on(table.invitationId),
    uniqueIndex("memberships_deposit_intent_unique").on(table.depositIntentId),
    index("memberships_user_state_idx").on(table.userId, table.state),
    index("memberships_pod_state_idx").on(table.podId, table.state)
  ]
);

export const depositIntents = pgTable(
  "deposit_intents",
  {
    id: uuid("id").primaryKey(),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    podId: uuid("pod_id")
      .notNull()
      .references(() => pods.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    walletAddress: text("wallet_address").notNull(),
    treasuryAddress: text("treasury_address").notNull(),
    network: text("network").$type<FundingNetwork>().notNull(),
    reference: text("reference").notNull(),
    amountLuna: bigint("amount_luna", { mode: "number" }).notNull(),
    state: text("state").$type<DepositState>().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    transactionHash: text("transaction_hash"),
    observedFrom: text("observed_from"),
    observedFromType: integer("observed_from_type"),
    observedRelatedAddresses: jsonb("observed_related_addresses").$type<string[]>(),
    blockNumber: integer("block_number"),
    transactionIndex: integer("transaction_index"),
    transactionBatch: integer("transaction_batch"),
    observedAt: timestamp("observed_at", { withTimezone: true, mode: "date" }),
    finalizedAt: timestamp("finalized_at", { withTimezone: true, mode: "date" }),
    creditedAt: timestamp("credited_at", { withTimezone: true, mode: "date" }),
    exceptionCode: text("exception_code").$type<DepositExceptionCode>(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull()
  },
  (table) => [
    uniqueIndex("deposit_intents_reference_unique").on(table.reference),
    uniqueIndex("deposit_intents_transaction_hash_unique").on(table.transactionHash),
    index("deposit_intents_membership_state_idx").on(table.membershipId, table.state),
    index("deposit_intents_state_expiry_idx").on(table.state, table.expiresAt)
  ]
);

export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: uuid("id").primaryKey(),
    idempotencyKey: text("idempotency_key").notNull(),
    podId: uuid("pod_id")
      .notNull()
      .references(() => pods.id, { onDelete: "cascade" }),
    membershipId: uuid("membership_id").references(() => memberships.id, {
      onDelete: "restrict"
    }),
    depositIntentId: uuid("deposit_intent_id").references(() => depositIntents.id, {
      onDelete: "restrict"
    }),
    movementType: text("movement_type").$type<LedgerMovementType>().notNull(),
    debitAccount: text("debit_account").notNull(),
    creditAccount: text("credit_account").notNull(),
    amountLuna: bigint("amount_luna", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull()
  },
  (table) => [
    uniqueIndex("ledger_entries_idempotency_unique").on(table.idempotencyKey),
    index("ledger_entries_deposit_idx").on(table.depositIntentId, table.createdAt),
    index("ledger_entries_membership_idx").on(table.membershipId, table.createdAt)
  ]
);
