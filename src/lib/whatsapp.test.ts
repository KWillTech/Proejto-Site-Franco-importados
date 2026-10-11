import { expect, test } from 'vitest';
import { summarize } from './pricing';
import { buildOrderMessage, normalizePhone, whatsappUrl } from './whatsapp';
import { iphone, khamrah } from './test-fixtures';

test('normalizePhone', () => {
  expect(normalizePhone('(62) 99999-0000')).toBe('5562999990000');
  expect(normalizePhone('+55 62 99999-0000')).toBe('5562999990000');
  expect(normalizePhone('6233330000')).toBe('556233330000');
  expect(normalizePhone('')).toBeNull(); expect(normalizePhone('123')).toBeNull();
});
test('mensagem de atacado no formato do spec', () => {
  const msg = buildOrderMessage(summarize([iphone, khamrah]), { name: 'Maria Souza', city: 'Goiânia - GO' });
  expect(msg).toBe(
`Olá! Quero fazer um pedido pelo site.

Nome: Maria Souza
Cidade: Goiânia - GO
Tipo: ATACADO (12 peças)

1. iPhone 17 Pro — Azul, 256GB
   2 x R$ 8.990,00 = R$ 17.980,00
2. Lattafa Khamrah EDP 100ml
   10 x R$ 219,90 = R$ 2.199,00

Total: R$ 20.179,00
Total no Pix: R$ 18.161,10`);
});
test('varejo de 1 peça, sem Pix', () => {
  const msg = buildOrderMessage(summarize([{ ...khamrah, qty: 1, pixPercent: null }]), { name: 'Ana', city: 'Rio' });
  expect(msg).toContain('Tipo: VAREJO (1 peça)'); expect(msg).not.toContain('Total no Pix');
});
test('nome e cidade perdem quebras de linha e espaços extras', () => {
  const msg = buildOrderMessage(summarize([khamrah]), { name: '  Ana\nTipo: X ', city: 'Rio\r\n' });
  expect(msg).toContain('Nome: Ana Tipo: X\n'); expect(msg).toContain('Cidade: Rio\n');
});
test('url codifica caracteres especiais', () => {
  const url = whatsappUrl('5562999990000', 'Perfume & Cia #1 100% 😀\nlinha');
  expect(url.startsWith('https://wa.me/5562999990000?text=')).toBe(true);
  expect(decodeURIComponent(url.split('text=')[1])).toBe('Perfume & Cia #1 100% 😀\nlinha');
});
