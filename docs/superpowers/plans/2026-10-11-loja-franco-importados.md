# Loja Franco Importados Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Loja virtual sem pagamento: catálogo com preço de varejo e atacado, carrinho que envia o pedido pronto ao WhatsApp da loja, e painel para a dona manter tudo sozinha.

**Architecture:** Um projeto Next.js (App Router) serve a vitrine pública e o painel `/admin`. Os dados ficam no Supabase (Postgres, login do painel, fotos); a vitrine só lê, o painel grava por server actions com sessão autenticada. Toda regra de preço e a mensagem do pedido vivem em funções puras (`src/lib/pricing.ts`, `src/lib/whatsapp.ts`) usadas por carrinho, cartões e página de produto.

**Tech Stack:** Next.js (versão estável atual do `create-next-app`), TypeScript, CSS Modules + `globals.css`, Supabase (`@supabase/supabase-js`, `@supabase/ssr`), Zod, Vitest, Playwright, Vercel.

**Spec:** `docs/superpowers/specs/2026-10-11-loja-franco-importados-design.md` — leia junto com o mockup `docs/superpowers/specs/assets/home-mockup.html`.

## Global Constraints

- Visual: réplica do mockup. Fonte Montserrat (400, 500, 700). Navy `#0e1733`, texto secundário `#95a5a6`, preço `#0f6e56`, faixa de benefícios `rgba(149,165,166,.1)`, rodapé `#ecf0f1`, dourado `#d8b26a`. Conteúdo até 1300px. Cartões e banners com raio 20px. Botões pílula (raio 40px, 10px, peso 700, caixa alta, espaçamento 1px). Layout de celular abaixo de 768px.
- O CSS de cada componente parte do bloco correspondente do mockup; não reinterpretar.
- Logo: `franco-logo-preto.png` em fundo claro, `franco-logo-branco.png` em fundo escuro. Sem redesenhar nem recolorir.
- Não usar fotos, textos, logo ou nome da PMG. Imagens de exemplo próprias.
- Dinheiro sempre em centavos inteiros (`number`); formatação só na borda, por `formatBRL`.
- Atacado: carrinho com `WHOLESALE_MIN_PIECES = 10` peças ou mais no total; a constante existe num único lugar (`src/lib/pricing.ts`).
- Textos da interface em português do Brasil, tratando o cliente por "você".
- A vitrine nunca grava no banco. Só usuário autenticado grava.
- Sem conta de cliente, sem gravação de pedidos, sem ferramenta de estatísticas.
- Celular é a tela principal: verificar cada tela em 390px e em 1280px.

## Review Focus

1. **Carrinho desatualizado:** item guardado no navegador cujo preço mudou, ficou esgotado ou foi excluído no painel. Esperado: ao abrir o carrinho, preços são atualizados e itens indisponíveis saem com aviso. → Task 9.
2. **Número do WhatsApp mal formatado ou vazio:** "(62) 99999-0000", com `+55`, ou em branco. Esperado: vira só dígitos com DDI 55; vazio desabilita "Enviar pedido" com explicação. → Task 3 e Task 9.
3. **Quantidade inválida:** 0, negativa, decimal, texto, número enorme. Esperado: inteiro entre 1 e 999. → Task 9.
4. **Texto com caracteres especiais na mensagem:** nome do cliente ou produto com `&`, `#`, `%`, emoji, quebra de linha. Esperado: a mensagem chega intacta no WhatsApp; quebras de linha no nome e cidade são removidas. → Task 3.
5. **Cadastro incoerente no painel:** atacado maior que varejo, Pix fora de 0–100, produto sem variação, combinação de variação repetida, arquivo que não é imagem ou maior que 5MB. Esperado: formulário recusa com mensagem clara. → Task 11.

---

## Estrutura de arquivos

```
src/
  app/
    layout.tsx, globals.css
    (site)/layout.tsx                 casca da vitrine
    (site)/page.tsx                   home
    (site)/categoria/[slug]/page.tsx
    (site)/busca/page.tsx
    (site)/produto/[slug]/page.tsx
    (site)/carrinho/page.tsx
    admin/login/page.tsx
    admin/(painel)/layout.tsx         exige sessão
    admin/(painel)/produtos/...       lista, novo, [id]
    admin/(painel)/categorias/page.tsx
    admin/(painel)/banners/page.tsx
    admin/(painel)/configuracoes/page.tsx
    sitemap.ts
  components/site/                    Topbar, Header, Nav, Footer, WhatsAppFloat, HeroSlider,
                                      Benefits, CategoryCards, ProductCard, ProductGrid,
                                      ChannelToggle, QuickView, VariantPicker, PriceBlock
  components/cart/                    CartProvider, CartView, CustomerForm
  components/admin/                   ProductForm, VariantsEditor, ImageUploader, ...
  lib/
    pricing.ts      regra de preço (pura)
    whatsapp.ts     mensagem e link (pura)
    variants.ts     seleção de variação (pura)
    cart.ts         reducer e reconciliação (pura)
    validation.ts   esquemas Zod do painel
    types.ts        tipos de domínio
    data.ts         leituras da vitrine
    supabase/       server.ts, browser.ts, middleware.ts
  middleware.ts
supabase/migrations/0001_init.sql, supabase/seed.sql
tests/e2e/pedido.spec.ts
public/logos/, public/placeholders/
```

---

