CREATE TABLE "deposit_intents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"membership_id" uuid NOT NULL,
	"pod_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"wallet_address" text NOT NULL,
	"treasury_address" text NOT NULL,
	"network" text NOT NULL,
	"reference" text NOT NULL,
	"amount_luna" bigint NOT NULL,
	"state" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"transaction_hash" text,
	"observed_from" text,
	"observed_from_type" integer,
	"observed_related_addresses" jsonb,
	"block_number" integer,
	"transaction_index" integer,
	"transaction_batch" integer,
	"observed_at" timestamp with time zone,
	"finalized_at" timestamp with time zone,
	"credited_at" timestamp with time zone,
	"exception_code" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" uuid PRIMARY KEY NOT NULL,
	"idempotency_key" text NOT NULL,
	"pod_id" uuid NOT NULL,
	"membership_id" uuid,
	"deposit_intent_id" uuid,
	"movement_type" text NOT NULL,
	"debit_account" text NOT NULL,
	"credit_account" text NOT NULL,
	"amount_luna" bigint NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "memberships" ADD COLUMN "deposit_intent_id" uuid;--> statement-breakpoint
ALTER TABLE "deposit_intents" ADD CONSTRAINT "deposit_intents_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposit_intents" ADD CONSTRAINT "deposit_intents_pod_id_pods_id_fk" FOREIGN KEY ("pod_id") REFERENCES "public"."pods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposit_intents" ADD CONSTRAINT "deposit_intents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_pod_id_pods_id_fk" FOREIGN KEY ("pod_id") REFERENCES "public"."pods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_deposit_intent_id_deposit_intents_id_fk" FOREIGN KEY ("deposit_intent_id") REFERENCES "public"."deposit_intents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "deposit_intents_reference_unique" ON "deposit_intents" USING btree ("reference");--> statement-breakpoint
CREATE UNIQUE INDEX "deposit_intents_transaction_hash_unique" ON "deposit_intents" USING btree ("transaction_hash");--> statement-breakpoint
CREATE INDEX "deposit_intents_membership_state_idx" ON "deposit_intents" USING btree ("membership_id","state");--> statement-breakpoint
CREATE INDEX "deposit_intents_state_expiry_idx" ON "deposit_intents" USING btree ("state","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ledger_entries_idempotency_unique" ON "ledger_entries" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "ledger_entries_deposit_idx" ON "ledger_entries" USING btree ("deposit_intent_id","created_at");--> statement-breakpoint
CREATE INDEX "ledger_entries_membership_idx" ON "ledger_entries" USING btree ("membership_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_deposit_intent_unique" ON "memberships" USING btree ("deposit_intent_id");