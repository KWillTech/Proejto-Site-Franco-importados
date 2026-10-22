import { describe, expect, it } from 'vitest';
import { costRows, plan, productRow, variantRows } from './linhas.mjs';

const item = (over = {}) => ({
  name: 'iPhone 17 Pro', category_slug: 'iphone-celulares', description_es: 'texto es', description: 'texto pt',
  option_names: ['Cor'], images: [], variants: [{ option_values: ['Preto'], cost_usd_cents: 118000, source_url: 'x' }],
  ...over,
});
const slugs = new Set(['iphone-celulares']);

describe('plan', () => {
  it('pula nome já cadastrado, sem diferenciar maiúsculas e espaços', () => {
    const r = plan([item({ name: '  iphone  17PRO ' })], ['iPhone 17 Pro'], slugs);
    expect(r.create).toEqual([]);
    expect(r.skipped).toEqual([{ name: '  iphone  17PRO ', reason: 'duplicado' }]);
  });

  it('pula o segundo item repetido no próprio arquivo', () => {
    const r = plan([item(), item({ name: 'IPHONE 17 PRO' })], [], slugs);
    expect(r.create.map((i) => i.name)).toEqual(['iPhone 17 Pro']);
    expect(r.skipped).toEqual([{ name: 'IPHONE 17 PRO', reason: 'duplicado' }]);
  });

  it('pula categoria desconhecida', () => {
    const r = plan([item({ category_slug: 'perfumes' })], [], slugs);
    expect(r.skipped).toEqual([{ name: 'iPhone 17 Pro', reason: 'categoria desconhecida: perfumes' }]);
  });

  it('pula item inválido: variação sem todos os valores ou custo fora do formato', () => {
    const r = plan([
      item({ variants: [{ option_values: [], cost_usd_cents: 100 }] }),
      item({ name: 'Outro', variants: [{ option_values: ['Preto'], cost_usd_cents: 10.5 }] }),
    ], [], slugs);
    expect(r.create).toEqual([]);
    expect(r.skipped.map((s) => s.reason)).toEqual([
      'inválido: Preencha todas as opções desta variação.',
      'inválido: custo em centavos de US$ inválido',
    ]);
  });
});

describe('linhas', () => {
  it('produto novo entra indisponível, fora dos destaques e sem perder as opções', () => {
    expect(productRow(item(), 'cat-1', 'iphone-17-pro')).toEqual({
      row: {
        category_id: 'cat-1', name: 'iPhone 17 Pro', slug: 'iphone-17-pro', description: 'texto pt',
        available: false, featured: false, option_names: ['Cor'],
      },
      warning: null,
    });
  });

  it('sem descrição em português usa a espanhola e avisa', () => {
    const r = productRow(item({ description: '  ' }), 'cat-1', 's');
    expect(r.row.description).toBe('texto es');
    expect(r.warning).toMatch(/espanhol/);
  });

  it('variações sem preço (0, fora da vitrine) e custo sem margem', () => {
    const it2 = item({ variants: [
      { option_values: ['Preto'], cost_usd_cents: 118000 },
      { option_values: ['Branco'], cost_usd_cents: 120000 },
    ] });
    expect(variantRows(it2, 'p1')).toEqual([
      { product_id: 'p1', option_values: ['Preto'], position: 0, available: true, retail_cents: 0, wholesale_cents: 0 },
      { product_id: 'p1', option_values: ['Branco'], position: 1, available: true, retail_cents: 0, wholesale_cents: 0 },
    ]);
    // O banco pode devolver fora de ordem: o custo segue a posição, não o índice da resposta.
    expect(costRows(it2, [{ id: 'v2', position: 1 }, { id: 'v1', position: 0 }])).toEqual([
      { variant_id: 'v2', cost_usd_cents: 120000, margin_cents: null },
      { variant_id: 'v1', cost_usd_cents: 118000, margin_cents: null },
    ]);
  });
});