### Task 1: Projeto, tokens e ferramentas

**Files:**
- Create: projeto Next.js na raiz; `src/app/globals.css`; `src/app/layout.tsx`; `vitest.config.ts`; `.env.example`; `.gitignore`; `public/logos/franco-logo-preto.png`, `public/logos/franco-logo-branco.png`
- Test: `src/lib/smoke.test.ts` (removido na Task 2)

**Interfaces:**
- Produces: scripts `npm run dev`, `npm run build`, `npm test` (Vitest), `npm run e2e` (Playwright); variáveis CSS `--navy`, `--gray`, `--green`, `--gold`, `--soft`, `--footer`; classe `.container`.

- [ ] **Step 1:** `git init` na raiz. A raiz já tem `design-system/`, `docs/` e um `.jpeg`, então gere o app em pasta temporária e mova: `npx create-next-app@latest franco-tmp --ts --eslint --app --src-dir --no-tailwind --import-alias "@/*" --use-npm`, mova todo o conteúdo (inclusive ocultos) de `franco-tmp/` para a raiz e apague `franco-tmp/`.
- [ ] **Step 2:** Em `.gitignore`, acrescente `.superpowers/` e `.env*.local`. Crie `.env.example` com `NEXT_PUBLIC_SUPABASE_URL=`, `NEXT_PUBLIC_SUPABASE_ANON_KEY=`, `NEXT_PUBLIC_SITE_URL=`.
- [ ] **Step 3:** Instale `vitest @vitejs/plugin-react jsdom @testing-library/react @playwright/test zod @supabase/supabase-js @supabase/ssr`. Configure `vitest.config.ts` (ambiente `jsdom`, alias `@` → `src`, `include: ['src/**/*.test.ts?(x)']`) e os scripts `test` e `e2e`.
- [ ] **Step 4:** Escreva `src/lib/smoke.test.ts` com `expect(1 + 1).toBe(2)`; rode `npm test`. Expected: 1 passed.
- [ ] **Step 5:** `src/app/layout.tsx`: `lang="pt-BR"`, Montserrat por `next/font/google` (pesos 400, 500, 700), título "Franco Importados". `globals.css`: variáveis de cor das Global Constraints, reset e `.container` copiados do mockup.
- [ ] **Step 6:** Copie as duas logos de `design-system/assets/Logos/` para `public/logos/`.
- [ ] **Step 7:** Rode `npm run build`. Expected: build sem erros.
- [ ] **Step 8:** Commit: `chore: scaffold Next.js, tokens e ferramentas de teste`.

---

### Task 2: Regra de preço

**Files:**
- Create: `src/lib/types.ts`, `src/lib/pricing.ts`
- Test: `src/lib/pricing.test.ts`
- Delete: `src/lib/smoke.test.ts`

**Interfaces:**
- Produces:

```ts
// types.ts
export type Channel = 'varejo' | 'atacado';
export type CartLine = {
  variantId: string; productId: string; slug: string; name: string;
  optionLabel: string;            // "Azul, 256GB" ou ""
  image: string | null;
  retailCents: number; wholesaleCents: number;
  pixPercent: number | null; installments: number | null;
  qty: number;
};
export type PricedLine = CartLine & { unitCents: number; subtotalCents: number; subtotalPixCents: number };
export type CartSummary = {
  channel: Channel; pieces: number; missingForWholesale: number;
  lines: PricedLine[]; totalCents: number; totalPixCents: number;
};

// pricing.ts
export const WHOLESALE_MIN_PIECES = 10;
export function formatBRL(cents: number): string;                      // 899000 -> "R$ 8.990,00"
export function pixCents(cents: number, pixPercent: number | null): number;
export function installmentCents(cents: number, installments: number): number;
export function unitCents(p: { retailCents: number; wholesaleCents: number }, channel: Channel): number;
export function summarize(lines: CartLine[]): CartSummary;
```

- [ ] **Step 1: Testes que falham** em `pricing.test.ts`:

```ts
const iphone = { variantId:'v1', productId:'p1', slug:'iphone-17-pro', name:'iPhone 17 Pro', optionLabel:'Azul, 256GB',
  image:null, retailCents:967072, wholesaleCents:899000, pixPercent:10, installments:12, qty:2 };
const khamrah = { variantId:'v2', productId:'p2', slug:'khamrah', name:'Lattafa Khamrah EDP 100ml', optionLabel:'',
  image:null, retailCents:34990, wholesaleCents:21990, pixPercent:10, installments:null, qty:10 };

test('formatBRL', () => { expect(formatBRL(899000)).toBe('R$ 8.990,00'); expect(formatBRL(21990)).toBe('R$ 219,90'); expect(formatBRL(0)).toBe('R$ 0,00'); });
test('pixCents arredonda por unidade', () => { expect(pixCents(21990, 10)).toBe(19791); expect(pixCents(21990, null)).toBe(21990); expect(pixCents(999, 33)).toBe(669); });
test('installmentCents', () => { expect(installmentCents(1074532, 12)).toBe(89544); });
test('9 peças é varejo e avisa quanto falta', () => {
  const s = summarize([{ ...khamrah, qty: 9 }]);
  expect(s.channel).toBe('varejo'); expect(s.pieces).toBe(9); expect(s.missingForWholesale).toBe(1);
  expect(s.totalCents).toBe(9 * 34990);
});
test('10 peças somando produtos diferentes vira atacado para todos', () => {
  const s = summarize([iphone, khamrah]);                       // 12 peças
  expect(s.channel).toBe('atacado'); expect(s.missingForWholesale).toBe(0);
  expect(s.lines[0].unitCents).toBe(899000); expect(s.lines[1].unitCents).toBe(21990);
  expect(s.totalCents).toBe(2017900); expect(s.totalPixCents).toBe(1816110);
});
test('carrinho vazio', () => { const s = summarize([]); expect(s.pieces).toBe(0); expect(s.channel).toBe('varejo'); expect(s.missingForWholesale).toBe(10); expect(s.totalCents).toBe(0); });
```

