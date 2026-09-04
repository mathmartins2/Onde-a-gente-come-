#!/bin/bash
set -uo pipefail

CURL=/usr/bin/curl
DOCKER=/usr/local/bin/docker
BASE=${BASE_URL:-http://localhost:3000}
JAR=$(mktemp -d)/cookies.txt
PASSWORD=${SEED_PASSWORD:-trocar-esta-senha}
CONTAINER=restaurant-draw-database

passed=0
failed=0

check() {
  local label="$1" actual="$2" expected="$3"
  if [ "$actual" = "$expected" ]; then
    printf '  ok    %-58s %s\n' "$label" "$actual"
    passed=$((passed + 1))
    return
  fi
  printf '  FALHA %-58s esperado=%s obtido=%s\n' "$label" "$expected" "$actual"
  failed=$((failed + 1))
}

query() {
  $DOCKER exec "$CONTAINER" psql -U restaurant -d restaurant_draw -t -A -c "$1"
}

status() {
  $CURL -s -o /dev/null -w '%{http_code}' "$@"
}

jsonPayload() {
  printf '{"username":"%s","password":"%s"}' "$1" "$2"
}

echo "== 0. limpando travas de tentativas anteriores =="
query "DELETE FROM authentication_attempts;" > /dev/null
echo "  ok    travas de rate limit zeradas"

echo "== 1. controle de acesso =="
check "rota protegida sem sessao redireciona" "$(status "$BASE/")" "307"
check "api sem sessao devolve 401" "$(status "$BASE/api/draws")" "401"
WRONG_PAYLOAD=$(jsonPayload "nao-existe-esse-usuario" "errada-mesmo")
ADMIN_PAYLOAD=$(jsonPayload "math" "$PASSWORD")
check "login com senha errada" "$(status -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' -d "$WRONG_PAYLOAD")" "401"
check "login valido" "$(status -c "$JAR" -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' -d "$ADMIN_PAYLOAD")" "200"
check "rota protegida com sessao" "$(status -b "$JAR" "$BASE/")" "200"

echo "== 2. telas renderizam =="
for route in / /restaurants /history /ranking /statistics /map /profile; do
  check "GET $route" "$(status -b "$JAR" "$BASE$route")" "200"
done

echo "== 3. validacao de entrada =="
check "restaurante sem nome" "$(status -b "$JAR" -X POST "$BASE/api/restaurants" -H 'Content-Type: application/json' -d '{"name":""}')" "400"
check "busca curta demais" "$(status -b "$JAR" "$BASE/api/places/search?term=ab")" "400"
check "corpo nao-json" "$(status -b "$JAR" -X POST "$BASE/api/restaurants" -H 'Content-Type: application/json' -d 'texto solto')" "400"

echo "== 3b. sessao: so admin abre =="
NON_ADMIN_JAR=$(mktemp -d)/alucard.txt
MEMBER_PAYLOAD=$(jsonPayload "alucard" "$PASSWORD")
$CURL -s -c "$NON_ADMIN_JAR" -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' -d "$MEMBER_PAYLOAD" -o /dev/null
check "nao-admin nao abre sorteio" "$(status -b "$NON_ADMIN_JAR" -X POST "$BASE/api/sessions")" "403"

echo "== 4. protecao SSRF no link do Maps =="
for target in "http://localhost:5544/" "https://169.254.169.254/latest/meta-data/" "https://google.com.attacker.net/maps" "file:///etc/passwd"; do
  check "bloqueia $target" "$(status -b "$JAR" -X POST "$BASE/api/places/link" -H 'Content-Type: application/json' -d "{\"link\":\"$target\"}")" "422"
done

echo "== 5. sigilo da votacao =="
unrevealed=$(query "SELECT count(*) FROM ratings r JOIN visits v ON v.id = r.visit_id WHERE v.revealed_at IS NULL;")
if [ "$unrevealed" -gt 0 ]; then
  leaked=$($CURL -s -b "$JAR" "$BASE/api/ranking" | python3 -c "
import json,sys
try:
    payload = json.load(sys.stdin)
except Exception:
    print('resposta-invalida'); raise SystemExit
if 'strictness' not in payload:
    print('sem-sessao'); raise SystemExit
print(sum(entry['ratingCount'] for entry in payload['strictness']))
")
  revealed=$(query "SELECT count(*) FROM ratings r JOIN visits v ON v.id = r.visit_id WHERE v.revealed_at IS NOT NULL;")
  check "ranking ignora nota nao revelada" "$leaked" "$revealed"
else
  echo "  aviso nenhuma nota pendente para testar o sigilo"
fi

echo "== 6. regras do sorteio no banco =="
check "todo sorteio tem snapshot auditavel" "$(query "SELECT count(*) FROM draws WHERE weight_snapshot IS NULL;")" "0"
check "vencedor sempre zera o pity" "$(query "SELECT count(*) FROM members m JOIN draws d ON d.winner_member_id = m.id WHERE d.round_number = (SELECT max(round_number) FROM draws) AND m.rounds_since_last_win <> 0;")" "0"
check "todo sorteio virou visita" "$(query "SELECT count(*) FROM draws d WHERE NOT EXISTS (SELECT 1 FROM visits v WHERE v.draw_id = d.id);")" "0"
check "sessao sorteada fica fechada" "$(query "SELECT count(*) FROM draw_sessions WHERE draw_id IS NOT NULL AND status <> 'drawn';")" "0"
check "rank sem posicao repetida" "$(query "SELECT count(*) FROM (SELECT session_id, member_id, position FROM session_preferences GROUP BY 1,2,3 HAVING count(*) > 1) duplicated;")" "0"
check "uma nota por pessoa por visita" "$(query "SELECT count(*) FROM (SELECT visit_id, member_id FROM ratings GROUP BY visit_id, member_id HAVING count(*) > 1) duplicated;")" "0"
check "no maximo um veto por pessoa por rodada" "$(query "SELECT count(*) FROM (SELECT member_id, round_number FROM vetoes GROUP BY member_id, round_number HAVING count(*) > 1) duplicated;")" "0"
check "toda culinaria esta em ingles" "$(query "SELECT count(*) FROM restaurants WHERE EXISTS (SELECT 1 FROM unnest(cuisines) AS value WHERE value ~ '[áàâãéêíóôõúçÁ]');")" "0"
check "um preco por visita no maximo" "$(query "SELECT count(*) FROM (SELECT visit_id FROM visit_price_entries GROUP BY visit_id HAVING count(*) > 1) duplicated;")" "0"
check "um voto de banimento por pessoa por turno" "$(query "SELECT count(*) FROM (SELECT member_id, round_number, ban_round FROM vetoes GROUP BY 1,2,3 HAVING count(*) > 1) duplicated;")" "0"
check "toda nota tem os 4 criterios" "$(query "SELECT count(*) FROM ratings WHERE flavor_score IS NULL OR price_score IS NULL OR service_score IS NULL OR ambience_score IS NULL;")" "0"
check "nota final bate com a media dos criterios" "$(query "SELECT count(*) FROM ratings WHERE abs(score - (flavor_score + price_score + service_score + ambience_score) / 4.0) > 0.01;")" "0"
check "plano B nunca igual ao vencedor" "$(query "SELECT count(*) FROM draws WHERE fallback_restaurant_id = restaurant_id;")" "0"

echo
query "DELETE FROM authentication_attempts;" > /dev/null
echo "resultado: $passed ok, $failed falha(s)"
[ "$failed" -eq 0 ]
