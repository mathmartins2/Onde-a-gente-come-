CREATE TABLE "draw_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"round_number" integer NOT NULL,
	"opened_by_member_id" uuid NOT NULL,
	"status" text DEFAULT 'collecting' NOT NULL,
	"draw_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"drawn_at" timestamp with time zone,
	CONSTRAINT "draw_sessions_round_number_unique" UNIQUE("round_number")
);
--> statement-breakpoint
CREATE TABLE "rating_session_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visit_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"is_ready" boolean DEFAULT false NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rating_session_participants_unique" UNIQUE("visit_id","member_id")
);
--> statement-breakpoint
CREATE TABLE "session_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"is_ready" boolean DEFAULT false NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ready_at" timestamp with time zone,
	CONSTRAINT "session_participants_unique" UNIQUE("session_id","member_id")
);
--> statement-breakpoint
CREATE TABLE "session_pool_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"added_by_member_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_pool_entries_unique" UNIQUE("session_id","restaurant_id")
);
--> statement-breakpoint
CREATE TABLE "session_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "session_preferences_unique" UNIQUE("session_id","member_id","restaurant_id"),
	CONSTRAINT "session_preferences_position_unique" UNIQUE("session_id","member_id","position")
);
--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "is_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "draw_sessions" ADD CONSTRAINT "draw_sessions_opened_by_member_id_members_id_fk" FOREIGN KEY ("opened_by_member_id") REFERENCES "public"."members"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draw_sessions" ADD CONSTRAINT "draw_sessions_draw_id_draws_id_fk" FOREIGN KEY ("draw_id") REFERENCES "public"."draws"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_session_participants" ADD CONSTRAINT "rating_session_participants_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_session_participants" ADD CONSTRAINT "rating_session_participants_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_participants" ADD CONSTRAINT "session_participants_session_id_draw_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."draw_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_participants" ADD CONSTRAINT "session_participants_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_pool_entries" ADD CONSTRAINT "session_pool_entries_session_id_draw_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."draw_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_pool_entries" ADD CONSTRAINT "session_pool_entries_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_pool_entries" ADD CONSTRAINT "session_pool_entries_added_by_member_id_members_id_fk" FOREIGN KEY ("added_by_member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_preferences" ADD CONSTRAINT "session_preferences_session_id_draw_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."draw_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_preferences" ADD CONSTRAINT "session_preferences_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_preferences" ADD CONSTRAINT "session_preferences_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;