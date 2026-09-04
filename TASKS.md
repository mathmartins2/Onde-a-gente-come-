# Acompanhamento

Uma linha por coisa que você pediu. Atualizado a cada pedido.

## Feito e verificado rodando

- [x] Ler a planilha e extrair regras, visitados e indicações
- [x] Buscar dados de restaurante de graça — cascata Nominatim → Overpass → Photon → link do Maps → manual
- [x] Next.js 16 + TS + Tailwind v4 + pnpm, Postgres local em Docker
- [x] Schema Drizzle + migrations
- [x] Sorteio por pessoa com pity timer (+0,25/rodada, teto 2,5x) — medido: corta 41% das secas longas
- [x] Quem não indicou não entra no sorteio nem acumula pity — provado no banco
- [x] Restaurante já visitado tem chance bem menor, recuperando em 12 meses
- [x] Quem indicou lugar bem avaliado ganha até +15% de chance
- [x] Nota final ponderada (quem não recomendou pesa 1,25x) — provado: 3,9474 contra 4,00 da média simples
- [x] Ranking bayesiano com âncora fixa 3,0 — Ruffo 4,35 > Rock n Ribs 4,00 > Yokocho 3,84
- [x] Veto de 1 por pessoa por rodada
- [x] Sessão de notas às cegas com PIN e revelação animada
- [x] Seed com os dados da planilha
- [x] Culinárias normalizadas e consistentes em inglês
- [x] Login usuário+senha (argon2); PIN de 4 dígitos só pra votar na mesa
- [x] Rate limit no login — provado: trava na 9ª tentativa, nem a senha certa passa
- [x] Proteção SSRF no link do Maps, validada a cada redirect
- [x] Validação Zod compartilhada client/server, com react-hook-form
- [x] Faker nos testes
- [x] Axios em todas as requests
- [x] Rotas em inglês, UI em português
- [x] Auth deixou de ser repetida em toda page — route group + layout + React.cache
- [x] Ranking de indicador, perfil de rigor, contexto de lugar repetido
- [x] Estatísticas, mapa dos visitados, card do resultado pro zap
- [x] **Falha de segurança encontrada e corrigida**: as notas às cegas vazavam pelo
      endpoint de ranking antes da revelação. Provado derivando a nota escondida
      (média foi de 3 para 2 → nota secreta = 1). Análises agora só enxergam
      visitas reveladas. Correção verificada.

## Histórico das votações (pedido novo)

- [x] Tela do histórico: vencedor, quem indicou, concorrentes com chance, vetos e notas
- [ ] Gravar os concorrentes no momento do sorteio (coluna `contenders_snapshot`)
      — hoje só a indicação vencedora é consumida, as perdedoras seguem ativas,
      então a disputa não é reconstruível depois. Não é recuperável para os
      sorteios já feitos; passa a valer a partir da mudança.
- [ ] `GET /api/history`
- [ ] Item na navegação
      Bloqueado até o agente de segurança soltar lib/ e app/api/.

## Bugs achados testando, a corrigir quando os agentes soltarem os arquivos

- [ ] `averageScore` devolve 3,0 (a âncora bayesiana) para restaurante SEM nenhuma
      nota, em vez de `null`. O Outback nunca foi avaliado e aparece com nota 3
      no mapa e no ranking. Deve ser `null` quando `ratingCount === 0`.
      Arquivo: lib/services/analyticsService.ts (agente de segurança).
- [ ] Aplicar o patch do link do Google Maps (lib/places/resolveMapsLink.ts).
- [ ] Gravar concorrentes no sorteio + `GET /api/history`.

## Em andamento (agentes restantes)

- [ ] Design — identidade visual, login e navegação
- [ ] Menos states possível nos componentes
- [ ] Endurecimento de segurança + bundle do recharts

## Depois dos agentes

- [ ] Re-rodar `scripts/validate-end-to-end.sh` (26 checagens)
- [ ] Rodar a suíte de testes completa
- [ ] Screenshots das telas
- [ ] Deixar o app rodando pra você testar

## Pendente de você

- [ ] Contas Neon e Vercel pra subir em produção
- [ ] Trocar a senha provisória dos 4 membros

## Fora do escopo por decisão sua

- Web Push / lembrete automático — "deixa pra depois"
- PWA instalável — não marcado
- Quórum de 50% — "não, sorteia sempre"
