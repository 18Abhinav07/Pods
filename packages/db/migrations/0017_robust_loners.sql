CREATE TABLE "pod_verifier_overrides" (
	"pod_id" uuid PRIMARY KEY NOT NULL,
	"contract_hash" text NOT NULL,
	"creator_user_id" uuid NOT NULL,
	"network" text NOT NULL,
	"from_verifier" text NOT NULL,
	"to_verifier" text NOT NULL,
	"actor" text NOT NULL,
	"reason" text NOT NULL,
	"effective_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "pod_verifier_overrides_testnet_check" CHECK ("pod_verifier_overrides"."network" = 'testnet'),
	CONSTRAINT "pod_verifier_overrides_direction_check" CHECK ("pod_verifier_overrides"."from_verifier" = 'pods_team' AND "pod_verifier_overrides"."to_verifier" = 'creator'),
	CONSTRAINT "pod_verifier_overrides_actor_reason_check" CHECK (length(trim("pod_verifier_overrides"."actor")) > 0 AND length(trim("pod_verifier_overrides"."reason")) > 0)
);
--> statement-breakpoint
ALTER TABLE "pod_verifier_overrides" ADD CONSTRAINT "pod_verifier_overrides_pod_id_pods_id_fk" FOREIGN KEY ("pod_id") REFERENCES "public"."pods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pod_verifier_overrides" ADD CONSTRAINT "pod_verifier_overrides_creator_user_id_users_id_fk" FOREIGN KEY ("creator_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pod_verifier_overrides_creator_effective_idx" ON "pod_verifier_overrides" USING btree ("creator_user_id","effective_at");