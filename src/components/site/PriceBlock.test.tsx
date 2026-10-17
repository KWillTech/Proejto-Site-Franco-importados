import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PriceBlock } from './PriceBlock';

afterEach(cleanup);

const base = { retailCents: 967072, wholesaleCents: 899000, pixPercent: 10, installments: 12 };

describe('PriceBlock', () => {
  it('varejo mostra Pix e parcelas', () => {
    render(<PriceBlock {...base} channel="varejo" />);
    expect(screen.getByText('R$ 8.703,65 com Pix')).toBeTruthy();
    expect(screen.getByText('em até 12x')).toBeTruthy();
  });

  it('atacado mostra Pix, preço por peça e mínimo, sem parcelas', () => {
    const { container } = render(<PriceBlock {...base} channel="atacado" />);
    expect(screen.getByText('R$ 8.091,00 com Pix')).toBeTruthy();
    expect(screen.getByText('R$ 8.990,00 por peça')).toBeTruthy();
    expect(screen.getByText('a partir de 10 peças')).toBeTruthy();
    expect(container.textContent).not.toContain('em até');
  });

  it('sem Pix e sem parcelas mostra só o preço', () => {
    const { container } = render(<PriceBlock {...base} pixPercent={null} installments={null} channel="varejo" />);
    expect(container.textContent).toBe('R$ 9.670,72');
  });

  it('com from começa com "a partir de"', () => {
    const { container } = render(<PriceBlock {...base} channel="varejo" from />);
    expect(container.textContent?.startsWith('a partir de')).toBe(true);
  });
});