- [ ] **Step 2:** `npm test`. Expected: FAIL, funções não definidas.
- [ ] **Step 3:** Implemente `types.ts` e `pricing.ts` com as assinaturas acima. `pixCents` = `Math.round(cents * (100 - pct) / 100)`; o Pix de uma linha é `pixCents(unitCents) * qty`. `formatBRL` usa `Intl.NumberFormat('pt-BR')` e normaliza o espaço não separável para espaço comum.
- [ ] **Step 4:** `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: regra de preço varejo/atacado, Pix e parcelas`.

---

### Task 3: Mensagem e link do WhatsApp

**Files:**
- Create: `src/lib/whatsapp.ts`
- Test: `src/lib/whatsapp.test.ts`

**Interfaces:**
- Consumes: `CartSummary`, `formatBRL` (Task 2).
- Produces:

```ts
export type Customer = { name: string; city: string };
export function normalizePhone(raw: string): string | null;   // só dígitos com DDI 55; null se inválido
export function buildOrderMessage(summary: CartSummary, customer: Customer): string;
export function whatsappUrl(phone: string, message?: string): string;  // https://wa.me/<phone>?text=<encoded>
```

- [ ] **Step 1: Testes que falham:**

```ts
test('normalizePhone', () => {
  expect(normalizePhone('(62) 99999-0000')).toBe('5562999990000');
  expect(normalizePhone('+55 62 99999-0000')).toBe('5562999990000');
  expect(normalizePhone('6233330000')).toBe('556233330000');
  expect(normalizePhone('')).toBeNull(); expect(normalizePhone('123')).toBeNull();
});
test('mensagem de atacado no formato do spec', () => {
  const msg = buildOrderMessage(summarize([iphone, khamrah]), { name: 'Maria Souza', city: 'Goiânia - GO' });
  expect(msg).toBe(
`Olá! Quero fazer um pedido pelo site.

Nome: Maria Souza
Cidade: Goiânia - GO
Tipo: ATACADO (12 peças)

1. iPhone 17 Pro — Azul, 256GB
   2 x R$ 8.990,00 = R$ 17.980,00
2. Lattafa Khamrah EDP 100ml
   10 x R$ 219,90 = R$ 2.199,00

Total: R$ 20.179,00
Total no Pix: R$ 18.161,10`);
});
test('varejo de 1 peça, sem Pix', () => {
  const msg = buildOrderMessage(summarize([{ ...khamrah, qty: 1, pixPercent: null }]), { name: 'Ana', city: 'Rio' });
  expect(msg).toContain('Tipo: VAREJO (1 peça)'); expect(msg).not.toContain('Total no Pix');
});
test('nome e cidade perdem quebras de linha e espaços extras', () => {
  const msg = buildOrderMessage(summarize([khamrah]), { name: '  Ana\nTipo: X ', city: 'Rio\r\n' });
  expect(msg).toContain('Nome: Ana Tipo: X\n'); expect(msg).toContain('Cidade: Rio\n');
});
test('url codifica caracteres especiais', () => {
  const url = whatsappUrl('5562999990000', 'Perfume & Cia #1 100% 😀\nlinha');
  expect(url.startsWith('https://wa.me/5562999990000?text=')).toBe(true);
  expect(decodeURIComponent(url.split('text=')[1])).toBe('Perfume & Cia #1 100% 😀\nlinha');
});
```

- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implemente. `normalizePhone`: remove não dígitos; 10 ou 11 dígitos recebem `55` na frente; 12 ou 13 começando com `55` passam; o resto é `null`. A linha "Total no Pix" só aparece quando `totalPixCents !== totalCents`. A linha do item omite " — …" quando `optionLabel` é vazio.
- [ ] **Step 4:** `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: mensagem do pedido e link do WhatsApp`.

---

### Task 4: Banco, dados de exemplo e leituras

**Precisa de uma pessoa:** criar um projeto no Supabase, desativar cadastro público (Authentication → Sign In / Providers → "Allow new users to sign up" desligado), criar os dois usuários do painel e preencher `.env.local`.

**Files:**
- Create: `supabase/migrations/0001_init.sql`, `supabase/seed.sql`, `src/lib/supabase/server.ts`, `src/lib/supabase/browser.ts`, `src/lib/data.ts`, `public/placeholders/*.svg`
- Modify: `src/lib/types.ts`
- Test: `src/lib/data.test.ts`

