# Subcategorias no menu — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Categorias com um nível de subcategorias, mantidas pelo painel; menu da vitrine com lista suspensa; página da principal com filtro por subcategoria.

**Architecture:** `categories.parent_id` (migration 0003, trigger garante dois níveis). Uma função pura `buildTree` (em `src/lib/categories.ts`, sem dependência de servidor) monta a árvore para a vitrine e para o painel. `data.ts` passa a devolver o menu em árvore e os produtos da principal + subcategorias visíveis; o filtro `?sub=` é aplicado na página sobre `product.categorySlug`, sem nova consulta.

**Tech Stack:** Next.js 16 App Router (cacheComponents, `'use cache'`), Supabase, Zod, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-17-subcategorias-design.md` — leia junto. Plano-base do projeto: `docs/superpowers/plans/2026-10-11-loja-franco-importados.md`.

## Global Constraints

- As Global Constraints do plano-base valem (visual do mockup, Montserrat, navy `#0e1733`, celular em 390px e 1280px, textos em pt-BR, vitrine nunca grava, só administrador grava).
- Dois níveis no máximo; garantido no banco (trigger) e na action.
- "Oculta" = fora do menu e da página da categoria; busca, home e link direto do produto não mudam.
- Subcategoria com mãe oculta é tratada como oculta na vitrine (404 na página, fora do menu, sitemap e `generateStaticParams`).
- Slug continua único na tabela inteira, gerado como hoje; rota segue `/categoria/[slug]`.
- Ponytail: menor mudança completa, reusar o que existe, `shortcut: <limite>, <quando trocar>` em atalhos conhecidos.
- Textos fixos: "Dentro de", "— (categoria principal)", "Esta categoria tem subcategorias.", "Escolha uma categoria principal.", "Mova ou exclua as subcategorias antes.", "oculta pela categoria mãe", botão "Todos".

## Review Focus

1. **Árvore inválida pelo painel:** escolher como mãe uma subcategoria, ela mesma, ou dar mãe a quem já tem filhas. Esperado: mensagem clara, nada gravado. → Task 1 (action + trigger).
2. **Mãe oculta com filhas visíveis:** esperado: grupo inteiro some do menu e `/categoria/<filha>` dá 404. → Task 3.
3. **`?sub=` inválido, repetido ou de outra principal:** esperado: mostra "Todos". → Task 3 (`filterBySub`).
4. **Excluir principal com subcategorias:** esperado: "Mova ou exclua as subcategorias antes." → Task 1.
5. **Menu suspenso só com mouse:** teclado (Tab) e celular precisam chegar nas subcategorias. → Task 4 (verificação manual com Tab e em 390px).

---

### Task 1: Banco, validação e regras do painel — `franco-impl-avancado`

**Files:**
- Create: `supabase/migrations/0003_subcategorias.sql`
- Modify: `src/lib/validation.ts` (`categorySchema`), `src/app/admin/(painel)/categorias/actions.ts` (`saveCategory`, `deleteCategory`)
- Test: `src/lib/validation.test.ts`, `src/app/admin/(painel)/categorias/actions.test.ts`

**Interfaces:**
- Produces: coluna `categories.parent_id uuid null`; `categorySchema` com `parentId: string | null`; `saveCategory(id, input)` aceita `parentId`.

- [ ] **Step 1: Testes que falham.** `validation.test.ts`: `categorySchema.parse({...ok, parentId: ''}).parentId` é `null`; com um uuid válido devolve o uuid; com `'abc'` dá erro em `parentId`. `actions.test.ts` (seguir os mocks já usados no arquivo): `saveCategory` devolve `{ ok: false, errors: { parentId: 'Escolha uma categoria principal.' } }` quando a mãe tem `parent_id` ou é a própria categoria; devolve `{ parentId: 'Esta categoria tem subcategorias.' }` quando a categoria editada tem filhas e recebe `parentId`; grava `parent_id` no insert/update quando válido. `deleteCategory` devolve `{ form: 'Mova ou exclua as subcategorias antes.' }` quando há filhas (conferido antes da checagem de produtos).
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** `0003_subcategorias.sql`, idempotente e com cabeçalho no estilo da 0002 (rodar no SQL Editor depois da 0002): `add column if not exists parent_id uuid references public.categories(id) on delete restrict`, índice em `parent_id`, função + trigger `before insert or update of parent_id` que recusa `parent_id = id`, mãe com `parent_id` não nulo e categoria que tem filhas recebendo mãe (`raise exception`). RLS da 0002 já cobre a tabela.
- [ ] **Step 4:** Implemente `parentId: z.preprocess(emptyToNull, <uuid>.nullable())` (reusar o padrão de uuid de `validation.ts`) e as regras nas actions; `row` ganha `parent_id`. Erro do trigger que escapar vira `SAVE_FAILED`.
- [ ] **Step 5:** `npm test`. Expected: PASS.
- [ ] **Step 6 (pessoa):** rodar `0003_subcategorias.sql` no SQL Editor. Verificação: `select parent_id from categories limit 1` não dá erro.
- [ ] **Step 7:** Commit: `feat: categorias com categoria mãe no banco e nas regras do painel`.

