CREATE TABLE "clock_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"previous_time" timestamp with time zone NOT NULL,
	"effective_time" timestamp with time zone NOT NULL,
	"reason" text NOT NULL,
	"actor" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "clock_events_effective_time_unique" ON "clock_events" USING btree ("effective_time");--> statement-breakpoint
CREATE INDEX "clock_events_actor_time_idx" ON "clock_events" USING btree ("actor","effective_time");