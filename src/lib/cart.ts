import type { CartLine, Product, Variant } from './types';
import { clampQty, toCartLine } from './variants';
import { lineLabel } from './whatsapp';

// Formato dos ids de variante; vale no navegador (antes de pedir) e na server action (fronteira).
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

export function reconcileCart(lines: CartLine[], fresh: Array<{ variant: Variant; product: Product }>):
  { lines: CartLine[]; removed: string[]; priceChanged: boolean } {
  const out: CartLine[] = [];
  const removed: string[] = [];
  let priceChanged = false;
  for (const l of lines) {
    const f = fresh.find((x) => x.variant.id === l.variantId);
    if (!f || !f.variant.available || !f.product.available) {
      removed.push(lineLabel(l));
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

const cents = (n: unknown) => Number.isInteger(n) && (n as number) >= 0;

const isLine = (l: unknown): l is CartLine => {
  const x = l as Record<string, unknown>;
  return typeof x === 'object' && x !== null
    && ['variantId', 'productId', 'slug', 'name', 'optionLabel'].every((k) => typeof x[k] === 'string')
    && cents(x.retailCents) && cents(x.wholesaleCents)
    && (x.image === null || typeof x.image === 'string')
    && (x.pixPercent === null || (typeof x.pixPercent === 'number' && x.pixPercent > 0 && x.pixPercent <= 100))
    && (x.installments === null || (Number.isInteger(x.installments) && (x.installments as number) >= 1));
};

// Conteúdo do localStorage: JSON quebrado ou que não é lista vira carrinho vazio; linha fora do formato é descartada.
export function parseCart(raw: string | null): CartLine[] {
  try {
    const data: unknown = JSON.parse(raw ?? '[]');
    if (!Array.isArray(data)) return [];
    return data.filter(isLine).map((l) => ({ ...l, qty: clampQty(l.qty) }));
  } catch {
    return [];
  }
}