**Interfaces:**
- Produces (tabelas, todas com `id uuid` e leitura pública por RLS; escrita só para `authenticated`):
  - `categories(name, slug unique, position int, visible bool, home_card bool, home_card_image text, home_card_tag text)`
  - `products(category_id fk, name, slug unique, description text, featured bool, available bool, badge text null, pix_percent numeric null, installments int null, option_names text[] default '{}', created_at)`
  - `product_images(product_id fk cascade, url text, position int)`
  - `variants(product_id fk cascade, option_values text[] default '{}', retail_cents int, wholesale_cents int, available bool, position int)` — todo produto tem ao menos uma; produto sem variação tem uma com `option_values` vazio
  - `banners(image_desktop, image_mobile, alt, link null, position int, active bool)`
  - `settings(id int primary key check (id = 1), whatsapp_number text, topbar_text text)`
  - `categories` não pode ser excluída se tiver produtos (`on delete restrict`)
  - bucket de Storage `media`: leitura pública, escrita para `authenticated`
- Produces (código):

```ts
// types.ts
export type Category = { id: string; name: string; slug: string; homeCard: boolean; homeCardImage: string | null; homeCardTag: string | null };
export type Variant = { id: string; optionValues: string[]; retailCents: number; wholesaleCents: number; available: boolean };
export type Product = {
  id: string; slug: string; name: string; description: string; categorySlug: string;
  images: string[]; badge: string | null; available: boolean; featured: boolean;
  pixPercent: number | null; installments: number | null;
  optionNames: string[]; variants: Variant[];
};
export type Banner = { id: string; imageDesktop: string; imageMobile: string; alt: string; link: string | null };
export type Settings = { whatsappNumber: string; topbarText: string };

// data.ts
export function mapProduct(row: ProductRow): Product;      // ordena imagens e variantes por position
export function fromPrices(p: Product): { retailCents: number; wholesaleCents: number; hasRange: boolean } | null; // menor preço entre variantes disponíveis; null se nenhuma
export function isSoldOut(p: Product): boolean;            // !available ou nenhuma variante disponível
export async function getSettings(): Promise<Settings>;
export async function getMenuCategories(): Promise<Category[]>;   // visible, por position
export async function getHomeCards(): Promise<Category[]>;        // home_card, até 3
export async function getActiveBanners(): Promise<Banner[]>;
export async function getFeaturedProducts(): Promise<Product[]>;
export async function getProductsByCategory(slug: string): Promise<{ category: Category; products: Product[] } | null>;
export async function searchProducts(q: string): Promise<Product[]>;   // ilike no nome; q vazio -> []
export async function getProductBySlug(slug: string): Promise<Product | null>;
export async function getVariantsByIds(ids: string[]): Promise<Array<{ variant: Variant; product: Product }>>;
```

- [ ] **Step 1: Testes que falham** em `data.test.ts`, com linhas montadas à mão: `mapProduct` ordena variantes e imagens por `position`; `fromPrices` devolve o menor preço entre as disponíveis com `hasRange: true` quando há preços diferentes, e `null` quando todas estão esgotadas; `isSoldOut` é `true` para `available: false` e para produto sem variante disponível.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Escreva `0001_init.sql` com as tabelas, RLS, a linha única de `settings` (`whatsapp_number` `'5500000000000'`, `topbar_text` `'10% OFF no Pix em todo o site'`) e o bucket.
- [ ] **Step 4:** Escreva `seed.sql`: categorias iPhone, MacBook, PlayStation, Xiaomi, Perfumes árabes, Perfumes importados; cartões da home em iPhone ("ORIGINAIS · LACRADOS"), MacBook ("ORIGINAIS · LACRADOS") e Perfumes árabes ("IMPORTADOS · ÁRABES"); 16 produtos fictícios (8 eletrônicos, 8 perfumes) com os nomes e preços do mockup, 8 deles em destaque, ao menos 3 com variações (cor e armazenamento nos iPhones, tamanho em um perfume), 1 esgotado; 3 banners. Imagens apontam para `/placeholders/*.svg`.
- [ ] **Step 5:** Crie os SVGs em `public/placeholders/` a partir das funções de desenho do mockup (`phone`, `xiaomi`, `laptop`, `ps5`, `perfume`) e três banners (1425×540 e 800×800).
- [ ] **Step 6:** Implemente os clientes Supabase (padrão `@supabase/ssr` para App Router) e `data.ts`.
- [ ] **Step 7:** `npm test`. Expected: PASS.
- [ ] **Step 8 (pessoa):** rode `0001_init.sql` e depois `seed.sql` no SQL Editor do Supabase. Verificação: `select count(*) from products` devolve 16.
- [ ] **Step 9:** Commit: `feat: esquema do banco, dados de exemplo e leituras da vitrine`.

---

### Task 5: Casca da vitrine

**Files:**
- Create: `src/app/(site)/layout.tsx`; `src/components/site/{Topbar,Header,Nav,MobileMenu,Footer,WhatsAppFloat}.tsx` com seus `.module.css`
- Test: `src/components/site/Header.test.tsx`

**Interfaces:**
- Consumes: `getSettings`, `getMenuCategories` (Task 4); `normalizePhone`, `whatsappUrl` (Task 3).
- Produces: layout que envolve todas as páginas da vitrine. `Header` recebe `{ whatsappHref: string | null; cartCount: number }` (o número vem do carrinho na Task 9; até lá, 0).

