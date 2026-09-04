ALTER TABLE "vetoes" DROP CONSTRAINT "vetoes_member_round_unique";--> statement-breakpoint
ALTER TABLE "draw_sessions" ADD COLUMN "ban_round" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "draw_sessions" ADD COLUMN "ban_runoff_restaurant_ids" jsonb;--> statement-breakpoint
ALTER TABLE "vetoes" ADD COLUMN "ban_round" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "vetoes" ADD CONSTRAINT "vetoes_member_round_unique" UNIQUE("member_id","round_number","ban_round");