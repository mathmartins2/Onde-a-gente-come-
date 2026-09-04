CREATE TABLE "authentication_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope" text NOT NULL,
	"identifier" text NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "authentication_attempts_unique" UNIQUE("scope","identifier")
);
--> statement-breakpoint
CREATE TABLE "draws" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"round_number" integer NOT NULL,
	"winner_member_id" uuid NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"nomination_id" uuid,
	"weight_snapshot" jsonb NOT NULL,
	"drawn_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "draws_round_number_unique" UNIQUE("round_number")
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"display_name" text NOT NULL,
	"password_hash" text NOT NULL,
	"rating_pin_hash" text,
	"rounds_since_last_win" integer DEFAULT 0 NOT NULL,
	"must_change_password" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "members_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "nominations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"consumed_at" timestamp with time zone,
	"consumed_by_draw_id" uuid,
	CONSTRAINT "nominations_active_unique" UNIQUE("member_id","restaurant_id","consumed_at")
);
--> statement-breakpoint
CREATE TABLE "place_lookup_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cache_key" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "place_lookup_cache_cache_key_unique" UNIQUE("cache_key")
);
--> statement-breakpoint
CREATE TABLE "ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visit_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"score" numeric(3, 1) NOT NULL,
	"comment" text,
	"applied_weight" numeric(4, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ratings_visit_member_unique" UNIQUE("visit_id","member_id")
);
--> statement-breakpoint
CREATE TABLE "restaurants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"neighborhood" text,
	"city" text,
	"postal_code" text,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"cuisines" text[] DEFAULT '{}' NOT NULL,
	"phone" text,
	"website" text,
	"place_source" text,
	"place_reference" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vetoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"round_number" integer NOT NULL,
	"member_id" uuid NOT NULL,
	"nomination_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vetoes_member_round_unique" UNIQUE("member_id","round_number")
);
--> statement-breakpoint
CREATE TABLE "visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"draw_id" uuid,
	"recommended_by_member_id" uuid,
	"visited_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revealed_at" timestamp with time zone,
	"legacy_score" numeric(3, 1),
	"legacy_comment" text
);
--> statement-breakpoint
ALTER TABLE "draws" ADD CONSTRAINT "draws_winner_member_id_members_id_fk" FOREIGN KEY ("winner_member_id") REFERENCES "public"."members"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draws" ADD CONSTRAINT "draws_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draws" ADD CONSTRAINT "draws_nomination_id_nominations_id_fk" FOREIGN KEY ("nomination_id") REFERENCES "public"."nominations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nominations" ADD CONSTRAINT "nominations_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nominations" ADD CONSTRAINT "nominations_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_created_by_members_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vetoes" ADD CONSTRAINT "vetoes_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vetoes" ADD CONSTRAINT "vetoes_nomination_id_nominations_id_fk" FOREIGN KEY ("nomination_id") REFERENCES "public"."nominations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_draw_id_draws_id_fk" FOREIGN KEY ("draw_id") REFERENCES "public"."draws"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_recommended_by_member_id_members_id_fk" FOREIGN KEY ("recommended_by_member_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "nominations_member_index" ON "nominations" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "restaurants_name_index" ON "restaurants" USING btree ("name");