- [ ] **Step 1: Teste que falha:** `Header` renderiza a logo com `alt="Franco Importados — atacado e varejo"`, um formulário de busca com `action="/busca"` e campo `name="q"`, os atalhos "Atendimento" e "Meu carrinho", e **não** renderiza "Minha conta". Com `whatsappHref: null`, "Atendimento" não é link.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implemente os componentes portando o CSS dos blocos `.topbar`, `.head*`, `.nav-row`, `footer`, `.wa` do mockup. Menu: "Início" (`/`) seguido das categorias (`/categoria/[slug]`). No celular, o botão de menu abre `MobileMenu` com os mesmos links. Rodapé e textos dele são fixos no código; o contato usa o número das configurações.
- [ ] **Step 4:** `npm test`. Expected: PASS.
- [ ] **Step 5:** `npm run dev`; compare com o mockup em 1280px e 390px (cabeçalho, menu, rodapé, botão flutuante).
- [ ] **Step 6:** Commit: `feat: cabeçalho, menu, rodapé e atalho do WhatsApp`.

---

### Task 6: Home

**Files:**
- Create: `src/app/(site)/page.tsx`; `src/components/site/{HeroSlider,Benefits,CategoryCards,ProductGrid,ProductCard,PriceBlock,ChannelToggle,ChannelProvider}.tsx` com `.module.css`
- Test: `src/components/site/ProductCard.test.tsx`, `src/components/site/PriceBlock.test.tsx`

**Interfaces:**
- Consumes: `getActiveBanners`, `getHomeCards`, `getFeaturedProducts`, `fromPrices`, `isSoldOut` (Task 4); `pixCents`, `installmentCents`, `formatBRL`, `Channel` (Task 2).
- Produces:
  - `ChannelProvider` + `useChannel(): { channel: Channel; setChannel(c: Channel): void }` — estado da tabela exibida, guardado em `sessionStorage`.
  - `PriceBlock({ retailCents, wholesaleCents, pixPercent, installments, channel, from?: boolean })`.
  - `ProductCard({ product })`, `ProductGrid({ products })`, `ChannelToggle()`.

- [ ] **Step 1: Testes que falham:**
  - `PriceBlock` varejo, 967072 / 899000, Pix 10, 12 parcelas → "R$ 8.703,65 com Pix" e "ou 12x de R$ 805,89".
  - `PriceBlock` atacado, mesmos dados → "R$ 8.091,00 com Pix", "R$ 8.990,00 por peça" e "a partir de 10 peças"; sem linha de parcelas.
  - `PriceBlock` sem Pix e sem parcelas → só "R$ 9.670,72", sem "com Pix" e sem "ou".
  - `PriceBlock` com `from` → texto começa com "a partir de".
  - `ProductCard` de produto esgotado mostra "Esgotado" e não tem o botão "Comprar".
  - `ProductCard` com variações: "Comprar" é link para `/produto/[slug]`.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implemente portando `.slider`, `.info`, `.banners`, `.sec-title`, `.channel`, `.grid`, `.item*`, `.btn*`, `.label*` do mockup. Seções na ordem do spec. Benefícios fixos: "Desconto no Pix", "Atacado a partir de 10 peças", "Enviamos para todo o Brasil com seguro", "Pedido finalizado pelo WhatsApp". O slider troca a cada 6s, com setas e marcadores; usa `image_mobile` abaixo de 768px. Título da grade: "Lançamentos", com `ChannelToggle` logo abaixo. "Espiar" fica como link para a página do produto até a Task 8.
- [ ] **Step 4:** `npm test`. Expected: PASS.
- [ ] **Step 5:** `npm run dev`; compare a home com o mockup em 1280px e 390px; troque Varejo/Atacado e confira que os preços mudam.
- [ ] **Step 6:** Commit: `feat: home com banners, categorias e lançamentos`.

---

### Task 7: Categoria e busca

**Files:**
- Create: `src/app/(site)/categoria/[slug]/page.tsx`, `src/app/(site)/busca/page.tsx`, `src/app/(site)/not-found.tsx`

**Interfaces:**
- Consumes: `getProductsByCategory`, `searchProducts` (Task 4); `ProductGrid`, `ChannelToggle` (Task 6).

- [ ] **Step 1:** Categoria: título com o nome, `ChannelToggle`, `ProductGrid`. Slug inexistente → `notFound()`. Categoria sem produtos → "Ainda não há produtos nesta categoria."
- [ ] **Step 2:** Busca: lê `?q=`. Título `Resultados para "<q>"`. Sem resultado → `Nenhum produto encontrado para "<q>".` com link para a home. `q` vazio → "Digite o que você procura na busca."
- [ ] **Step 3:** `npm run dev`; verifique `/categoria/iphone`, `/categoria/nao-existe` (404), `/busca?q=lattafa`, `/busca?q=zzz`, `/busca`.
- [ ] **Step 4:** Commit: `feat: páginas de categoria e busca`.

---

### Task 8: Página do produto e "Espiar"

**Files:**
- Create: `src/lib/variants.ts`; `src/app/(site)/produto/[slug]/page.tsx`; `src/components/site/{ProductDetail,VariantPicker,Gallery,QuantityInput,QuickView}.tsx` com `.module.css`
- Modify: `src/components/site/ProductCard.tsx` ("Espiar" abre `QuickView`)
- Test: `src/lib/variants.test.ts`, `src/components/site/QuantityInput.test.tsx`

**Interfaces:**
- Consumes: `Product`, `Variant`, `CartLine` (Tasks 2 e 4); `PriceBlock`, `useChannel` (Task 6).
- Produces:

