ALTER TABLE "occurrence_commitments" ALTER COLUMN "deliverable_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "occurrence_commitments" ADD COLUMN "kind" text DEFAULT 'build' NOT NULL;--> statement-breakpoint
ALTER TABLE "occurrence_commitments" ADD COLUMN "details" jsonb;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "template_evidence" jsonb;