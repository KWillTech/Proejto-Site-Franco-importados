# Preço pelo dólar — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preço de cada variação = custo (US$) × dólar do dia + margem (R$), recalculado sozinho todo dia; aba "Cálculo" no painel para editar custo e margem; variação sem custo ou margem fora da vitrine.

**Architecture:** Custo e margem ficam numa tabela só de admin (`variant_costs`, migration 0004). Uma função SQL `recalc_prices()` grava o preço calculado em `variants.retail_cents`/`wholesale_cents` e marca `variants.priced`; assim carrinho, resumo e WhatsApp não mudam. A vitrine (`data.ts`) descarta variações com `priced = false` e produtos que ficam sem variação. Um Vercel Cron diário chama `/api/cron/dolar`, que busca a cotação, grava em `settings` e chama `recalc_prices()`; o "Salvar" da aba Cálculo grava custos e chama o mesmo recálculo.

**Tech Stack:** Next.js 16 App Router, Supabase (RLS), Zod, Vitest, Vercel Cron.

**Spec:** `docs/superpowers/specs/2026-10-18-preco-pelo-dolar-design.md` — leia junto. Plano-base: `docs/superpowers/plans/2026-10-11-loja-franco-importados.md`.

## Global Constraints

- As Global Constraints do plano-base valem (textos em pt-BR, vitrine nunca grava, só administrador grava, celular 390px e 1280px).
- Preço (centavos de R$) = `round(custo_usd_cents × usd_rate) + margin_cents`; atacado = varejo.
- Custo em **centavos de dólar** (int ≥ 0), margem em **centavos de real** (int ≥ 0); ambos `null` = não preenchido. Margem `0` é válida.
- Custo e margem **nunca** legíveis pela chave anon.
- Cotação: AwesomeAPI `https://economia.awesomeapi.com.br/json/last/USD-BRL`, campo `USDBRL.ask`; aceita só `1 ≤ rate ≤ 20`; inválida → nada é gravado nem recalculado.
- Cron: `0 9 * * *` (06:00 Brasília), rota protegida por `Authorization: Bearer ${CRON_SECRET}`.
- Novas variáveis de ambiente (só servidor): `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`.
- Ponytail: menor mudança completa, reusar o que existe (`parseMoney`, `formatBRL`, `requireUser`, `fieldErrors`, `SAVE_FAILED`, padrão de actions/tests do painel), `shortcut: <limite>, <quando trocar>` em atalhos conhecidos.
- Textos fixos: aba "Cálculo"; cabeçalhos "Produto", "Variação", "Custo (US$)", "Margem (R$)", "Preço de venda (R$)"; rótulo "Dólar comercial (venda)"; "Atualizado em <data hora>"; sem cotação: "Cotação ainda não carregada"; linha incompleta: "fora da vitrine"; botão "Salvar alterações"; busca com placeholder "Buscar produto...".

## Review Focus

1. **API de cotação fora do ar ou devolvendo lixo** (0, vazio, 50, JSON sem `USDBRL`): nada muda, preços ficam com a última cotação. → Task 2 (`parseUsdRate`, `refreshUsdRate`).
2. **Alguém chama `/api/cron/dolar` sem o segredo:** 401, nada gravado. → Task 2 (teste da rota).
3. **Chave anon lendo `variant_costs`:** sem acesso. → Task 1 (verificação SQL no fim da migration).
4. **Cliente com variação no carrinho que saiu da vitrine:** ela some do carrinho com o aviso que já existe. → Task 3 (`getVariantsByIds` não devolve variação `priced = false`).
5. **Margem vazia vs margem 0 na aba Cálculo:** vazia = `null` (fora da vitrine), `0,00` = 0 (vitrine). → Task 5 (teste de `saveCosts`).

---

### Task 1: Migration 0004 — `franco-impl-avancado`

**Files:**
- Create: `supabase/migrations/0004_preco_dolar.sql`