```ts
// variants.ts
export function findVariant(p: Product, selected: (string | null)[]): Variant | null;   // só quando todas as opções estão escolhidas
export function optionValues(p: Product, index: number): string[];                       // valores distintos, na ordem das variantes
export function isValueAvailable(p: Product, selected: (string | null)[], index: number, value: string): boolean;
export function toCartLine(p: Product, v: Variant, qty: number): CartLine;              // optionLabel = optionValues.join(', ')
export function clampQty(raw: unknown): number;                                          // inteiro 1..999
```
  - `ProductDetail({ product, onAdd })` — usado na página e no `QuickView`. `onAdd(line: CartLine)` é ligado ao carrinho na Task 9.

- [ ] **Step 1: Testes que falham:**
  - `findVariant` devolve `null` com opção faltando e a variante certa com tudo escolhido.
  - `isValueAvailable` é `false` para "512GB" quando, com "Azul" escolhido, a combinação Azul+512GB está esgotada.
  - `toCartLine` copia preços, Pix e parcelas e monta `optionLabel` "Azul, 256GB".
  - `clampQty`: `0`→1, `-3`→1, `2.7`→2, `'abc'`→1, `5000`→999, `'12'`→12.
  - `QuantityInput` com valor 1 não deixa o botão "menos" baixar de 1.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implemente. Página: galeria, nome, `VariantPicker` (um grupo de botões por `optionNames`; valor indisponível aparece riscado e desabilitado), os dois preços lado a lado (varejo e atacado, o do canal atual em destaque), quantidade, "Adicionar ao carrinho", descrição. Sem variação escolhida, o botão fica desabilitado com "Escolha as opções". Produto esgotado mostra "Esgotado" e não tem botão. Slug inexistente → `notFound()`. `QuickView` é um diálogo acessível (fecha com Esc e clique fora) com o mesmo `ProductDetail`.
- [ ] **Step 4:** `npm test`. Expected: PASS.
- [ ] **Step 5:** `npm run dev`; teste um iPhone com variações, um perfume sem variação e o produto esgotado, na página e pelo "Espiar", em 390px e 1280px.
- [ ] **Step 6:** Commit: `feat: página do produto, variações e visualização rápida`.

---

### Task 9: Carrinho e envio do pedido

**Files:**
- Create: `src/lib/cart.ts`; `src/components/cart/{CartProvider,CartView,CustomerForm}.tsx` com `.module.css`; `src/app/(site)/carrinho/page.tsx`; `src/app/(site)/carrinho/actions.ts`
- Modify: `src/app/(site)/layout.tsx` (envolve com `CartProvider`, passa a contagem ao `Header`); `ProductDetail` e `ProductCard` (ligam `onAdd`)
- Test: `src/lib/cart.test.ts`, `src/components/cart/CartView.test.tsx`

**Interfaces:**
- Consumes: `summarize`, `WHOLESALE_MIN_PIECES` (Task 2); `buildOrderMessage`, `whatsappUrl`, `normalizePhone` (Task 3); `getVariantsByIds`, `getSettings` (Task 4); `toCartLine`, `clampQty` (Task 8).
- Produces:

```ts
// cart.ts
export type CartAction =
  | { type: 'add'; line: CartLine } | { type: 'setQty'; variantId: string; qty: number }
  | { type: 'remove'; variantId: string } | { type: 'clear' } | { type: 'replace'; lines: CartLine[] };
export function cartReducer(lines: CartLine[], action: CartAction): CartLine[];
export function reconcileCart(lines: CartLine[], fresh: Array<{ variant: Variant; product: Product }>):
  { lines: CartLine[]; removed: string[]; priceChanged: boolean };   // removed = nomes para o aviso
// CartProvider
export function useCart(): { lines: CartLine[]; summary: CartSummary; ready: boolean; dispatch(a: CartAction): void };
// actions.ts
export async function refreshCart(variantIds: string[]): Promise<Array<{ variant: Variant; product: Product }>>;
```
  - Chave do `localStorage`: `franco.cart.v1`.

- [ ] **Step 1: Testes que falham:**
  - `add` da mesma `variantId` soma quantidades, com teto de 999; `setQty` com 0, -1, 2.5 e 5000 resulta em 1, 1, 2 e 999; `remove` tira a linha; `clear` zera.
  - `reconcileCart`: linha cuja variante não veio em `fresh` sai e seu nome entra em `removed`; linha de variante ou produto com `available: false` sai; linha com preço diferente é atualizada e `priceChanged` é `true`; quantidade é preservada.
  - `CartView` com 7 peças mostra "Faltam 3 peças para o preço de atacado"; com 9 mostra "Falta 1 peça para o preço de atacado"; com 10 mostra "Preço de atacado aplicado".
  - `CartView` com `whatsappNumber` inválido: "Enviar pedido" desabilitado e o texto "Pedidos pelo WhatsApp estão indisponíveis no momento."
  - `CartView`: nome ou cidade em branco impedem o envio e mostram "Informe seu nome e sua cidade."
  - Carrinho vazio mostra "Seu carrinho está vazio." com link para a home.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implemente. `CartProvider` lê o `localStorage` depois de montar (`ready`), grava a cada mudança e ignora conteúdo corrompido (começa vazio). Ao abrir `/carrinho`, chama `refreshCart` e aplica `reconcileCart`; se algo saiu, mostra "Removemos do carrinho por indisponibilidade: <nomes>."; se preço mudou, "Alguns preços foram atualizados." `CartView`: lista com foto, nome, variação, quantidade, preço unitário e subtotal; resumo com tipo (Varejo ou Atacado), total e total no Pix; `CustomerForm` (nome, cidade, guardados no `localStorage` em `franco.customer.v1`); "Enviar pedido" abre `whatsappUrl(...)` em nova aba; "Copiar pedido" copia a mesma mensagem; "Esvaziar carrinho" pede confirmação. O carrinho não é limpo após enviar. "Adicionar ao carrinho" mostra confirmação com link "Ver carrinho".
