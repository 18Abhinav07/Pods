CREATE TABLE "activity_messages" (
	"commitment_id" uuid PRIMARY KEY NOT NULL,
	"message_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "proof_share_mode" text DEFAULT 'reviewer_only' NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_messages" ADD CONSTRAINT "activity_messages_commitment_id_occurrence_commitments_id_fk" FOREIGN KEY ("commitment_id") REFERENCES "public"."occurrence_commitments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_messages" ADD CONSTRAINT "activity_messages_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "activity_messages_message_unique" ON "activity_messages" USING btree ("message_id");