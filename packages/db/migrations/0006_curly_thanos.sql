CREATE TABLE "profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"handle" text NOT NULL,
	"display_name" text NOT NULL,
	"bio" text NOT NULL,
	"avatar" jsonb NOT NULL,
	"visibility" text NOT NULL,
	"dm_policy" text NOT NULL,
	"activity_status_visible" boolean NOT NULL,
	"onboarding_completed_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_handle_unique" ON "profiles" USING btree ("handle");--> statement-breakpoint
CREATE INDEX "profiles_visibility_updated_idx" ON "profiles" USING btree ("visibility","updated_at");