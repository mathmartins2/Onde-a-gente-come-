ALTER TABLE "vetoes" ALTER COLUMN "nomination_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "vetoes" ADD COLUMN "restaurant_id" uuid;--> statement-breakpoint
ALTER TABLE "vetoes" ADD CONSTRAINT "vetoes_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;