**Interfaces:**
- Produces:
  - `public.variant_costs (variant_id uuid pk references public.variants on delete cascade, cost_usd_cents int check (>= 0), margin_cents int check (>= 0))` — RLS ligada; select/insert/update/delete só para `authenticated` com `(select public.is_admin())`; `revoke all ... from anon`.
  - `public.settings.usd_rate numeric` (null) e `public.settings.usd_rate_at timestamptz` (null).
  - `public.variants.priced boolean not null default false`.
  - `public.recalc_prices() returns void` — `security invoker`, `set search_path = ''`. Para **toda** variação: `priced = (custo não nulo e margem não nula e settings.usd_rate não nulo)`; quando `priced`, `retail_cents = wholesale_cents = round(cost_usd_cents * usd_rate)::int + margin_cents`; quando não, preços ficam como estão. Variação sem linha em `variant_costs` → `priced = false`. `revoke execute from public, anon`; `grant execute to authenticated, service_role`.

- [ ] **Step 1: Escrever a migration** no estilo da 0003 (cabeçalho com como rodar, `begin;`/`commit;`, `if not exists`, pode rodar de novo). O cabeçalho avisa em destaque: **"ATENÇÃO: depois desta migração TODOS os produtos saem da vitrine até custo e margem serem preenchidos na aba Cálculo do painel."** Diga também para publicar o app com esta versão logo depois (o app antigo não filtra `priced`, mas também não quebra).
- [ ] **Step 2: Bloco de verificação comentado no fim**, para o dono colar no SQL Editor:
  ```sql
  -- set role anon; select * from public.variant_costs; -- esperado: erro de permissão
  -- reset role;
  -- select public.recalc_prices(); select count(*) filter (where priced) from public.variants; -- esperado: 0
  ```
- [ ] **Step 3: Commit**
  ```bash
  git add supabase/migrations/0004_preco_dolar.sql
  git commit -m "feat: migration de custo em dólar, cotação e recálculo de preços"
  ```

---

### Task 2: Cotação e cron diário — `franco-impl-padrao`

**Files:**
- Create: `src/lib/dolar.ts`, `src/lib/dolar.test.ts`, `src/app/api/cron/dolar/route.ts`, `src/app/api/cron/dolar/route.test.ts`, `vercel.json`
- Modify: `.env.example`

**Interfaces:**
- Consumes: `settings.usd_rate`, `settings.usd_rate_at`, `rpc('recalc_prices')` (Task 1).
- Produces (em `src/lib/dolar.ts`):
  - `parseUsdRate(json: unknown): number | null` — lê `USDBRL.ask` (string ou número); devolve `null` fora de `[1, 20]` ou formato inválido.
  - `priceCents(costUsdCents: number, rate: number, marginCents: number): number` — `Math.round(costUsdCents * rate) + marginCents`.
  - `refreshUsdRate(supabase: SupabaseClient): Promise<number | null>` — `fetch` da AwesomeAPI com `cache: 'no-store'`; se `parseUsdRate` der número, `update settings set usd_rate, usd_rate_at = now()` (`.eq('id', 1)`) e `rpc('recalc_prices')`; devolve a cotação gravada ou `null` (erro de rede/HTTP/banco → `console.error` e `null`, sem lançar).
