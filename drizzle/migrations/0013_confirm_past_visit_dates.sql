UPDATE "visits" SET "visit_date_confirmed_at" = "visited_at"
WHERE "visit_date_confirmed_at" IS NULL
  AND ("legacy_score" IS NOT NULL OR EXISTS (SELECT 1 FROM "ratings" WHERE "ratings"."visit_id" = "visits"."id"));