### Task 2: Árvore de categorias e painel — `franco-impl-padrao`

**Files:**
- Create: `src/lib/categories.ts`, `src/lib/categories.test.ts`
- Modify: `src/components/admin/CategoriesManager.tsx`, `src/app/admin/(painel)/categorias/page.tsx`, `src/components/admin/ProductForm.tsx`, `src/app/admin/(painel)/produtos/novo/page.tsx`, `src/app/admin/(painel)/produtos/[id]/page.tsx`

**Interfaces:**
- Consumes: `saveCategory` com `parentId` (Task 1).
- Produces (puro, sem import de servidor):
  - `buildTree<T extends { id: string; parentId: string | null }>(rows: T[]): Array<T & { children: T[] }>` — `rows` já em ordem de `position`; devolve as raízes na ordem, cada uma com as filhas na ordem; filha cuja mãe não está em `rows` é descartada.
  - `moveAmongSiblings(rows: Array<{ id: string; parentId: string | null }>, id: string, dir: -1 | 1): string[] | null` — devolve todos os ids na nova ordem (formato de `reorderCategories`) trocando `id` com a irmã vizinha (mesmo `parentId`) na direção pedida; `null` se não houver vizinha.

- [ ] **Step 1: Testes que falham** em `categories.test.ts`: `buildTree` agrupa filhas sob a mãe mantendo a ordem de entrada, descarta filha órfã, e raiz sem filhas tem `children: []`. `moveAmongSiblings` pula categorias de outro grupo (ex.: ordem `[A, a1, B, a2]` com `a1`,`a2` filhas de A: descer `a1` → `[A, a2, B, a1]`), troca principais entre si ignorando as filhas, e devolve `null` na ponta.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implemente `categories.ts`.
- [ ] **Step 4:** Painel de categorias: a página lê `parent_id`; `CategoryItem` ganha `parentId`; a lista mostra cada principal seguida das filhas recuadas (`buildTree`); ↑/↓ usam `moveAmongSiblings` (desabilitados quando devolve `null`); filha de principal oculta mostra "oculta pela categoria mãe". `CategoryForm` ganha o select "Dentro de" ("— (categoria principal)" + principais, exceto ela mesma), desabilitado com a nota "Esta categoria tem subcategorias." quando ela tem filhas; erro de `parentId` aparece sob o campo. A dica da página passa a explicar que subcategorias aparecem ao passar o mouse na principal.
- [ ] **Step 5:** Cadastro de produto: as duas páginas leem `id, name, parent_id`; `ProductForm` mostra principais sem filhas como `<option>` e cada principal com filhas como `<optgroup label=nome>` contendo a própria principal e as filhas (`buildTree`).
- [ ] **Step 6:** `npm test`, `npx tsc --noEmit`, `npm run lint`. Expected: PASS.
- [ ] **Step 7:** Verificação manual em `/admin/categorias` (390px e 1280px): criar "Apple", mover "iPhone" e "MacBook" para dentro, reordenar as filhas, tentar pôr "Apple" dentro de "iPhone" (erro), excluir "Apple" com filhas (erro).
- [ ] **Step 8:** Commit: `feat: painel com subcategorias`.

### Task 3: Leituras da vitrine — `franco-impl-padrao`

