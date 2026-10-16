import { describe, expect, it } from 'vitest';
import { cartReducer, parseCart, reconcileCart } from './cart';
import { iphone, khamrah } from './test-fixtures';
import type { Product, Variant } from './types';

describe('cartReducer', () => {
  it('add da mesma variantId soma quantidades, com teto de 999', () => {
    let lines = cartReducer([], { type: 'add', line: { ...iphone, qty: 2 } });
    lines = cartReducer(lines, { type: 'add', line: { ...iphone, qty: 3 } });
    expect(lines).toHaveLength(1);
    expect(lines[0].qty).toBe(5);
    lines = cartReducer(lines, { type: 'add', line: { ...iphone, qty: 998 } });
    expect(lines[0].qty).toBe(999);
  });

  it('add de outra variante cria nova linha com quantidade válida', () => {
    const lines = cartReducer([iphone], { type: 'add', line: { ...khamrah, qty: 2.7 } });
    expect(lines.map((l) => [l.variantId, l.qty])).toEqual([['v1', 2], ['v2', 2]]);
  });

  it('setQty com 0, -1, 2.5 e 5000 resulta em 1, 1, 2 e 999', () => {
    const qty = (n: number) => cartReducer([iphone], { type: 'setQty', variantId: 'v1', qty: n })[0].qty;
    expect([qty(0), qty(-1), qty(2.5), qty(5000)]).toEqual([1, 1, 2, 999]);
  });

  it('remove tira a linha e clear zera', () => {
    expect(cartReducer([iphone, khamrah], { type: 'remove', variantId: 'v1' }).map((l) => l.variantId)).toEqual(['v2']);
    expect(cartReducer([iphone, khamrah], { type: 'clear' })).toEqual([]);
  });

  it('replace troca as linhas', () => {
    expect(cartReducer([iphone], { type: 'replace', lines: [khamrah] })).toEqual([khamrah]);
  });
});

const variant = (id: string, over: Partial<Variant> = {}): Variant => ({
  id, optionValues: [], retailCents: 34990, wholesaleCents: 21990, available: true, ...over,
});
const product = (variants: Variant[], over: Partial<Product> = {}): Product => ({
  id: 'p2', slug: 'khamrah', name: 'Lattafa Khamrah EDP 100ml', description: '', categorySlug: 'perfumes',
  images: [], badge: null, available: true, featured: false, pixPercent: 10, installments: null,
  optionNames: [], variants, ...over,
});

describe('reconcileCart', () => {
  it('linha cuja variante não veio sai e o nome entra em removed', () => {
    const v = variant('v2');
    const r = reconcileCart([iphone, khamrah], [{ variant: v, product: product([v]) }]);
    expect(r.lines.map((l) => l.variantId)).toEqual(['v2']);
    expect(r.removed).toEqual(['iPhone 17 Pro — Azul, 256GB']);
    expect(r.priceChanged).toBe(false);
  });

  it('variante indisponível sai', () => {
    const v = variant('v2', { available: false });
    const r = reconcileCart([khamrah], [{ variant: v, product: product([v]) }]);
    expect(r.lines).toEqual([]);
    expect(r.removed).toEqual(['Lattafa Khamrah EDP 100ml']);
  });

  it('produto indisponível sai', () => {
    const v = variant('v2');
    const r = reconcileCart([khamrah], [{ variant: v, product: product([v], { available: false }) }]);
    expect(r.lines).toEqual([]);
    expect(r.removed).toEqual(['Lattafa Khamrah EDP 100ml']);
  });

  it('preço diferente é atualizado, priceChanged é true e a quantidade é preservada', () => {
    const v = variant('v2', { retailCents: 39990, wholesaleCents: 25990 });
    const r = reconcileCart([{ ...khamrah, qty: 7 }], [{ variant: v, product: product([v]) }]);
    expect(r.priceChanged).toBe(true);
    expect(r.lines[0]).toMatchObject({ retailCents: 39990, wholesaleCents: 25990, qty: 7 });
    expect(r.removed).toEqual([]);
  });

  it('Pix diferente também conta como preço atualizado', () => {
    const v = variant('v2');
    const r = reconcileCart([khamrah], [{ variant: v, product: product([v], { pixPercent: 5 }) }]);
    expect(r.priceChanged).toBe(true);
    expect(r.lines[0].pixPercent).toBe(5);
  });
});

describe('parseCart', () => {
  it('lê o que foi gravado', () => {
    expect(parseCart(JSON.stringify([iphone, khamrah]))).toEqual([iphone, khamrah]);
  });

  it('conteúdo ausente ou corrompido vira carrinho vazio', () => {
    expect(parseCart(null)).toEqual([]);
    expect(parseCart('{quebrado')).toEqual([]);
    expect(parseCart('{"a":1}')).toEqual([]);
    expect(parseCart('[1,2]')).toEqual([]);
    expect(parseCart(JSON.stringify([{ ...iphone, retailCents: 'caro' }]))).toEqual([]);
  });

  it('quantidade gravada inválida é corrigida para 1..999', () => {
    expect(parseCart(JSON.stringify([{ ...iphone, qty: 5000 }]))[0].qty).toBe(999);
  });
});
