ALTER TABLE "draw_sessions" ADD COLUMN "drawn_by_member_id" uuid;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "visit_date_confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "draw_sessions" ADD CONSTRAINT "draw_sessions_drawn_by_member_id_members_id_fk" FOREIGN KEY ("drawn_by_member_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;