- Produces: `GET /api/cron/dolar` — 401 se `authorization !== \`Bearer ${process.env.CRON_SECRET}\`` (e 401 se `CRON_SECRET` vazio); senão cria cliente `createClient` de `@supabase/supabase-js` com `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (`persistSession: false`), chama `refreshUsdRate`, `revalidatePath('/', 'layout')` se gravou; responde `{ ok: boolean, rate: number | null }` (500 quando `null`).

- [ ] **Step 1: Testes que falham** em `src/lib/dolar.test.ts`:
  ```ts
  expect(parseUsdRate({ USDBRL: { ask: '5.4213' } })).toBe(5.4213);
  expect(parseUsdRate({ USDBRL: { ask: '0' } })).toBeNull();
  expect(parseUsdRate({ USDBRL: { ask: '50' } })).toBeNull();
  expect(parseUsdRate({ USDBRL: { ask: '' } })).toBeNull();
  expect(parseUsdRate({})).toBeNull();
  expect(parseUsdRate(null)).toBeNull();
  expect(priceCents(65000, 5.42, 80000)).toBe(432300);   // US$ 650 × 5,42 + R$ 800 = R$ 4.323,00
  expect(priceCents(2800, 5.42, 9000)).toBe(24176);
  ```
  e `refreshUsdRate` com `fetch` mockado devolvendo `{ USDBRL: { ask: '0' } }`: não chama `update` nem `rpc`, devolve `null`; com `fetch` rejeitando: devolve `null`.
- [ ] **Step 2: Rodar** `npx vitest run src/lib/dolar.test.ts` — esperado: FAIL (módulo não existe).
- [ ] **Step 3: Implementar** `src/lib/dolar.ts`.
- [ ] **Step 4: Teste da rota** em `route.test.ts` (mock de `@/lib/dolar` e `next/cache` como nos `actions.test.ts`): sem header → 401 e `refreshUsdRate` não chamado; `CRON_SECRET` vazio + header `Bearer ` → 401; header certo e `refreshUsdRate` → `5.4` → 200 `{ ok: true, rate: 5.4 }` e `revalidatePath('/', 'layout')` chamado.
- [ ] **Step 5: Implementar a rota**, `vercel.json` `{ "crons": [{ "path": "/api/cron/dolar", "schedule": "0 9 * * *" }] }` e `.env.example` com `SUPABASE_SERVICE_ROLE_KEY=` e `CRON_SECRET=` (comentário: só servidor, nunca `NEXT_PUBLIC_`).
- [ ] **Step 6: Rodar** `npx vitest run src/lib/dolar.test.ts src/app/api/cron/dolar` — esperado: PASS.
- [ ] **Step 7: Commit** `feat: cotação diária do dólar com recálculo de preços`.

---

### Task 3: Vitrine esconde variação sem preço — `franco-impl-padrao`

**Files:**
- Modify: `src/lib/data.ts` (`ProductRow`, `PRODUCT_SELECT`, `mapProduct`, `mapProducts`, `getProductBySlug`, `getAllProductSlugs`), `src/lib/test-fixtures.ts` se montar `ProductRow`
- Test: `src/lib/data.test.ts`

**Interfaces:**
- Consumes: `variants.priced` (Task 1).
- Produces: `ProductRow.variants[].priced: boolean`; `mapProduct` só mantém variações `priced`; `mapProducts` descarta produto sem nenhuma variação; `getProductBySlug` → `null` nesse caso; `getAllProductSlugs` só slugs de produtos com variação `priced` (`select('slug, variants!inner(priced)').eq('variants.priced', true)`). Tipo `Variant` e o resto da vitrine não mudam.

- [ ] **Step 1: Testes que falham** em `data.test.ts`: `mapProduct` de um row com variações `priced: true` e `priced: false` → só a primeira; `mapProducts` (via função exportada que o teste já alcança, ou exporte `mapProducts`) de produto só com `priced: false` → `[]`; `getVariantsByIds` com o mock existente não devolve variação `priced: false`.
- [ ] **Step 2: Rodar** `npx vitest run src/lib/data.test.ts` — esperado: FAIL.
- [ ] **Step 3: Implementar.** Ajuste fixtures que montam `ProductRow` para `priced: true`.
- [ ] **Step 4: Rodar** `npm test` — esperado: tudo PASS.
- [ ] **Step 5: Commit** `feat: vitrine esconde variações sem custo e margem`.

---

### Task 4: Cadastro de produto sem campo de preço — `franco-impl-avancado`

**Files:**
- Modify: `src/lib/validation.ts` (`variantSchema`, `ProductInput`), `src/lib/types.ts` se `ProductInput` estiver lá, `src/components/admin/ProductForm.tsx`, `src/components/admin/VariantsEditor.tsx`, `src/app/admin/(painel)/produtos/actions.ts` (`saveProduct`), `src/app/admin/(painel)/produtos/[id]/page.tsx` se passar preços ao form
- Test: `src/lib/validation.test.ts`, `src/app/admin/(painel)/produtos/actions.test.ts`

**Interfaces:**
- Produces: `ProductInput.variants[]` = `{ id?: string; optionValues: string[]; available: boolean }` (sem `retailCents`/`wholesaleCents`). `saveProduct` atualiza variação existente **sem** tocar preço; variação nova é inserida com `retail_cents: 0, wholesale_cents: 0` (e `priced` fica no default `false`).

- [ ] **Step 1: Ajustar testes:** remover os casos de preço/atacado > varejo de `validation.test.ts`; em `actions.test.ts`, afirmar que o `update` de variação existente não contém `retail_cents` e que o `insert` de variação nova leva `retail_cents: 0, wholesale_cents: 0`.
- [ ] **Step 2: Rodar** os dois arquivos — esperado: FAIL.
- [ ] **Step 3: Implementar.** Some as colunas de preço do `VariantsEditor`; o form ganha uma linha de ajuda: "O preço é calculado na aba Cálculo." Remover `toMoney` se ficar sem uso.
- [ ] **Step 4: Rodar** `npm test` e `npx tsc --noEmit` — esperado: PASS e sem erros.
- [ ] **Step 5: Commit** `feat: preço sai do cadastro de produto (vem da aba Cálculo)`.

---

### Task 5: Aba "Cálculo" — `franco-impl-avancado`

**Files:**
- Create: `src/app/admin/(painel)/calculo/page.tsx`, `src/app/admin/(painel)/calculo/actions.ts`, `src/app/admin/(painel)/calculo/actions.test.ts`, `src/components/admin/CalculoTable.tsx`
- Modify: `src/app/admin/(painel)/layout.tsx` (link "Cálculo" entre Banners e Configurações), `src/lib/validation.ts` (`costsSchema`)

**Interfaces:**
- Consumes: `variant_costs`, `settings.usd_rate/usd_rate_at`, `rpc('recalc_prices')` (Task 1); `priceCents`, `refreshUsdRate` (Task 2).
- Produces:
  - `costsSchema = z.array(z.object({ variantId: uuid, costUsdCents: int ≥ 0 | null, marginCents: int ≥ 0 | null })).max(2000)`.
  - `saveCosts(input: unknown): Promise<{ ok: true } | { ok: false; errors: Record<string, string> }>` — `requireUser()`; valida; `upsert` em `variant_costs` (`onConflict: 'variant_id'`); se `settings.usd_rate` é `null`, `await refreshUsdRate(supabase)`; `rpc('recalc_prices')`; `revalidatePath('/', 'layout')`; erro de banco → `SAVE_FAILED`.
  - `page.tsx`: `requireUser()`; lê com o cliente de sessão `products(id, name, option_names, variants(id, option_values, retail_cents, position))`, `variant_costs` e `settings(usd_rate, usd_rate_at)`; passa linhas planas `{ variantId, productName, variantLabel, costUsdCents, marginCents, retailCents }` e `rate` para `CalculoTable`.
  - `CalculoTable({ rows, rate, rateAt })` (client): campo de busca que filtra por nome do produto (sem acento/maiúscula importar); inputs de custo e margem com `parseMoney` (vazio → `null`); "Preço de venda" ao vivo com `priceCents` + `formatBRL` quando custo, margem e `rate` existem, senão "fora da vitrine" com a linha em destaque; "Salvar alterações" envia só as linhas alteradas; mostra erro de `form` e sucesso como os outros formulários do painel.

- [ ] **Step 1: Testes que falham** em `calculo/actions.test.ts` (mesmo mock de `createClient`/`requireUser` dos outros `actions.test.ts`): payload inválido (uuid ruim, custo negativo) → `ok: false` sem upsert; `{ costUsdCents: 65000, marginCents: 0 }` → upsert com `margin_cents: 0`; `marginCents: null` → upsert com `margin_cents: null`; `usd_rate` nulo → `refreshUsdRate` chamado antes do `rpc`; `usd_rate` presente → não chamado; erro no upsert → `SAVE_FAILED` e sem `rpc`.
- [ ] **Step 2: Rodar** `npx vitest run "src/app/admin/(painel)/calculo"` — esperado: FAIL.
- [ ] **Step 3: Implementar** `costsSchema`, `saveCosts`, `page.tsx`, `CalculoTable.tsx` e o link no layout, reusando classes de `admin.module.css`.
- [ ] **Step 4: Rodar** `npm test`, `npx tsc --noEmit`, `npm run lint` — esperado: PASS.
- [ ] **Step 5: Verificação no navegador** (`npm run dev`, login de admin local): a aba aparece; busca filtra; digitar custo/margem atualiza o preço; linha incompleta mostra "fora da vitrine"; tela em 390px sem rolagem horizontal da página (a tabela pode rolar dentro do próprio contêiner).
- [ ] **Step 6: Commit** `feat: aba Cálculo no painel (custo em dólar e margem por variação)`.

---

## Passos do dono (depois do merge)

1. Rodar `0004_preco_dolar.sql` no SQL Editor do Supabase.
2. Na Vercel: cadastrar `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API → service_role) e `CRON_SECRET` (texto aleatório longo); fazer deploy.
3. Preencher custo e margem na aba Cálculo; os produtos voltam à vitrine ao salvar.
