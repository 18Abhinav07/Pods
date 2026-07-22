import type {
  AdmissionSource,
  ApplicationAnswer,
  ApplicationStatus,
  ActivityStepInput,
  BuildDeliverableType,
  CommitmentStepInput,
  CommunityStepInput,
  DepositExceptionCode,
  DepositState,
  FundingNetwork,
  LedgerMovementType,
  MembershipState,
  PublishedPodContract,
  SubmissionState,
  TemplateId,
  TransferLegState
} from "@pods/domain";
import type {
  ConversationKind,
  DirectConversationState,
  DmPolicy,
  FriendRequestState,
  MessageKind,
  ProfileAvatar,
  ProfileVisibility,
  ProofShareMode,
  ReactionCode,
  ReportReason,
  RoomState
} from "@pods/domain";
import {
  bigint,
  bigserial,
  boolean,
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

export const profiles = pgTable(
  "profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    handle: text("handle").notNull(),
    displayName: text("display_name").notNull(),
    bio: text("bio").notNull(),
    avatar: jsonb("avatar").$type<ProfileAvatar>().notNull(),
    visibility: text("visibility").$type<ProfileVisibility>().notNull(),
    dmPolicy: text("dm_policy").$type<DmPolicy>().notNull(),
    activityStatusVisible: boolean("activity_status_visible").notNull(),
    onboardingCompletedAt: timestamp("onboarding_completed_at", {
      withTimezone: true,
      mode: "date"
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull()
  },
  (table) => [
    uniqueIndex("profiles_handle_unique").on(table.handle),
    index("profiles_visibility_updated_idx").on(table.visibility, table.updatedAt)
  ]
);

export const userFollows = pgTable(
  "user_follows",
  {
    followerUserId: uuid("follower_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followedUserId: uuid("followed_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull()
  },
  (table) => [
    primaryKey({ columns: [table.followerUserId, table.followedUserId] }),
    index("user_follows_followed_idx").on(table.followedUserId, table.createdAt)
  ]
);

export const friendRequests = pgTable(
  "friend_requests",
  {
    id: uuid("id").primaryKey(),
    senderUserId: uuid("sender_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recipientUserId: uuid("recipient_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    state: text("state").$type<FriendRequestState>().notNull(),
    decidedAt: timestamp("decided_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull()
  },
  (table) => [
    uniqueIndex("friend_requests_direction_unique").on(
      table.senderUserId,
      table.recipientUserId
    ),
    index("friend_requests_recipient_state_idx").on(
      table.recipientUserId,
      table.state,
      table.updatedAt
    )
  ]
);

export const friendships = pgTable(
  "friendships",
  {
    firstUserId: uuid("first_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    secondUserId: uuid("second_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull()
  },
  (table) => [
    primaryKey({ columns: [table.firstUserId, table.secondUserId] }),
    index("friendships_second_user_idx").on(table.secondUserId, table.createdAt)
  ]
);

export const userBlocks = pgTable(
  "user_blocks",
  {
    blockerUserId: uuid("blocker_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    blockedUserId: uuid("blocked_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull()
  },
  (table) => [primaryKey({ columns: [table.blockerUserId, table.blockedUserId] })]
);

export const userReports = pgTable(
  "user_reports",
  {
    id: uuid("id").primaryKey(),
    reporterUserId: uuid("reporter_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reportedUserId: uuid("reported_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason").$type<ReportReason>().notNull(),
    details: text("details").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull()
  },
  (table) => [index("user_reports_reported_created_idx").on(table.reportedUserId, table.createdAt)]
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    readAt: timestamp("read_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull()
  },
  (table) => [index("notifications_user_created_idx").on(table.userId, table.createdAt)]
);

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
    }),
    state: text("state")
      .$type<"scheduled" | "commitment_open" | "evidence_open" | "review_open">()
      .notNull()
      .default("scheduled")
  },
  (table) => [
    uniqueIndex("occurrences_pod_ordinal_unique").on(table.podId, table.ordinal),
    index("occurrences_pod_window_idx").on(table.podId, table.opensAt)
  ]
);

export const occurrenceCommitments = pgTable(
  "occurrence_commitments",
  {
    id: uuid("id").primaryKey(),
    occurrenceId: uuid("occurrence_id")
      .notNull()
      .references(() => occurrences.id, { onDelete: "cascade" }),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    task: text("task").notNull(),
    deliverableType: text("deliverable_type").$type<BuildDeliverableType>().notNull(),
    lockedAt: timestamp("locked_at", { withTimezone: true, mode: "date" }).notNull()
  },
  (table) => [
    uniqueIndex("occurrence_commitments_occurrence_membership_unique").on(
      table.occurrenceId,
      table.membershipId
    ),
    index("occurrence_commitments_membership_idx").on(table.membershipId, table.lockedAt)
  ]
);

export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").primaryKey(),
    occurrenceId: uuid("occurrence_id")
      .notNull()
      .references(() => occurrences.id, { onDelete: "cascade" }),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    commitmentId: uuid("commitment_id")
      .notNull()
      .references(() => occurrenceCommitments.id, { onDelete: "restrict" }),
    state: text("state").$type<SubmissionState>().notNull(),
    resultSummary: text("result_summary").notNull(),
    artifactUrl: text("artifact_url").notNull(),
    evidenceObjectKey: text("evidence_object_key"),
    evidenceContentType: text("evidence_content_type"),
    evidenceByteSize: integer("evidence_byte_size"),
    proofShareMode: text("proof_share_mode")
      .$type<ProofShareMode>()
      .notNull()
      .default("reviewer_only"),
    submittedAt: timestamp("submitted_at", { withTimezone: true, mode: "date" }),
    reviewTargetAt: timestamp("review_target_at", { withTimezone: true, mode: "date" }),
    reviewHardDeadlineAt: timestamp("review_hard_deadline_at", {
      withTimezone: true,
      mode: "date"
    }),
    approvedAt: timestamp("approved_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull()
  },
  (table) => [
    uniqueIndex("submissions_occurrence_membership_unique").on(
      table.occurrenceId,
      table.membershipId
    ),
    index("submissions_state_review_idx").on(table.state, table.reviewTargetAt),
    index("submissions_membership_updated_idx").on(table.membershipId, table.updatedAt)
  ]
);

export const reviewDecisions = pgTable(
  "review_decisions",
  {
    id: uuid("id").primaryKey(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    action: text("action").$type<"approved">().notNull(),
    reviewerId: text("reviewer_id").notNull(),
    reasonCode: text("reason_code").$type<"meets_frozen_commitment">().notNull(),
    note: text("note").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull()
  },
  (table) => [
    uniqueIndex("review_decisions_submission_action_unique").on(
      table.submissionId,
      table.action
    ),
    index("review_decisions_reviewer_created_idx").on(table.reviewerId, table.createdAt)
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
    targetUserId: uuid("target_user_id").references(() => users.id, {
      onDelete: "cascade"
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull()
  },
  (table) => [
    uniqueIndex("invitations_token_hash_unique").on(table.tokenHash),
    index("invitations_pod_expiry_idx").on(table.podId, table.expiresAt),
    index("invitations_target_expiry_idx").on(table.targetUserId, table.expiresAt)
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

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey(),
    kind: text("kind").$type<ConversationKind>().notNull(),
    podId: uuid("pod_id").references(() => pods.id, { onDelete: "cascade" }),
    directPairKey: text("direct_pair_key"),
    firstUserId: uuid("first_user_id").references(() => users.id, { onDelete: "cascade" }),
    secondUserId: uuid("second_user_id").references(() => users.id, { onDelete: "cascade" }),
    requestSenderUserId: uuid("request_sender_user_id").references(() => users.id, {
      onDelete: "cascade"
    }),
    directState: text("direct_state").$type<DirectConversationState>(),
    roomState: text("room_state").$type<RoomState>().notNull().default("open"),
    lastSequence: integer("last_sequence").notNull().default(0),
    archivedAt: timestamp("archived_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull()
  },
  (table) => [
    uniqueIndex("conversations_pod_unique").on(table.podId),
    uniqueIndex("conversations_direct_pair_unique").on(table.directPairKey),
    index("conversations_first_user_idx").on(table.firstUserId, table.updatedAt),
    index("conversations_second_user_idx").on(table.secondUserId, table.updatedAt)
  ]
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    sequence: integer("sequence").notNull(),
    senderUserId: uuid("sender_user_id").references(() => users.id, {
      onDelete: "set null"
    }),
    kind: text("kind").$type<MessageKind>().notNull(),
    body: text("body").notNull(),
    clientMessageId: uuid("client_message_id"),
    replyToMessageId: uuid("reply_to_message_id"),
    hiddenAt: timestamp("hidden_at", { withTimezone: true, mode: "date" }),
    hiddenByUserId: uuid("hidden_by_user_id").references(() => users.id, {
      onDelete: "set null"
    }),
    editedAt: timestamp("edited_at", { withTimezone: true, mode: "date" }),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
    pinnedAt: timestamp("pinned_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull()
  },
  (table) => [
    uniqueIndex("messages_conversation_sequence_unique").on(
      table.conversationId,
      table.sequence
    ),
    uniqueIndex("messages_client_retry_unique").on(
      table.conversationId,
      table.senderUserId,
      table.clientMessageId
    ),
    index("messages_conversation_created_idx").on(table.conversationId, table.createdAt),
    index("messages_reply_idx").on(table.replyToMessageId)
  ]
);

export const activityMessages = pgTable(
  "activity_messages",
  {
    commitmentId: uuid("commitment_id")
      .primaryKey()
      .references(() => occurrenceCommitments.id, { onDelete: "cascade" }),
    messageId: uuid("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull()
  },
  (table) => [uniqueIndex("activity_messages_message_unique").on(table.messageId)]
);

export const messageReactions = pgTable(
  "message_reactions",
  {
    messageId: uuid("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    code: text("code").$type<ReactionCode>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull()
  },
  (table) => [
    primaryKey({ columns: [table.messageId, table.userId] }),
    index("message_reactions_message_idx").on(table.messageId, table.code)
  ]
);

export const conversationReads = pgTable(
  "conversation_reads",
  {
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lastReadSequence: integer("last_read_sequence").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull()
  },
  (table) => [
    primaryKey({ columns: [table.conversationId, table.userId] }),
    index("conversation_reads_user_idx").on(table.userId, table.updatedAt)
  ]
);

export const realtimeEvents = pgTable(
  "realtime_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    conversationId: uuid("conversation_id").references(() => conversations.id, {
      onDelete: "cascade"
    }),
    recipientUserId: uuid("recipient_user_id").references(() => users.id, {
      onDelete: "cascade"
    }),
    kind: text("kind").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull()
  },
  (table) => [
    index("realtime_events_conversation_id_idx").on(table.conversationId, table.id),
    index("realtime_events_recipient_id_idx").on(table.recipientUserId, table.id)
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

export const clockEvents = pgTable(
  "clock_events",
  {
    id: uuid("id").primaryKey(),
    previousTime: timestamp("previous_time", { withTimezone: true, mode: "date" }).notNull(),
    effectiveTime: timestamp("effective_time", { withTimezone: true, mode: "date" }).notNull(),
    reason: text("reason").notNull(),
    actor: text("actor").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull()
  },
  (table) => [
    uniqueIndex("clock_events_effective_time_unique").on(table.effectiveTime),
    index("clock_events_actor_time_idx").on(table.actor, table.effectiveTime)
  ]
);

export const transferLegs = pgTable(
  "transfer_legs",
  {
    id: uuid("id").primaryKey(),
    idempotencyKey: text("idempotency_key").notNull(),
    podId: uuid("pod_id")
      .notNull()
      .references(() => pods.id, { onDelete: "cascade" }),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "restrict" }),
    depositIntentId: uuid("deposit_intent_id")
      .notNull()
      .references(() => depositIntents.id, { onDelete: "restrict" }),
    type: text("type").$type<"refund">().notNull(),
    recipientWallet: text("recipient_wallet").notNull(),
    amountLuna: bigint("amount_luna", { mode: "number" }).notNull(),
    network: text("network").$type<FundingNetwork>().notNull(),
    state: text("state").$type<TransferLegState>().notNull(),
    rawTransactionHex: text("raw_transaction_hex"),
    transactionHash: text("transaction_hash"),
    validityStartHeight: integer("validity_start_height"),
    preparedAt: timestamp("prepared_at", { withTimezone: true, mode: "date" }),
    broadcastAt: timestamp("broadcast_at", { withTimezone: true, mode: "date" }),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true, mode: "date" }),
    lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true, mode: "date" }),
    errorCode: text("error_code"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull()
  },
  (table) => [
    uniqueIndex("transfer_legs_idempotency_unique").on(table.idempotencyKey),
    uniqueIndex("transfer_legs_transaction_hash_unique").on(table.transactionHash),
    index("transfer_legs_pod_state_idx").on(table.podId, table.state),
    index("transfer_legs_membership_idx").on(table.membershipId, table.createdAt)
  ]
);
