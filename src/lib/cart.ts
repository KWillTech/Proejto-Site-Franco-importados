import type { CartLine, Product, Variant } from './types';
import { clampQty, toCartLine } from './variants';

export type CartAction =
  | { type: 'add'; line: CartLine } | { type: 'setQty'; variantId: string; qty: number }
  | { type: 'remove'; variantId: string } | { type: 'clear' } | { type: 'replace'; lines: CartLine[] };

export function cartReducer(lines: CartLine[], action: CartAction): CartLine[] {
  switch (action.type) {
    case 'add': {
      const { line } = action;
      if (!lines.some((l) => l.variantId === line.variantId)) return [...lines, { ...line, qty: clampQty(line.qty) }];
      return lines.map((l) => (l.variantId === line.variantId ? { ...l, qty: clampQty(l.qty + line.qty) } : l));
    }
    case 'setQty':
      return lines.map((l) => (l.variantId === action.variantId ? { ...l, qty: clampQty(action.qty) } : l));
    case 'remove':
      return lines.filter((l) => l.variantId !== action.variantId);
    case 'clear':
      return [];
    case 'replace':
      return action.lines;
  }
}

const label = (l: CartLine) => l.name + (l.optionLabel ? ' — ' + l.optionLabel : '');

export function reconcileCart(lines: CartLine[], fresh: Array<{ variant: Variant; product: Product }>):
  { lines: CartLine[]; removed: string[]; priceChanged: boolean } {
  const out: CartLine[] = [];
  const removed: string[] = [];
  let priceChanged = false;
  for (const l of lines) {
    const f = fresh.find((x) => x.variant.id === l.variantId);
    if (!f || !f.variant.available || !f.product.available) {
      removed.push(label(l));
      continue;
    }
    const next = toCartLine(f.product, f.variant, l.qty);
    if (next.retailCents !== l.retailCents || next.wholesaleCents !== l.wholesaleCents || next.pixPercent !== l.pixPercent) {
      priceChanged = true;
    }
    out.push(next);
  }
  return { lines: out, removed, priceChanged };
}

const isLine = (l: unknown): l is CartLine => {
  const x = l as Record<string, unknown>;
  return typeof x === 'object' && x !== null
    && ['variantId', 'productId', 'slug', 'name', 'optionLabel'].every((k) => typeof x[k] === 'string')
    && Number.isInteger(x.retailCents) && Number.isInteger(x.wholesaleCents)
    && (x.image === null || typeof x.image === 'string')
    && (x.pixPercent === null || typeof x.pixPercent === 'number')
    && (x.installments === null || typeof x.installments === 'number');
};

// Conteúdo do localStorage: qualquer coisa fora do formato esperado vira carrinho vazio.
export function parseCart(raw: string | null): CartLine[] {
  try {
    const data: unknown = JSON.parse(raw ?? '[]');
    if (!Array.isArray(data) || !data.every(isLine)) return [];
    return data.map((l) => ({ ...l, qty: clampQty(l.qty) }));
  } catch {
    return [];
  }
}
