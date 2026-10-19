import { beforeEach, describe, expect, it, vi } from 'vitest';

const refreshUsdRate = vi.fn();
const revalidatePath = vi.fn();
vi.mock('@/lib/dolar', () => ({ refreshUsdRate: (...a: unknown[]) => refreshUsdRate(...a) }));
vi.mock('next/cache', () => ({ revalidatePath: (...a: unknown[]) => revalidatePath(...a) }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({}) }));

import { GET } from './route';

const call = (auth?: string) =>
  GET(new Request('http://x/api/cron/dolar', { headers: auth === undefined ? {} : { authorization: auth } }));

beforeEach(() => {
  refreshUsdRate.mockReset();
  revalidatePath.mockReset();
  vi.stubEnv('CRON_SECRET', 'segredo');
});

describe('GET /api/cron/dolar', () => {
  it('sem header devolve 401 e não busca cotação', async () => {
    expect((await call()).status).toBe(401);
    expect((await call('Bearer errado')).status).toBe(401);
    expect(refreshUsdRate).not.toHaveBeenCalled();
  });

  it('CRON_SECRET vazio devolve 401 mesmo com "Bearer "', async () => {
    vi.stubEnv('CRON_SECRET', '');
    expect((await call('Bearer ')).status).toBe(401);
    expect(refreshUsdRate).not.toHaveBeenCalled();
  });

  it('com segredo certo grava, revalida e responde 200', async () => {
    refreshUsdRate.mockResolvedValue(5.4);
    const res = await call('Bearer segredo');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, rate: 5.4 });
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
  });

  it('cotação inválida responde 500 sem revalidar', async () => {
    refreshUsdRate.mockResolvedValue(null);
    const res = await call('Bearer segredo');
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, rate: null });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
