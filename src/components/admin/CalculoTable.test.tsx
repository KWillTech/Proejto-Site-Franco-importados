import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { saveCosts } from '@/app/admin/(painel)/calculo/actions';
import { CalculoTable, type CostRow } from './CalculoTable';

vi.mock('@/app/admin/(painel)/calculo/actions', () => ({ saveCosts: vi.fn(async () => ({ ok: true })) }));

afterEach(cleanup);

const row = (variantId: string, costUsdCents: number | null, marginCents: number | null): CostRow => ({
  variantId, productName: `Produto ${variantId.slice(0, 1)}`, variantLabel: 'Único', costUsdCents, marginCents, retailCents: 0,
});
const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';

describe('CalculoTable', () => {
  it('preço 0 fica fora da vitrine', () => {
    render(<CalculoTable rows={[row(A, 0, 0)]} rate={5} rateAt={null} />);
    expect(screen.getByText('fora da vitrine')).toBeTruthy();
  });

  it('margem 0 com custo > 0 tem preço', () => {
    render(<CalculoTable rows={[row(A, 100, 0)]} rate={5} rateAt={null} />);
    expect(screen.queryByText('fora da vitrine')).toBeNull();
  });

  it('variação nova vinda do revalidate não quebra a tela nem o envio', () => {
    const { rerender } = render(<CalculoTable rows={[row(A, 100, 0)]} rate={5} rateAt={null} />);
    rerender(<CalculoTable rows={[row(A, 100, 0), row(B, null, null)]} rate={5} rateAt={null} />);
    expect(screen.getByText('fora da vitrine')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Custo em dólar de Produto 2 (Único)'), { target: { value: '1,00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(saveCosts).toHaveBeenCalledWith([{ variantId: B, costUsdCents: 100, marginCents: null }]);
  });
});
