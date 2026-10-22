// Lógica pura da importação (testada em linhas.test.mjs); importar.mjs faz a parte de rede e banco.
import { productSchema } from '../../src/lib/validation.ts';

const ANY_ID = '00000000-0000-0000-0000-000000000000'; // a categoria é conferida à parte, pelo slug
const MAX_CENTS = 99_999_999; // mesmo teto de costsSchema (validation.ts)

/** Chave de duplicado: sem maiúsculas nem espaços. */
const nameKey = (name) => String(name).toLowerCase().replace(/\s+/g, '');

/** Mesmas regras do formulário do painel; devolve a mensagem do primeiro erro ou null. */
function invalid(item) {
  const parsed = productSchema.safeParse({
    name: item.name, categoryId: ANY_ID, description: item.description ?? '', badge: null,
    featured: false, available: false, pixPercent: null, installments: null,
    optionNames: item.option_names,
    variants: Array.isArray(item.variants) ? item.variants.map((v) => ({ optionValues: v.option_values, available: true })) : item.variants,
    images: item.images,
  });
  if (!parsed.success) return parsed.error.issues[0].message;
  const okCost = (c) => c === null || (Number.isInteger(c) && c >= 0 && c <= MAX_CENTS);
  return item.variants.every((v) => okCost(v.cost_usd_cents)) ? null : 'custo em centavos de US$ inválido';
}

/** Separa o que criar do que pular. `names`: nomes já cadastrados; `slugs`: categorias que existirão. */
export function plan(items, names, slugs) {
  const seen = new Set(names.map(nameKey));
  const create = [];
  const skipped = [];
  for (const item of items) {
    const skip = (reason) => skipped.push({ name: item.name, reason });
    const error = invalid(item);
    if (error) skip(`inválido: ${error}`);
    else if (seen.has(nameKey(item.name))) skip('duplicado');
    else if (!slugs.has(item.category_slug)) skip(`categoria desconhecida: ${item.category_slug}`);
    else {
      seen.add(nameKey(item.name));
      create.push(item);
    }
  }
  return { create, skipped };
}

export function productRow(item, categoryId, slug) {
  const pt = item.description?.trim() ?? '';
  return {
    row: {
      category_id: categoryId, name: item.name.trim(), slug, description: pt || item.description_es?.trim() || '',
      available: false, featured: false, option_names: item.option_names.map((n) => n.trim()),
    },
    warning: pt ? null : 'sem descrição em português, usei a em espanhol',
  };
}

// Preço 0 e priced false (padrão da 0004), como a variação nova do painel: fica fora da vitrine até a margem
// ser preenchida na aba Cálculo, que roda recalc_prices().
export const variantRows = (item, productId) => item.variants.map((v, position) => ({
  product_id: productId, option_values: v.option_values.map((s) => s.trim()), position,
  available: true, retail_cents: 0, wholesale_cents: 0,
}));

/** `inserted`: [{ id, position }] devolvido pelo insert das variações. */
export const costRows = (item, inserted) => inserted.map((v) => ({
  variant_id: v.id, cost_usd_cents: item.variants[v.position].cost_usd_cents, margin_cents: null,
}));
