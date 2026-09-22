ALTER TABLE "restaurants" ADD COLUMN "public_share_token" text;--> statement-breakpoint
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_public_share_token_unique" UNIQUE("public_share_token");