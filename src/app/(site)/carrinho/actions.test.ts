import { afterEach, describe, expect, it, vi } from 'vitest';
import { getVariantsByIds } from '@/lib/data';
import { refreshCart } from './actions';

vi.mock('@/lib/data', () => ({ getVariantsByIds: vi.fn(async () => []) }));

afterEach(() => vi.mocked(getVariantsByIds).mockClear());

const id = '3f2a1b4c-5d6e-4f70-8a9b-0c1d2e3f4a5b';

describe('refreshCart', () => {
  it('consulta com ids no formato UUID', async () => {
    await refreshCart([id]);
    expect(getVariantsByIds).toHaveBeenCalledWith([id]);
  });

  it.each([
    ['id fora do formato', ['abc']],
    ['valor que não é texto', [42]],
    ['não é lista', 'abc'],
    ['mais de 100 ids', Array.from({ length: 101 }, () => id)],
  ])('recusa %s sem consultar o banco', async (_, input) => {
    await expect(refreshCart(input as string[])).rejects.toThrow();
    expect(getVariantsByIds).not.toHaveBeenCalled();
  });
});
