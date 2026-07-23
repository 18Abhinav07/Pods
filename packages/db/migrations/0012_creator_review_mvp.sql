DROP INDEX "review_decisions_submission_action_unique";--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
UPDATE "submissions"
SET "reviewed_at" = COALESCE(
  "submissions"."approved_at",
  "review_decisions"."created_at",
  "submissions"."updated_at"
)
FROM "review_decisions"
WHERE "review_decisions"."submission_id" = "submissions"."id"
  AND "submissions"."reviewed_at" IS NULL;--> statement-breakpoint
UPDATE "review_decisions"
SET "reason_code" = 'meets_commitment'
WHERE "reason_code" = 'meets_frozen_commitment';--> statement-breakpoint
CREATE UNIQUE INDEX "review_decisions_submission_unique" ON "review_decisions" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "submissions_state_hard_deadline_idx" ON "submissions" USING btree ("state","review_hard_deadline_at","id");
