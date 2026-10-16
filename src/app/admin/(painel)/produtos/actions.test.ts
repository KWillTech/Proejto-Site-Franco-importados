import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireUser = vi.fn();
const createClient = vi.fn();
vi.mock('@/lib/auth', () => ({ requireUser: () => requireUser() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: () => createClient() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { deleteProduct, saveProduct, setAvailable, setFeatured } from './actions';

const ID = '0b6c4a2e-1f3d-4c5b-9a8e-7d6f5e4c3b2a';

beforeEach(() => {
  requireUser.mockReset();
  createClient.mockReset();
});

describe('sem sessão, nada é gravado', () => {
  it.each([
    ['saveProduct', () => saveProduct(null, {})],
    ['deleteProduct', () => deleteProduct(ID)],
    ['setFeatured', () => setFeatured(ID, true)],
    ['setAvailable', () => setAvailable(ID, false)],
  ])('%s', async (_name, call) => {
    requireUser.mockRejectedValue(new Error('NEXT_REDIRECT /admin/login'));
    await expect(call()).rejects.toThrow('NEXT_REDIRECT /admin/login');
    expect(createClient).not.toHaveBeenCalled();
  });
});

describe('com sessão, entrada inválida não chega ao banco', () => {
  beforeEach(() => requireUser.mockResolvedValue({ id: 'u1' }));

  it('saveProduct devolve os erros por campo', async () => {
    const r = await saveProduct(null, { name: '' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.name).toBe('Informe o nome do produto.');
    expect(createClient).not.toHaveBeenCalled();
  });

  it('id que não é uuid é recusado', async () => {
    expect(await saveProduct('1 or 1=1', {})).toEqual({ ok: false, errors: { form: 'Produto não encontrado.' } });
    await expect(deleteProduct('x')).rejects.toThrow();
    await expect(setFeatured('x', true)).rejects.toThrow();
    await expect(setAvailable(ID, 'sim' as unknown as boolean)).rejects.toThrow();
    expect(createClient).not.toHaveBeenCalled();
  });
});
