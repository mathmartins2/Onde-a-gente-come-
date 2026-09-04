# Como subir o app

Tudo no plano gratuito. Você faz os logins; eu não tenho acesso às suas contas.

## 1. Banco no Neon

1. Crie a conta em https://neon.com e um projeto Postgres na região `aws-us-east-1`
   (a mais próxima com free tier; `sa-east-1` costuma ser paga).
2. Copie a connection string **com pooler** — a que tem `-pooler` no host.
   Serverless abre e fecha conexão a cada request; sem o pooler o banco estoura o limite.
3. Ela tem esta cara:

```
postgresql://usuario:senha@ep-algo-123456-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## 2. Rodar as migrations no Neon

Do seu computador, apontando para o banco de produção:

```bash
DATABASE_URL="<a string do Neon>" pnpm database:migrate
DATABASE_URL="<a string do Neon>" SEED_PASSWORD="<senha provisoria>" pnpm database:seed
```

O seed cria os 4 membros, os 7 restaurantes e as 4 visitas históricas da planilha.
Ele é idempotente: rodar de novo não duplica nada.

## 3. Subir no GitHub

O Vercel puxa do GitHub. O repositório ainda não foi enviado — o commit é seu.

```bash
git add .
git commit -m "app de sorteio de restaurante"
gh repo create restaurant-draw --private --source=. --push
```

Confira antes que `.env.local` **não** entrou no commit (ele está no `.gitignore`;
`git check-ignore .env.local` confirma).

## 4. Deploy no Vercel

1. https://vercel.com → New Project → importe o repositório.
2. O Vercel detecta Next.js sozinho. Não mexa em build command nem output directory.
3. Em Environment Variables, adicione para **Production** e **Preview**:

| variável | valor |
|---|---|
| `DATABASE_URL` | a string do Neon **com pooler** |
| `SESSION_SECRET` | string aleatória de 32+ caracteres (gere com o comando abaixo) |

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

`SESSION_SECRET` assina o cookie de sessão **e** o vínculo com a senha de cada um.
Se você trocar esse valor depois, todo mundo é deslogado. Guarde num lugar seguro.

4. Deploy. Sai uma URL `.vercel.app` que já funciona no celular.

## 5. Primeiro acesso

Cada um entra com o usuário e a senha provisória, vai em **Perfil** e:
- troca a senha
- define o PIN de 4 dígitos (só usado no modo "passando um celular só")

Enquanto ninguém trocar, todos estão com a mesma senha — troque logo.

## Manutenção

```bash
pnpm test                  # 87 testes
pnpm validate              # 28 checagens contra o app rodando
pnpm database:reset        # SÓ LOCAL: apaga tudo e recarrega a planilha
```

Depois de mudar `lib/database/schema.ts`:

```bash
pnpm database:generate
DATABASE_URL="<a string do Neon>" pnpm database:migrate
```

## Desenvolvimento local

```bash
docker compose up -d       # Postgres na porta 5544
pnpm database:migrate
pnpm database:seed
pnpm dev
```

## Custo

| serviço | plano | limite que importa aqui |
|---|---|---|
| Vercel | Hobby | uso não comercial; sobra pra 4 pessoas |
| Neon | Free | 0,5 GB — esse app usa alguns MB |
| OpenStreetMap | grátis, sem chave | 1 req/s no Nominatim, já respeitado no código |

Nada exige cartão. **Confira os planos atuais antes de assinar qualquer coisa** —
eu não tenho como verificar os termos vigentes daqui.
