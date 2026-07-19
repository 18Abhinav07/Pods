CREATE TABLE "occurrences" (
	"id" uuid PRIMARY KEY NOT NULL,
	"pod_id" uuid NOT NULL,
	"ordinal" integer NOT NULL,
	"local_date" date NOT NULL,
	"opens_at" timestamp with time zone NOT NULL,
	"closes_at" timestamp with time zone NOT NULL,
	"commitment_deadline_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pods" (
	"id" uuid PRIMARY KEY NOT NULL,
	"creator_user_id" uuid NOT NULL,
	"state" text NOT NULL,
	"template_id" text NOT NULL,
	"draft_data" jsonb NOT NULL,
	"contract_data" jsonb,
	"contract_hash" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"token_hash" text NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "sessions_token_hash_pk" PRIMARY KEY("token_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"wallet_address" text NOT NULL,
	"public_key" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "users_wallet_address_unique" UNIQUE("wallet_address")
);
--> statement-breakpoint
CREATE TABLE "wallet_challenges" (
	"id" uuid PRIMARY KEY NOT NULL,
	"wallet_address" text NOT NULL,
	"message" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "occurrences" ADD CONSTRAINT "occurrences_pod_id_pods_id_fk" FOREIGN KEY ("pod_id") REFERENCES "public"."pods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pods" ADD CONSTRAINT "pods_creator_user_id_users_id_fk" FOREIGN KEY ("creator_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "occurrences_pod_ordinal_unique" ON "occurrences" USING btree ("pod_id","ordinal");--> statement-breakpoint
CREATE INDEX "occurrences_pod_window_idx" ON "occurrences" USING btree ("pod_id","opens_at");--> statement-breakpoint
CREATE INDEX "pods_creator_state_idx" ON "pods" USING btree ("creator_user_id","state");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "wallet_challenges_wallet_idx" ON "wallet_challenges" USING btree ("wallet_address");