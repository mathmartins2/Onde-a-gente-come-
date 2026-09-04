ALTER TABLE "rating_drafts" ADD COLUMN "wait_time_score" numeric(3, 1);--> statement-breakpoint
ALTER TABLE "ratings" ADD COLUMN "wait_time_score" numeric(3, 1);