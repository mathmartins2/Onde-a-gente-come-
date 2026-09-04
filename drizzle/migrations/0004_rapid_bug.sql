CREATE TABLE "visit_price_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visit_id" uuid NOT NULL,
	"added_by_member_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "visit_price_entries" ADD CONSTRAINT "visit_price_entries_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_price_entries" ADD CONSTRAINT "visit_price_entries_added_by_member_id_members_id_fk" FOREIGN KEY ("added_by_member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;