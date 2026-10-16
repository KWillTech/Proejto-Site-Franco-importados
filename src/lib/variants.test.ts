import { describe, expect, it } from 'vitest';
import type { Product } from './types';
import { clampQty, findVariant, isValueAvailable, optionValues, toCartLine } from './variants';

const mk = (id: string, ov: string[], available = true) =>
  ({ id, optionValues: ov, retailCents: 100, wholesaleCents: 80, available });
const product: Product = {
  id: 'p1', slug: 'iphone', name: 'iPhone', description: '', categorySlug: 'iphone',
  images: ['/a.svg'], badge: null, available: true, featured: false,
  pixPercent: 10, installments: 12, optionNames: ['Cor', 'Armazenamento'],
  variants: [
    mk('v1', ['Azul', '256GB']), mk('v2', ['Azul', '512GB'], false),
    mk('v3', ['Preto', '256GB']), mk('v4', ['Preto', '512GB']),
  ],
};

describe('variants', () => {
  it('findVariant devolve null com opção faltando e a variante certa com tudo escolhido', () => {
    expect(findVariant(product, ['Azul', null])).toBeNull();
    expect(findVariant(product, ['Azul', '256GB'])?.id).toBe('v1');
  });

  it('optionValues lista valores distintos na ordem das variantes', () => {
    expect(optionValues(product, 0)).toEqual(['Azul', 'Preto']);
    expect(optionValues(product, 1)).toEqual(['256GB', '512GB']);
  });

  it('isValueAvailable é false para 512GB quando Azul+512GB está esgotado', () => {
    expect(isValueAvailable(product, ['Azul', null], 1, '512GB')).toBe(false);
    expect(isValueAvailable(product, ['Azul', null], 1, '256GB')).toBe(true);
    expect(isValueAvailable(product, [null, null], 1, '512GB')).toBe(true);
  });

  it('toCartLine copia preços, Pix e parcelas e monta optionLabel', () => {
    const line = toCartLine(product, product.variants[0], 2);
    expect(line).toMatchObject({
      variantId: 'v1', productId: 'p1', slug: 'iphone', name: 'iPhone', optionLabel: 'Azul, 256GB',
      image: '/a.svg', retailCents: 100, wholesaleCents: 80, pixPercent: 10, installments: 12, qty: 2,
    });
  });

  it('clampQty limita a inteiro entre 1 e 999', () => {
    expect([0, -3, 2.7, 'abc', 5000, '12'].map(clampQty)).toEqual([1, 1, 2, 1, 999, 12]);
  });
});
