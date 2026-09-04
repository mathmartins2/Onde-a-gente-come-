#!/bin/bash
set -euo pipefail

DOCKER=/usr/local/bin/docker
CONTAINER=restaurant-draw-database

echo "apagando dados de teste e recarregando a planilha..."
$DOCKER exec "$CONTAINER" psql -U restaurant -d restaurant_draw -q -c "
TRUNCATE TABLE ratings, vetoes, draws, visits, nominations, restaurants, members,
               authentication_attempts, place_lookup_cache RESTART IDENTITY CASCADE;"

pnpm exec tsx scripts/seed.ts
