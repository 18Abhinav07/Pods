CREATE TABLE "transfer_legs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"idempotency_key" text NOT NULL,
	"pod_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"deposit_intent_id" uuid NOT NULL,
	"type" text NOT NULL,
	"recipient_wallet" text NOT NULL,
	"amount_luna" bigint NOT NULL,
	"network" text NOT NULL,
	"state" text NOT NULL,
	"raw_transaction_hex" text,
	"transaction_hash" text,
	"validity_start_height" integer,
	"prepared_at" timestamp with time zone,
	"broadcast_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"last_attempt_at" timestamp with time zone,
	"error_code" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transfer_legs" ADD CONSTRAINT "transfer_legs_pod_id_pods_id_fk" FOREIGN KEY ("pod_id") REFERENCES "public"."pods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_legs" ADD CONSTRAINT "transfer_legs_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_legs" ADD CONSTRAINT "transfer_legs_deposit_intent_id_deposit_intents_id_fk" FOREIGN KEY ("deposit_intent_id") REFERENCES "public"."deposit_intents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "transfer_legs_idempotency_unique" ON "transfer_legs" USING btree ("idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "transfer_legs_transaction_hash_unique" ON "transfer_legs" USING btree ("transaction_hash");--> statement-breakpoint
CREATE INDEX "transfer_legs_pod_state_idx" ON "transfer_legs" USING btree ("pod_id","state");--> statement-breakpoint
CREATE INDEX "transfer_legs_membership_idx" ON "transfer_legs" USING btree ("membership_id","created_at");