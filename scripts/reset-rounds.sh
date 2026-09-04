#!/bin/bash
set -euo pipefail

DOCKER=/usr/local/bin/docker
CONTAINER=restaurant-draw-database

echo "apagando rodadas, notas e precos (membros, senhas e restaurantes ficam)..."
$DOCKER exec "$CONTAINER" psql -U restaurant -d restaurant_draw -q -c "
TRUNCATE TABLE visit_price_entries, ratings, rating_session_participants,
               session_preferences, session_pool_entries, session_participants,
               vetoes, draw_sessions RESTART IDENTITY CASCADE;
DELETE FROM visits WHERE draw_id IS NOT NULL;
DELETE FROM draws;
UPDATE members SET rounds_since_last_win = 0;"