- [ ] **Step 4:** `npm test`. Expected: PASS.
- [ ] **Step 5:** `npm run dev`; adicione 9 peças, confira o aviso, suba para 10 e veja todos os preços mudarem; envie e confira a mensagem aberta no WhatsApp contra o formato do spec.
- [ ] **Step 6:** Commit: `feat: carrinho com regra de atacado e envio pelo WhatsApp`.

---

### Task 10: Login do painel

**Files:**
- Create: `src/middleware.ts`, `src/lib/supabase/middleware.ts`, `src/app/admin/login/page.tsx`, `src/app/admin/login/actions.ts`, `src/app/admin/(painel)/layout.tsx`, `src/app/admin/(painel)/page.tsx`, `src/lib/auth.ts`

**Interfaces:**
- Produces: `requireUser(): Promise<User>` em `src/lib/auth.ts` — redireciona para `/admin/login` sem sessão; toda server action do painel chama essa função antes de gravar. Layout do painel com navegação: Produtos, Categorias, Banners, Configurações, Sair.

- [ ] **Step 1:** Middleware renova a sessão Supabase e redireciona qualquer `/admin/*` sem sessão para `/admin/login` (exceto a própria página de login).
- [ ] **Step 2:** Login por e-mail e senha. Erro: "E-mail ou senha incorretos." Sucesso → `/admin/produtos`. `/admin` redireciona para `/admin/produtos`. Não existe tela de cadastro nem de recuperar senha.
- [ ] **Step 3:** Layout simples, legível no celular, com a logo e a navegação. `<meta name="robots" content="noindex">` em todo `/admin`.
- [ ] **Step 4:** Verificação manual: `/admin/produtos` sem sessão cai no login; senha errada mostra o erro; login certo entra; "Sair" volta ao login.
- [ ] **Step 5:** Commit: `feat: login e proteção do painel`.

---

### Task 11: Painel de produtos

**Files:**
- Create: `src/lib/validation.ts`; `src/app/admin/(painel)/produtos/{page.tsx,novo/page.tsx,[id]/page.tsx,actions.ts}`; `src/components/admin/{ProductForm,VariantsEditor,ImageUploader,MoneyInput}.tsx`
- Test: `src/lib/validation.test.ts`

**Interfaces:**
- Consumes: `requireUser` (Task 10); tabelas da Task 4.
- Produces:

```ts
// validation.ts
export const productSchema: z.ZodType<ProductInput>;
export type ProductInput = {
  name: string; categoryId: string; description: string; badge: string | null;
  featured: boolean; available: boolean;
  pixPercent: number | null; installments: number | null;
  optionNames: string[];                       // 0 a 3 nomes
  variants: Array<{ id?: string; optionValues: string[]; retailCents: number; wholesaleCents: number; available: boolean }>;
  images: string[];
};
export function parseMoney(input: string): number | null;   // "8.990,00" -> 899000; "219,9" -> 21990
export function slugify(name: string): string;              // "MacBook Air M4 13\"" -> "macbook-air-m4-13"
export function validateImageFile(f: { type: string; size: number }): string | null;  // mensagem de erro ou null
// actions.ts
export async function saveProduct(id: string | null, input: unknown): Promise<{ ok: true; id: string } | { ok: false; errors: Record<string, string> }>;
export async function deleteProduct(id: string): Promise<void>;
export async function setFeatured(id: string, value: boolean): Promise<void>;
export async function setAvailable(id: string, value: boolean): Promise<void>;
```

- [ ] **Step 1: Testes que falham:**
  - `parseMoney`: `'8.990,00'`→899000, `'219,9'`→21990, `'1500'`→150000, `''`→null, `'abc'`→null, `'-5'`→null.
  - `slugify`: `'MacBook Air M4 13"'`→`'macbook-air-m4-13'`, `'Perfume Árabe Ção'`→`'perfume-arabe-cao'`.
  - `productSchema` recusa, cada um com mensagem em português no campo certo: nome vazio; nenhuma variante; atacado maior que varejo ("O preço de atacado não pode ser maior que o de varejo."); preço zero; `pixPercent` 0, negativo ou acima de 100 (vazio é aceito como `null`); `installments` fora de 1 a 24; `optionValues` com quantidade diferente de `optionNames`; duas variantes com a mesma combinação ("Há variações repetidas."); produto sem `optionNames` com mais de uma variante.
  - `validateImageFile`: aceita `image/jpeg`, `image/png`, `image/webp` até 5MB; recusa `application/pdf` ("Envie uma imagem JPG, PNG ou WebP.") e 6MB ("A imagem deve ter até 5MB.").
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implemente `validation.ts`.
- [ ] **Step 4:** Lista: foto, nome, categoria, menor preço, interruptores "Destaque" e "Disponível" que gravam na hora, busca por nome, botão "Novo produto". Formulário: todos os campos de `ProductInput`; `VariantsEditor` define os nomes das opções e uma linha por combinação (valores, varejo, atacado, disponível); produto sem opções mostra só um par de preços. `ImageUploader` envia ao bucket `media`, permite reordenar e remover. Excluir pede confirmação. As actions chamam `requireUser`, validam com `productSchema`, geram slug único (sufixo `-2`, `-3`… em colisão) e chamam `revalidatePath` para `/`, a categoria e o produto.
- [ ] **Step 5:** `npm test`. Expected: PASS.
- [ ] **Step 6:** Verificação manual: criar produto com 2 opções e 4 variações, enviar 2 fotos, marcar destaque e vê-lo em "Lançamentos"; marcar esgotado e ver na vitrine; tentar salvar atacado maior que varejo e ver o erro; excluir.
- [ ] **Step 7:** Commit: `feat: painel de produtos com variações, fotos, destaque e disponibilidade`.

