CREATE TABLE "settlement_entitlements" (
	"id" uuid PRIMARY KEY NOT NULL,
	"settlement_run_id" uuid NOT NULL,
	"pod_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"deposit_intent_id" uuid NOT NULL,
	"state" text NOT NULL,
	"deposit_luna" bigint NOT NULL,
	"principal_luna" bigint NOT NULL,
	"provisional_forfeiture_luna" bigint NOT NULL,
	"restoration_luna" bigint NOT NULL,
	"bonus_luna" bigint NOT NULL,
	"payout_luna" bigint NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settlement_occurrences" (
	"id" uuid PRIMARY KEY NOT NULL,
	"settlement_run_id" uuid NOT NULL,
	"pod_id" uuid NOT NULL,
	"occurrence_id" uuid NOT NULL,
	"ordinal" integer NOT NULL,
	"state" text NOT NULL,
	"forfeiture_pool_luna" bigint NOT NULL,
	"bonus_recipient_count" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settlement_outcomes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"settlement_run_id" uuid NOT NULL,
	"settlement_occurrence_id" uuid NOT NULL,
	"pod_id" uuid NOT NULL,
	"occurrence_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"deposit_intent_id" uuid NOT NULL,
	"source_submission_id" uuid,
	"state" text NOT NULL,
	"principal_luna" bigint NOT NULL,
	"provisional_forfeiture_luna" bigint NOT NULL,
	"restoration_luna" bigint NOT NULL,
	"bonus_luna" bigint NOT NULL,
	"payout_luna" bigint NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settlement_runs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"pod_id" uuid NOT NULL,
	"contract_hash" text NOT NULL,
	"calculator_version" integer NOT NULL,
	"input_digest" text NOT NULL,
	"state" text NOT NULL,
	"total_deposit_luna" bigint NOT NULL,
	"total_payout_luna" bigint NOT NULL,
	"finalized_at" timestamp with time zone NOT NULL,
	"settled_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transfer_attempts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"transfer_leg_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"state" text NOT NULL,
	"data_reference" text NOT NULL,
	"raw_transaction_hex" text NOT NULL,
	"transaction_hash" text NOT NULL,
	"validity_start_height" integer NOT NULL,
	"prepared_at" timestamp with time zone NOT NULL,
	"broadcast_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"last_checked_at" timestamp with time zone,
	"error_code" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transfer_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"transfer_leg_id" uuid NOT NULL,
	"transfer_attempt_id" uuid,
	"actor" text NOT NULL,
	"from_state" text,
	"to_state" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transfer_legs" ADD COLUMN "settlement_entitlement_id" uuid;--> statement-breakpoint
ALTER TABLE "settlement_entitlements" ADD CONSTRAINT "settlement_entitlements_settlement_run_id_settlement_runs_id_fk" FOREIGN KEY ("settlement_run_id") REFERENCES "public"."settlement_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_entitlements" ADD CONSTRAINT "settlement_entitlements_pod_id_pods_id_fk" FOREIGN KEY ("pod_id") REFERENCES "public"."pods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_entitlements" ADD CONSTRAINT "settlement_entitlements_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_entitlements" ADD CONSTRAINT "settlement_entitlements_deposit_intent_id_deposit_intents_id_fk" FOREIGN KEY ("deposit_intent_id") REFERENCES "public"."deposit_intents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_occurrences" ADD CONSTRAINT "settlement_occurrences_settlement_run_id_settlement_runs_id_fk" FOREIGN KEY ("settlement_run_id") REFERENCES "public"."settlement_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_occurrences" ADD CONSTRAINT "settlement_occurrences_pod_id_pods_id_fk" FOREIGN KEY ("pod_id") REFERENCES "public"."pods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_occurrences" ADD CONSTRAINT "settlement_occurrences_occurrence_id_occurrences_id_fk" FOREIGN KEY ("occurrence_id") REFERENCES "public"."occurrences"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_outcomes" ADD CONSTRAINT "settlement_outcomes_settlement_run_id_settlement_runs_id_fk" FOREIGN KEY ("settlement_run_id") REFERENCES "public"."settlement_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_outcomes" ADD CONSTRAINT "settlement_outcomes_settlement_occurrence_id_settlement_occurrences_id_fk" FOREIGN KEY ("settlement_occurrence_id") REFERENCES "public"."settlement_occurrences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_outcomes" ADD CONSTRAINT "settlement_outcomes_pod_id_pods_id_fk" FOREIGN KEY ("pod_id") REFERENCES "public"."pods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_outcomes" ADD CONSTRAINT "settlement_outcomes_occurrence_id_occurrences_id_fk" FOREIGN KEY ("occurrence_id") REFERENCES "public"."occurrences"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_outcomes" ADD CONSTRAINT "settlement_outcomes_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_outcomes" ADD CONSTRAINT "settlement_outcomes_deposit_intent_id_deposit_intents_id_fk" FOREIGN KEY ("deposit_intent_id") REFERENCES "public"."deposit_intents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_runs" ADD CONSTRAINT "settlement_runs_pod_id_pods_id_fk" FOREIGN KEY ("pod_id") REFERENCES "public"."pods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_attempts" ADD CONSTRAINT "transfer_attempts_transfer_leg_id_transfer_legs_id_fk" FOREIGN KEY ("transfer_leg_id") REFERENCES "public"."transfer_legs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_events" ADD CONSTRAINT "transfer_events_transfer_leg_id_transfer_legs_id_fk" FOREIGN KEY ("transfer_leg_id") REFERENCES "public"."transfer_legs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "settlement_entitlements_run_membership_unique" ON "settlement_entitlements" USING btree ("settlement_run_id","membership_id");--> statement-breakpoint
CREATE INDEX "settlement_entitlements_pod_state_idx" ON "settlement_entitlements" USING btree ("pod_id","state");--> statement-breakpoint
CREATE UNIQUE INDEX "settlement_occurrences_run_occurrence_unique" ON "settlement_occurrences" USING btree ("settlement_run_id","occurrence_id");--> statement-breakpoint
CREATE INDEX "settlement_occurrences_pod_ordinal_idx" ON "settlement_occurrences" USING btree ("pod_id","ordinal");--> statement-breakpoint
CREATE UNIQUE INDEX "settlement_outcomes_run_occurrence_membership_unique" ON "settlement_outcomes" USING btree ("settlement_run_id","occurrence_id","membership_id");--> statement-breakpoint
CREATE INDEX "settlement_outcomes_membership_idx" ON "settlement_outcomes" USING btree ("membership_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "settlement_runs_pod_unique" ON "settlement_runs" USING btree ("pod_id");--> statement-breakpoint
CREATE INDEX "settlement_runs_state_updated_idx" ON "settlement_runs" USING btree ("state","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "transfer_attempts_leg_sequence_unique" ON "transfer_attempts" USING btree ("transfer_leg_id","sequence");--> statement-breakpoint
CREATE UNIQUE INDEX "transfer_attempts_transaction_hash_unique" ON "transfer_attempts" USING btree ("transaction_hash");--> statement-breakpoint
CREATE INDEX "transfer_attempts_state_updated_idx" ON "transfer_attempts" USING btree ("state","updated_at");--> statement-breakpoint
CREATE INDEX "transfer_events_leg_created_idx" ON "transfer_events" USING btree ("transfer_leg_id","created_at");--> statement-breakpoint
ALTER TABLE "transfer_legs" ADD CONSTRAINT "transfer_legs_settlement_entitlement_id_settlement_entitlements_id_fk" FOREIGN KEY ("settlement_entitlement_id") REFERENCES "public"."settlement_entitlements"("id") ON DELETE restrict ON UPDATE no action;