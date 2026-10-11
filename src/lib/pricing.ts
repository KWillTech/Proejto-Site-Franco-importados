import type { CartLine, CartSummary, Channel, PricedLine } from './types';

export const WHOLESALE_MIN_PIECES = 10;

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatBRL(cents: number): string {
  return brl.format(cents / 100).replace(/ /g, ' ');
}

export function pixCents(cents: number, pixPercent: number | null): number {
  if (pixPercent === null) return cents;
  return Math.round(cents * (100 - pixPercent) / 100);
}

export function installmentCents(cents: number, installments: number): number {
  return Math.round(cents / installments);
}

export function unitCents(p: { retailCents: number; wholesaleCents: number }, channel: Channel): number {
  return channel === 'atacado' ? p.wholesaleCents : p.retailCents;
}

export function summarize(lines: CartLine[]): CartSummary {
  const pieces = lines.reduce((sum, l) => sum + l.qty, 0);
  const channel: Channel = pieces >= WHOLESALE_MIN_PIECES ? 'atacado' : 'varejo';

  const priced: PricedLine[] = lines.map((l) => {
    const unit = unitCents(l, channel);
    return {
      ...l,
      unitCents: unit,
      subtotalCents: unit * l.qty,
      subtotalPixCents: pixCents(unit, l.pixPercent) * l.qty,
    };
  });

  return {
    channel,
    pieces,
    missingForWholesale: Math.max(0, WHOLESALE_MIN_PIECES - pieces),
    lines: priced,
    totalCents: priced.reduce((sum, l) => sum + l.subtotalCents, 0),
    totalPixCents: priced.reduce((sum, l) => sum + l.subtotalPixCents, 0),
  };
}
