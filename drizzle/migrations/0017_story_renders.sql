CREATE TABLE "story_renders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visit_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"fingerprint" text NOT NULL,
	"status" text NOT NULL,
	"image_key" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "story_renders_visit_kind_unique" UNIQUE("visit_id","kind")
);
--> statement-breakpoint
ALTER TABLE "story_renders" ADD CONSTRAINT "story_renders_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;