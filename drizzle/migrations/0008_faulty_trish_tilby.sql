ALTER TABLE "draws" ADD COLUMN "fallback_restaurant_id" uuid;--> statement-breakpoint
ALTER TABLE "draws" ADD COLUMN "fallback_member_id" uuid;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "used_fallback" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "draws" ADD CONSTRAINT "draws_fallback_restaurant_id_restaurants_id_fk" FOREIGN KEY ("fallback_restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draws" ADD CONSTRAINT "draws_fallback_member_id_members_id_fk" FOREIGN KEY ("fallback_member_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;