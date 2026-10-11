import { expect, test } from 'vitest';
import { formatBRL, pixCents, installmentCents, summarize } from './pricing';
import { iphone, khamrah } from './test-fixtures';

test('formatBRL', () => { expect(formatBRL(899000)).toBe('R$ 8.990,00'); expect(formatBRL(21990)).toBe('R$ 219,90'); expect(formatBRL(0)).toBe('R$ 0,00'); });
test('pixCents arredonda por unidade', () => { expect(pixCents(21990, 10)).toBe(19791); expect(pixCents(21990, null)).toBe(21990); expect(pixCents(999, 33)).toBe(669); });
test('installmentCents', () => { expect(installmentCents(1074532, 12)).toBe(89544); });
test('9 peças é varejo e avisa quanto falta', () => {
  const s = summarize([{ ...khamrah, qty: 9 }]);
  expect(s.channel).toBe('varejo'); expect(s.pieces).toBe(9); expect(s.missingForWholesale).toBe(1);
  expect(s.totalCents).toBe(9 * 34990);
});
test('exatamente 10 peças já é atacado', () => {
  const s = summarize([{ ...khamrah, qty: 10 }]);
  expect(s.channel).toBe('atacado'); expect(s.missingForWholesale).toBe(0); expect(s.totalCents).toBe(10 * 21990);
});
test('10 peças somando produtos diferentes vira atacado para todos', () => {
  const s = summarize([iphone, khamrah]);                       // 12 peças
  expect(s.channel).toBe('atacado'); expect(s.missingForWholesale).toBe(0);
  expect(s.lines[0].unitCents).toBe(899000); expect(s.lines[1].unitCents).toBe(21990);
  expect(s.totalCents).toBe(2017900); expect(s.totalPixCents).toBe(1816110);
});
test('carrinho vazio', () => { const s = summarize([]); expect(s.pieces).toBe(0); expect(s.channel).toBe('varejo'); expect(s.missingForWholesale).toBe(10); expect(s.totalCents).toBe(0); });
