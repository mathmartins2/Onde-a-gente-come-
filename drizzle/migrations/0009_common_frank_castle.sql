CREATE TABLE "rating_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visit_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"flavor_score" numeric(3, 1),
	"price_score" numeric(3, 1),
	"service_score" numeric(3, 1),
	"ambience_score" numeric(3, 1),
	"comment" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rating_drafts_visit_member_unique" UNIQUE("visit_id","member_id")
);
--> statement-breakpoint
ALTER TABLE "rating_drafts" ADD CONSTRAINT "rating_drafts_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_drafts" ADD CONSTRAINT "rating_drafts_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;