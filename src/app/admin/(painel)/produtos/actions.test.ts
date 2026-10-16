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

// Supabase falso: cada chamada encadeada é registrada; `reply` decide o resultado de cada operação.
type Call = { table: string; op: string; filters: string[]; payload?: unknown };
function fakeDb(reply: (c: Call) => { data?: unknown; error?: unknown }) {
  const calls: Call[] = [];
  const from = (table: string) => {
    const call: Call = { table, op: 'select', filters: [] };
    const b: Record<string, unknown> = {};
    const chain = (fn: (...a: unknown[]) => void) => (...a: unknown[]) => { fn(...a); return b; };
    for (const op of ['insert', 'update', 'delete'] as const) {
      b[op] = chain((payload) => { call.op = op; call.payload = payload; });
    }
    for (const f of ['select', 'like', 'order', 'single', 'maybeSingle']) b[f] = chain(() => {});
    for (const f of ['eq', 'in']) b[f] = chain((k, v) => call.filters.push(`${k}=${String(v)}`));
    b.then = (ok: (r: unknown) => void) => { calls.push(call); ok({ data: null, error: null, ...reply(call) }); };
    return b;
  };
  return { calls, client: { from } };
}

const NEW_ID = '9a6c4a2e-1f3d-4c5b-9a8e-7d6f5e4c3b2a';
const valid = {
  name: 'Khamrah', categoryId: ID, description: '', badge: null, featured: false, available: true,
  pixPercent: null, installments: null, optionNames: [],
  variants: [{ optionValues: [], retailCents: 34990, wholesaleCents: 21990, available: true }],
  images: ['/placeholders/a.svg'],
};

describe('saveProduct grava com segurança', () => {
  beforeEach(() => requireUser.mockResolvedValue({ id: 'u1' }));

  it('na criação, se as variações falham, apaga o produto recém-criado', async () => {
    const db = fakeDb((c) => {
      if (c.table === 'categories') return { data: { slug: 'perfumes' } };
      if (c.table === 'products' && c.op === 'select') return { data: [] };
      if (c.table === 'products' && c.op === 'insert') return { data: { id: NEW_ID } };
      if (c.table === 'variants' && c.op === 'insert') return { error: { message: 'falhou' } };
      return { data: [] };
    });
    createClient.mockResolvedValue(db.client);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const r = await saveProduct(null, valid);
    expect(r.ok).toBe(false);
    expect(db.calls.at(-1)).toMatchObject({ table: 'products', op: 'delete', filters: [`id=${NEW_ID}`] });
  });

  it('fotos novas entram antes de apagar as antigas', async () => {
    const OLD_IMG = '7b6c4a2e-1f3d-4c5b-9a8e-7d6f5e4c3b2a';
    const db = fakeDb((c) => {
      if (c.table === 'categories') return { data: { slug: 'perfumes' } };
      if (c.table === 'products' && c.op === 'select') return { data: { slug: 'khamrah', categories: { slug: 'perfumes' } } };
      if (c.table === 'product_images' && c.op === 'select') return { data: [{ id: OLD_IMG }] };
      return { data: [] };
    });
    createClient.mockResolvedValue(db.client);
    expect(await saveProduct(ID, valid)).toEqual({ ok: true, id: ID });
    const img = db.calls.filter((c) => c.table === 'product_images').map((c) => c.op);
    expect(img).toEqual(['select', 'insert', 'delete']);
    expect(db.calls.at(-1)?.filters).toContain(`id=${OLD_IMG}`);
  });
});