**Files:**
- Modify: `src/lib/types.ts` (`Category`), `src/lib/data.ts`, `src/app/sitemap.ts`, `src/app/(site)/categoria/[slug]/page.tsx` (só `generateStaticParams`)
- Test: `src/lib/data.test.ts`

**Interfaces:**
- Consumes: `buildTree` (Task 2).
- Produces:
  - `Category` ganha `parentId: string | null`; `export type MenuCategory = Category & { children: Category[] }`.
  - `getMenuCategories(): Promise<MenuCategory[]>` — principais visíveis com filhas visíveis.
  - `getProductsByCategory(slug: string): Promise<{ category: Category; parent: Category | null; subcategories: Category[]; products: Product[] } | null>` — `null` se a categoria ou a mãe estiver oculta; principal: produtos dela + das filhas visíveis, `subcategories` = filhas visíveis; filha: só os produtos dela, `subcategories: []`.
  - `filterBySub(products: Product[], subcategories: Category[], sub: string | undefined): { active: string | null; products: Product[] }` — `sub` que não é slug de uma das `subcategories` → `{ active: null, products }`.

- [ ] **Step 1: Testes que falham** em `data.test.ts`: `filterBySub` filtra por `categorySlug`, devolve tudo com `active: null` para `sub` ausente, inválido ou de outra principal.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implemente. `CATEGORY_SELECT` e `mapCategory` incluem `parent_id`. `getMenuCategories` = `buildTree` sobre as visíveis em ordem (filha de mãe oculta cai como órfã). `getProductsByCategory` usa `.in('category_id', ids)`. `sitemap.ts` e `generateStaticParams` passam a usar `categories.flatMap((c) => [c, ...c.children])`. `getHomeCards` não muda.
- [ ] **Step 4:** `npm test`, `npx tsc --noEmit`. Expected: PASS (Nav/MobileMenu continuam compilando: `MenuCategory` estende `Category`).
- [ ] **Step 5:** Commit: `feat: leituras da vitrine com subcategorias`.

### Task 4: Menu suspenso e página da principal — `franco-impl-padrao`

**Files:**
- Modify: `src/components/site/Nav.tsx` + `Nav.module.css`, `src/components/site/MobileMenu.tsx` + `MobileMenu.module.css`, `src/app/(site)/categoria/[slug]/page.tsx`, `supabase/seed.sql`

**Interfaces:**
- Consumes: `MenuCategory`, `getProductsByCategory`, `filterBySub` (Task 3).

- [ ] **Step 1:** `Nav` recebe `MenuCategory[]`. Principal sem filhas: link como hoje. Principal com filhas: link da principal + lista das filhas que abre com `:hover` e `:focus-within` (CSS, sem JS), alinhada ao item, fundo branco, sombra leve, links navy Montserrat. Lista é `<ul>` de links comuns.
- [ ] **Step 2:** `MobileMenu`: cada principal seguida das filhas recuadas, todas como links que fecham o menu.
- [ ] **Step 3:** Página `/categoria/[slug]`: título "Mãe › Filha" quando há `parent`; quando há `subcategories`, botões-link "Todos" + uma por filha (`?sub=<slug>`, o ativo com `aria-current="page"`, estilo de pílula das Global Constraints) acima da grade filtrada por `filterBySub`. A parte que lê `searchParams` fica em `<Suspense>`, no padrão de `src/app/(site)/busca/page.tsx`; o carregamento cacheado por slug (`loadCategory`) continua. Lista vazia após filtro → "Ainda não há produtos nesta categoria."
- [ ] **Step 4:** `seed.sql`: categoria "Apple" com iPhone e MacBook dentro (o seed é só para desenvolvimento).
- [ ] **Step 5:** `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, `npm run e2e`. Expected: tudo passa.
- [ ] **Step 6:** Verificação manual com "Apple" (iPhone, MacBook) no banco, em 1280px e 390px: passar o mouse e navegar com Tab até as filhas; menu do celular; `/categoria/apple` com e sem `?sub=iphone` e com `?sub=xyz`; `/categoria/iphone` com título "Apple › iPhone"; ocultar "Apple" e ver o grupo sumir e `/categoria/iphone` dar 404.
- [ ] **Step 7:** Commit: `feat: menu com subcategorias e filtro na página da categoria`.

Depois da Task 4: revisão final do branch pelo `franco-revisor-senior`.
