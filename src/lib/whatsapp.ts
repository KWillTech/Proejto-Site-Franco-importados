import type { CartSummary } from './types';
import { formatBRL } from './pricing';

export type Payment = 'Pix' | 'Crédito' | 'Débito' | 'Boleto';
// payment '' = sem escolha (também o caso de dados salvos antes deste campo existir).
export type Customer = { name: string; city: string; payment: Payment | ''; installments: number };

function paymentLine({ payment, installments }: Customer): string {
  if (payment !== 'Crédito' && payment !== 'Boleto') return payment;
  return installments > 1 ? `${payment} em ${installments}x (juros a consultar)` : `${payment} à vista`;
}

// 55 + DDD + 9 dígitos vira (DDD) NNNNN-NNNN; outros formatos aparecem como +número.
export function displayPhone(phone: string): string {
  const m = /^55(\d{2})(\d{5})(\d{4})$/.exec(phone);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : `+${phone}`;
}

export function normalizePhone(raw: string): string | null {
  const d = raw.replace(/\D/g, '');
  if (d.length === 10 || d.length === 11) return '55' + d;
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) return d;
  return null;
}

function clean(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

// "iPhone 17 Pro — Azul, 256GB": usado na mensagem e no aviso de remoção do carrinho.
export function lineLabel(l: { name: string; optionLabel: string }): string {
  return l.name + (l.optionLabel ? ' — ' + l.optionLabel : '');
}

export function buildOrderMessage(summary: CartSummary, customer: Customer): string {
  const tipo = summary.channel === 'atacado' ? 'ATACADO' : 'VAREJO';
  const peças = summary.pieces === 1 ? 'peça' : 'peças';

  const items = summary.lines.flatMap((l, i) => {
    const title = `${i + 1}. ${lineLabel(l)}`;
    const detail = `   ${l.qty} x ${formatBRL(l.unitCents)} = ${formatBRL(l.subtotalCents)}`;
    return [title, detail];
  });

  const juros = (customer.payment === 'Crédito' || customer.payment === 'Boleto') && customer.installments > 1 ? ' + juros a consultar' : '';

  const out = [
    'Olá! Quero fazer um pedido pelo site.',
    '',
    `Nome: ${clean(customer.name)}`,
    `Cidade: ${clean(customer.city)}`,
    ...(customer.payment ? [`Pagamento: ${paymentLine(customer)}`] : []),
    `Tipo: ${tipo} (${summary.pieces} ${peças})`,
    '',
    ...items,
    '',
    `Total: ${formatBRL(summary.totalCents)}${juros}`,
  ];
  if (customer.payment === 'Pix' && summary.totalPixCents !== summary.totalCents) {
    out.push(`Total no Pix: ${formatBRL(summary.totalPixCents)}`);
  }
  return out.join('\n');
}

export function whatsappUrl(phone: string, message?: string): string {
  const base = `https://wa.me/${phone}`;
  return message === undefined ? base : `${base}?text=${encodeURIComponent(message)}`;
}
