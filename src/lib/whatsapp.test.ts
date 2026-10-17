import { expect, test } from 'vitest';
import { summarize } from './pricing';
import { buildOrderMessage, normalizePhone, whatsappUrl, type Customer } from './whatsapp';
import { iphone, khamrah } from './test-fixtures';

test('normalizePhone', () => {
  expect(normalizePhone('(62) 99999-0000')).toBe('5562999990000');
  expect(normalizePhone('+55 62 99999-0000')).toBe('5562999990000');
  expect(normalizePhone('6233330000')).toBe('556233330000');
  expect(normalizePhone('')).toBeNull(); expect(normalizePhone('123')).toBeNull();
});
test('mensagem de atacado no formato do spec', () => {
  const msg = buildOrderMessage(summarize([iphone, khamrah]), { name: 'Maria Souza', city: 'Goiânia - GO', payment: 'Pix', installments: 1 });
  expect(msg).toBe(
`Olá! Quero fazer um pedido pelo site.

Nome: Maria Souza
Cidade: Goiânia - GO
Pagamento: Pix
Tipo: ATACADO (12 peças)

1. iPhone 17 Pro — Azul, 256GB
   2 x R$ 8.990,00 = R$ 17.980,00
2. Lattafa Khamrah EDP 100ml
   10 x R$ 219,90 = R$ 2.199,00

Total: R$ 20.179,00
Total no Pix: R$ 18.161,10`);
});
test('varejo de 1 peça, sem Pix', () => {
  const msg = buildOrderMessage(summarize([{ ...khamrah, qty: 1, pixPercent: null }]), { name: 'Ana', city: 'Rio', payment: 'Débito', installments: 1 });
  expect(msg).toContain('Tipo: VAREJO (1 peça)'); expect(msg).not.toContain('Total no Pix');
});
test('total no Pix só aparece na mensagem quando o pagamento é Pix', () => {
  const cart = summarize([iphone, khamrah]);
  const msg = (payment: Customer['payment'], installments: number) =>
    buildOrderMessage(cart, { name: 'Ana', city: 'Rio', payment, installments });
  expect(msg('Pix', 1)).toContain('Total no Pix: R$ 18.161,10');
  expect(msg('Crédito', 10)).not.toContain('Total no Pix');
  expect(msg('Débito', 1)).not.toContain('Total no Pix');
  expect(msg('Boleto', 1)).not.toContain('Total no Pix');
});
test('nome e cidade perdem quebras de linha e espaços extras', () => {
  const msg = buildOrderMessage(summarize([khamrah]), { name: '  Ana\nTipo: X ', city: 'Rio\r\n', payment: 'Pix', installments: 1 });
  expect(msg).toContain('Nome: Ana Tipo: X\n'); expect(msg).toContain('Cidade: Rio\n');
});
test('linha de pagamento de cada forma', () => {
  const line = (payment: Customer['payment'], installments: number) =>
    buildOrderMessage(summarize([khamrah]), { name: 'Ana', city: 'Rio', payment, installments }).split('\n').find((l) => l.startsWith('Pagamento'));
  expect(line('Pix', 1)).toBe('Pagamento: Pix');
  expect(line('Débito', 1)).toBe('Pagamento: Débito');
  expect(line('Crédito', 3)).toBe('Pagamento: Crédito em 3x (juros a consultar)');
  expect(line('Boleto', 2)).toBe('Pagamento: Boleto em 2x (juros a consultar)');
  expect(line('Crédito', 1)).toBe('Pagamento: Crédito à vista');
  expect(line('Boleto', 1)).toBe('Pagamento: Boleto à vista');
  expect(line('', 1)).toBeUndefined();
});
test('url codifica caracteres especiais', () => {
  const url = whatsappUrl('5562999990000', 'Perfume & Cia #1 100% 😀\nlinha');
  expect(url.startsWith('https://wa.me/5562999990000?text=')).toBe(true);
  expect(decodeURIComponent(url.split('text=')[1])).toBe('Perfume & Cia #1 100% 😀\nlinha');
});
