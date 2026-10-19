import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireUser = vi.fn();
const createClient = vi.fn();
const refreshUsdRate = vi.fn();
vi.mock('@/lib/auth', () => ({ requireUser: () => requireUser() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: () => createClient() }));
vi.mock('@/lib/dolar', () => ({ refreshUsdRate: (s: unknown) => refreshUsdRate(s) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { saveCosts } from './actions';

const ID = '11111111-1111-4111-8111-111111111111';
const calls: string[] = [];

function db({ rate = 5.42 as number | null, upsertError = null as unknown } = {}) {
  const upsert = vi.fn(async () => { calls.push('upsert'); return { error: upsertError }; });
  const rpc = vi.fn(async () => { calls.push('rpc'); return { error: null }; });
  const settings = { select: () => ({ eq: () => ({ single: async () => ({ data: { usd_rate: rate }, error: null }) }) }) };
  const client = { from: (t: string) => (t === 'variant_costs' ? { upsert } : settings), rpc };
  createClient.mockResolvedValue(client);
  return { upsert, rpc, client };
}

beforeEach(() => {
  calls.length = 0;
  requireUser.mockReset().mockResolvedValue({ id: 'u1' });
  createClient.mockReset();
  refreshUsdRate.mockReset().mockImplementation(async () => { calls.push('refresh'); return 5.4; });
});

describe('saveCosts', () => {
  it('payload inválido não faz upsert', async () => {
    const { upsert } = db();
    const r = await saveCosts([
      { variantId: 'nao-e-uuid', costUsdCents: 100, marginCents: 0 },
      { variantId: ID, costUsdCents: -1, marginCents: 0 },
    ]);
    expect(r.ok).toBe(false);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('margem 0 é gravada como 0', async () => {
    const { upsert } = db();
    expect(await saveCosts([{ variantId: ID, costUsdCents: 65000, marginCents: 0 }])).toEqual({ ok: true });
    expect(upsert).toHaveBeenCalledWith(
      [{ variant_id: ID, cost_usd_cents: 65000, margin_cents: 0 }], { onConflict: 'variant_id' });
  });

  it('margem vazia é gravada como null', async () => {
    const { upsert } = db();
    await saveCosts([{ variantId: ID, costUsdCents: 65000, marginCents: null }]);
    expect(upsert).toHaveBeenCalledWith(
      [{ variant_id: ID, cost_usd_cents: 65000, margin_cents: null }], { onConflict: 'variant_id' });
  });

  it('sem cotação gravada, busca a cotação antes de recalcular', async () => {
    const { client } = db({ rate: null });
    expect(await saveCosts([{ variantId: ID, costUsdCents: 1, marginCents: 1 }])).toEqual({ ok: true });
    expect(refreshUsdRate).toHaveBeenCalledWith(client);
    expect(calls).toEqual(['upsert', 'refresh', 'rpc']);
  });

  it('com cotação gravada, não busca de novo', async () => {
    db({ rate: 5.42 });
    await saveCosts([{ variantId: ID, costUsdCents: 1, marginCents: 1 }]);
    expect(refreshUsdRate).not.toHaveBeenCalled();
    expect(calls).toEqual(['upsert', 'rpc']);
  });

  it('erro no upsert devolve SAVE_FAILED e não recalcula', async () => {
    const { rpc } = db({ upsertError: { message: 'x' } });
    expect(await saveCosts([{ variantId: ID, costUsdCents: 1, marginCents: 1 }])).toEqual({
      ok: false, errors: { form: 'Não foi possível salvar. Tente de novo.' },
    });
    expect(rpc).not.toHaveBeenCalled();
  });
});
