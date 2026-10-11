import { expect, test } from 'vitest';
import { formatBRL, pixCents, installmentCents, summarize } from './pricing';

const iphone = { variantId:'v1', productId:'p1', slug:'iphone-17-pro', name:'iPhone 17 Pro', optionLabel:'Azul, 256GB',
  image:null, retailCents:967072, wholesaleCents:899000, pixPercent:10, installments:12, qty:2 };
const khamrah = { variantId:'v2', productId:'p2', slug:'khamrah', name:'Lattafa Khamrah EDP 100ml', optionLabel:'',
  image:null, retailCents:34990, wholesaleCents:21990, pixPercent:10, installments:null, qty:10 };

test('formatBRL', () => { expect(formatBRL(899000)).toBe('R$ 8.990,00'); expect(formatBRL(21990)).toBe('R$ 219,90'); expect(formatBRL(0)).toBe('R$ 0,00'); });
test('pixCents arredonda por unidade', () => { expect(pixCents(21990, 10)).toBe(19791); expect(pixCents(21990, null)).toBe(21990); expect(pixCents(999, 33)).toBe(669); });
test('installmentCents', () => { expect(installmentCents(1074532, 12)).toBe(89544); });
test('9 peças é varejo e avisa quanto falta', () => {
  const s = summarize([{ ...khamrah, qty: 9 }]);
  expect(s.channel).toBe('varejo'); expect(s.pieces).toBe(9); expect(s.missingForWholesale).toBe(1);
  expect(s.totalCents).toBe(9 * 34990);
});
test('10 peças somando produtos diferentes vira atacado para todos', () => {
  const s = summarize([iphone, khamrah]);                       // 12 peças
  expect(s.channel).toBe('atacado'); expect(s.missingForWholesale).toBe(0);
  expect(s.lines[0].unitCents).toBe(899000); expect(s.lines[1].unitCents).toBe(21990);
  expect(s.totalCents).toBe(2017900); expect(s.totalPixCents).toBe(1816110);
});
test('carrinho vazio', () => { const s = summarize([]); expect(s.pieces).toBe(0); expect(s.channel).toBe('varejo'); expect(s.missingForWholesale).toBe(10); expect(s.totalCents).toBe(0); });
