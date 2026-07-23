CREATE TABLE "public_content_reports" (
	"id" uuid PRIMARY KEY NOT NULL,
	"reporter_user_id" uuid NOT NULL,
	"pod_id" uuid NOT NULL,
	"target_kind" text NOT NULL,
	"target_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"details" text NOT NULL,
	"state" text NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "public_content_suppressions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"pod_id" uuid NOT NULL,
	"target_kind" text NOT NULL,
	"target_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"actioned_by" text NOT NULL,
	"restored_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "public_moderation_actions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"report_id" uuid,
	"pod_id" uuid NOT NULL,
	"target_kind" text,
	"target_id" uuid,
	"action" text NOT NULL,
	"actor" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "public_rate_limit_buckets" (
	"id" text PRIMARY KEY NOT NULL,
	"bucket_key" text NOT NULL,
	"action" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "public_content_reports" ADD CONSTRAINT "public_content_reports_reporter_user_id_users_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_content_reports" ADD CONSTRAINT "public_content_reports_pod_id_pods_id_fk" FOREIGN KEY ("pod_id") REFERENCES "public"."pods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_content_suppressions" ADD CONSTRAINT "public_content_suppressions_pod_id_pods_id_fk" FOREIGN KEY ("pod_id") REFERENCES "public"."pods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_moderation_actions" ADD CONSTRAINT "public_moderation_actions_report_id_public_content_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."public_content_reports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_moderation_actions" ADD CONSTRAINT "public_moderation_actions_pod_id_pods_id_fk" FOREIGN KEY ("pod_id") REFERENCES "public"."pods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "public_content_reports_state_created_idx" ON "public_content_reports" USING btree ("state","created_at");--> statement-breakpoint
CREATE INDEX "public_content_reports_pod_created_idx" ON "public_content_reports" USING btree ("pod_id","created_at");--> statement-breakpoint
CREATE INDEX "public_content_reports_reporter_created_idx" ON "public_content_reports" USING btree ("reporter_user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "public_content_suppressions_target_unique" ON "public_content_suppressions" USING btree ("pod_id","target_kind","target_id");--> statement-breakpoint
CREATE INDEX "public_content_suppressions_active_idx" ON "public_content_suppressions" USING btree ("pod_id","restored_at");--> statement-breakpoint
CREATE INDEX "public_moderation_actions_pod_created_idx" ON "public_moderation_actions" USING btree ("pod_id","created_at");--> statement-breakpoint
CREATE INDEX "public_moderation_actions_report_created_idx" ON "public_moderation_actions" USING btree ("report_id","created_at");--> statement-breakpoint
CREATE INDEX "public_rate_limit_buckets_expiry_idx" ON "public_rate_limit_buckets" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "public_rate_limit_buckets_key_action_idx" ON "public_rate_limit_buckets" USING btree ("bucket_key","action");