---

### Task 12: Painel de categorias, banners e configurações

**Files:**
- Create: `src/app/admin/(painel)/{categorias,banners,configuracoes}/{page.tsx,actions.ts}`
- Modify: `src/lib/validation.ts`
- Test: `src/lib/validation.test.ts`

**Interfaces:**
- Consumes: `requireUser`, `slugify`, `validateImageFile`, `ImageUploader` (Tasks 10 e 11); `normalizePhone` (Task 3).
- Produces: `categorySchema`, `bannerSchema`, `settingsSchema` em `validation.ts`; actions `saveCategory`, `deleteCategory`, `reorderCategories`, `saveBanner`, `deleteBanner`, `reorderBanners`, `saveSettings`, todas devolvendo `{ ok: true } | { ok: false; errors }`.

- [ ] **Step 1: Testes que falham:** `settingsSchema` recusa número que `normalizePhone` não aceita ("Informe um número de WhatsApp com DDD.") e grava a forma normalizada; `topbarText` aceita vazio e recusa mais de 80 caracteres; `categorySchema` recusa nome vazio; `bannerSchema` exige as duas imagens e aceita link vazio ou caminho/URL válidos.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Categorias: criar, renomear, ordenar (subir/descer), mostrar/ocultar no menu, marcar como cartão da home com imagem e tag. Mais de 3 cartões marcados → erro "Escolha no máximo 3 categorias para a home." Excluir categoria com produtos → "Mova ou exclua os produtos desta categoria antes."
- [ ] **Step 4:** Banners: adicionar, trocar imagem de tela larga e de celular, texto alternativo, link, ordem, ativo/inativo. Sem banner ativo, a home não mostra o slider.
- [ ] **Step 5:** Configurações: número do WhatsApp e texto da faixa do topo. Faixa vazia some da vitrine. Todas as actions chamam `revalidatePath('/', 'layout')`.
- [ ] **Step 6:** `npm test`. Expected: PASS.
- [ ] **Step 7:** Verificação manual: trocar o número e conferir o link do botão flutuante e do pedido; reordenar o menu; desativar um banner.
- [ ] **Step 8:** Commit: `feat: painel de categorias, banners e configurações`.

---

### Task 13: Busca no Google, teste de ponta a ponta, design system e publicação

**Files:**
- Create: `src/app/sitemap.ts`, `src/app/robots.ts`, `playwright.config.ts`, `tests/e2e/pedido.spec.ts`
- Modify: `generateMetadata` nas páginas de produto e categoria; `design-system/README.md`, `design-system/tokens.css`, `design-system/tokens.json`

- [ ] **Step 1:** Metadados: título `<nome> | Franco Importados`, descrição (primeiros 155 caracteres da descrição do produto) e imagem Open Graph por produto; título por categoria. `sitemap.ts` lista home, categorias visíveis e produtos; `robots.ts` bloqueia `/admin` e `/carrinho`.
- [ ] **Step 2: Teste e2e** `pedido.spec.ts` (viewport 390×844, contra `npm run dev` com os dados de exemplo): abre a home; entra num perfume sem variação; define quantidade 9 e adiciona; no carrinho vê "Falta 1 peça para o preço de atacado" e "Varejo"; aumenta para 10 e vê "Atacado"; preenche nome "Teste" e cidade "Goiânia"; confere que o link de "Enviar pedido" começa com `https://wa.me/` e que o texto decodificado contém "Tipo: ATACADO (10 peças)" e "Nome: Teste".
- [ ] **Step 3:** `npm run e2e`. Expected: 1 passed.
- [ ] **Step 4:** Atualize `design-system/`: tokens com as cores, fonte, raios e medidas das Global Constraints; README reescrito para o novo padrão, dizendo que a vitrine em `src/` e o mockup são a referência e que só as logos da pasta continuam em uso. Remova as regras de preto e branco, Bodoni Moda e Jost.
- [ ] **Step 5:** `npm test && npm run build`. Expected: tudo passa.
- [ ] **Step 6 (pessoa):** criar o projeto na Vercel a partir do repositório, preencher as três variáveis de ambiente e publicar. Verificação: a home publicada mostra os produtos de exemplo e `/admin` pede login.
- [ ] **Step 7:** Commit: `feat: SEO, teste de ponta a ponta e design system atualizado`.
