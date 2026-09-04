ALTER TABLE "ratings" ALTER COLUMN "score" SET DATA TYPE numeric(3, 2);--> statement-breakpoint
ALTER TABLE "ratings" ADD COLUMN "flavor_score" numeric(3, 1);--> statement-breakpoint
ALTER TABLE "ratings" ADD COLUMN "price_score" numeric(3, 1);--> statement-breakpoint
ALTER TABLE "ratings" ADD COLUMN "service_score" numeric(3, 1);--> statement-breakpoint
ALTER TABLE "ratings" ADD COLUMN "ambience_score" numeric(3, 1);