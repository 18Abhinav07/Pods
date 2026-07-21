CREATE TABLE "occurrence_commitments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"occurrence_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"task" text NOT NULL,
	"deliverable_type" text NOT NULL,
	"locked_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_decisions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"submission_id" uuid NOT NULL,
	"action" text NOT NULL,
	"reviewer_id" text NOT NULL,
	"reason_code" text NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"occurrence_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"commitment_id" uuid NOT NULL,
	"state" text NOT NULL,
	"result_summary" text NOT NULL,
	"artifact_url" text NOT NULL,
	"evidence_object_key" text,
	"evidence_content_type" text,
	"evidence_byte_size" integer,
	"submitted_at" timestamp with time zone,
	"review_target_at" timestamp with time zone,
	"review_hard_deadline_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "occurrences" ADD COLUMN "state" text DEFAULT 'scheduled' NOT NULL;--> statement-breakpoint
ALTER TABLE "occurrence_commitments" ADD CONSTRAINT "occurrence_commitments_occurrence_id_occurrences_id_fk" FOREIGN KEY ("occurrence_id") REFERENCES "public"."occurrences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "occurrence_commitments" ADD CONSTRAINT "occurrence_commitments_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_decisions" ADD CONSTRAINT "review_decisions_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_occurrence_id_occurrences_id_fk" FOREIGN KEY ("occurrence_id") REFERENCES "public"."occurrences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_commitment_id_occurrence_commitments_id_fk" FOREIGN KEY ("commitment_id") REFERENCES "public"."occurrence_commitments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "occurrence_commitments_occurrence_membership_unique" ON "occurrence_commitments" USING btree ("occurrence_id","membership_id");--> statement-breakpoint
CREATE INDEX "occurrence_commitments_membership_idx" ON "occurrence_commitments" USING btree ("membership_id","locked_at");--> statement-breakpoint
CREATE UNIQUE INDEX "review_decisions_submission_action_unique" ON "review_decisions" USING btree ("submission_id","action");--> statement-breakpoint
CREATE INDEX "review_decisions_reviewer_created_idx" ON "review_decisions" USING btree ("reviewer_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "submissions_occurrence_membership_unique" ON "submissions" USING btree ("occurrence_id","membership_id");--> statement-breakpoint
CREATE INDEX "submissions_state_review_idx" ON "submissions" USING btree ("state","review_target_at");--> statement-breakpoint
CREATE INDEX "submissions_membership_updated_idx" ON "submissions" USING btree ("membership_id","updated_at");