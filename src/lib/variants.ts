import type { CartLine, Product, Variant } from './types';

const matches = (v: Variant, selected: (string | null)[]) =>
  selected.every((s, i) => s === null || v.optionValues[i] === s);

export function findVariant(p: Product, selected: (string | null)[]): Variant | null {
  if (selected.some((s) => s === null)) return null;
  return p.variants.find((v) => matches(v, selected)) ?? null;
}

export function optionValues(p: Product, index: number): string[] {
  return [...new Set(p.variants.map((v) => v.optionValues[index]))];
}

// Disponível se existe variante em estoque com este valor e com as outras opções já escolhidas.
export function isValueAvailable(p: Product, selected: (string | null)[], index: number, value: string): boolean {
  const wanted = selected.map((s, i) => (i === index ? value : s));
  return p.variants.some((v) => v.available && matches(v, wanted));
}

export function toCartLine(p: Product, v: Variant, qty: number): CartLine {
  return {
    variantId: v.id, productId: p.id, slug: p.slug, name: p.name,
    optionLabel: v.optionValues.join(', '), image: p.images[0] ?? null,
    retailCents: v.retailCents, wholesaleCents: v.wholesaleCents,
    pixPercent: p.pixPercent, installments: p.installments, qty,
  };
}

export function clampQty(raw: unknown): number {
  const n = Math.floor(Number(raw));
  return Number.isFinite(n) ? Math.min(999, Math.max(1, n)) : 1;
}
