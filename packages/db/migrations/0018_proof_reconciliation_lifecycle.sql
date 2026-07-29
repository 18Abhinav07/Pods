CREATE TABLE "evidence_upload_reservations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"occurrence_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"commitment_id" uuid NOT NULL,
	"state" text NOT NULL,
	"evidence_digest" text NOT NULL,
	"expected_media_sha256" text,
	"object_key" text,
	"content_type" text,
	"byte_size" integer,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proof_cases" (
	"id" uuid PRIMARY KEY NOT NULL,
	"submission_id" uuid NOT NULL,
	"stage" text NOT NULL,
	"clarification_used" boolean DEFAULT false NOT NULL,
	"appeal_used" boolean DEFAULT false NOT NULL,
	"resolution" text,
	"shared_with_pod_at" timestamp with time zone,
	"stage_entered_at" timestamp with time zone NOT NULL,
	"stage_deadline_at" timestamp with time zone NOT NULL,
	"absolute_deadline_at" timestamp with time zone NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "proof_cases_version_nonnegative" CHECK ("proof_cases"."version" >= 0),
	CONSTRAINT "proof_cases_resolution_stage_check" CHECK (("proof_cases"."stage" = 'resolved' AND "proof_cases"."resolution" IS NOT NULL) OR ("proof_cases"."stage" <> 'resolved' AND "proof_cases"."resolution" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "proof_review_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"case_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"type" text NOT NULL,
	"actor" text NOT NULL,
	"actor_user_id" uuid,
	"payload" jsonb NOT NULL,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proof_submission_versions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"case_id" uuid NOT NULL,
	"submission_id" uuid NOT NULL,
	"ordinal" integer NOT NULL,
	"kind" text NOT NULL,
	"result_summary" text NOT NULL,
	"artifact_url" text NOT NULL,
	"template_evidence" jsonb,
	"evidence_object_key" text,
	"evidence_content_type" text,
	"evidence_byte_size" integer,
	"proof_share_mode" text NOT NULL,
	"evidence_digest" text NOT NULL,
	"media_sha256" text,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "proof_submission_versions_ordinal_positive" CHECK ("proof_submission_versions"."ordinal" > 0)
);
--> statement-breakpoint
ALTER TABLE "occurrence_commitments" ADD COLUMN "recovery_of_submission_id" uuid;--> statement-breakpoint
ALTER TABLE "evidence_upload_reservations" ADD CONSTRAINT "evidence_upload_reservations_occurrence_id_occurrences_id_fk" FOREIGN KEY ("occurrence_id") REFERENCES "public"."occurrences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_upload_reservations" ADD CONSTRAINT "evidence_upload_reservations_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_upload_reservations" ADD CONSTRAINT "evidence_upload_reservations_commitment_id_occurrence_commitments_id_fk" FOREIGN KEY ("commitment_id") REFERENCES "public"."occurrence_commitments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proof_cases" ADD CONSTRAINT "proof_cases_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proof_review_events" ADD CONSTRAINT "proof_review_events_case_id_proof_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."proof_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proof_review_events" ADD CONSTRAINT "proof_review_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proof_submission_versions" ADD CONSTRAINT "proof_submission_versions_case_id_proof_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."proof_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proof_submission_versions" ADD CONSTRAINT "proof_submission_versions_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proof_submission_versions" ADD CONSTRAINT "proof_submission_versions_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "evidence_upload_reservations_occurrence_member_unique" ON "evidence_upload_reservations" USING btree ("occurrence_id","membership_id");--> statement-breakpoint
CREATE INDEX "evidence_upload_reservations_expiry_idx" ON "evidence_upload_reservations" USING btree ("state","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "proof_cases_submission_unique" ON "proof_cases" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "proof_cases_stage_deadline_idx" ON "proof_cases" USING btree ("stage","stage_deadline_at");--> statement-breakpoint
CREATE INDEX "proof_cases_absolute_deadline_idx" ON "proof_cases" USING btree ("absolute_deadline_at","id");--> statement-breakpoint
CREATE UNIQUE INDEX "proof_review_events_case_sequence_unique" ON "proof_review_events" USING btree ("case_id","sequence");--> statement-breakpoint
CREATE UNIQUE INDEX "proof_review_events_idempotency_unique" ON "proof_review_events" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "proof_review_events_case_created_idx" ON "proof_review_events" USING btree ("case_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "proof_submission_versions_case_ordinal_unique" ON "proof_submission_versions" USING btree ("case_id","ordinal");--> statement-breakpoint
CREATE INDEX "proof_submission_versions_submission_idx" ON "proof_submission_versions" USING btree ("submission_id","ordinal");--> statement-breakpoint
ALTER TABLE "occurrence_commitments" ADD CONSTRAINT "occurrence_commitments_recovery_of_submission_id_submissions_id_fk" FOREIGN KEY ("recovery_of_submission_id") REFERENCES "public"."submissions"("id") ON DELETE set null ON UPDATE no action;