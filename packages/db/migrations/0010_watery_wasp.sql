ALTER TABLE "applications" ADD COLUMN "accepted_contract_hash" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "visitor_disclosure_accepted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "memberships" ADD COLUMN "accepted_contract_hash" text;--> statement-breakpoint
ALTER TABLE "pods" ADD COLUMN "creator_consent_contract_hash" text;--> statement-breakpoint
ALTER TABLE "pods" ADD COLUMN "creator_consent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pods" ADD COLUMN "public_room_suspended_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pods" ADD COLUMN "completed_at" timestamp with time zone;