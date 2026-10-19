import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { parseUsdRate, priceCents, refreshUsdRate } from './dolar';

describe('parseUsdRate', () => {
  it('aceita ask como texto ou número dentro de 1 a 20', () => {
    expect(parseUsdRate({ USDBRL: { ask: '5.4213' } })).toBe(5.4213);
    expect(parseUsdRate({ USDBRL: { ask: 5.4 } })).toBe(5.4);
  });
  it('recusa lixo', () => {
    expect(parseUsdRate({ USDBRL: { ask: '0' } })).toBeNull();
    expect(parseUsdRate({ USDBRL: { ask: '50' } })).toBeNull();
    expect(parseUsdRate({ USDBRL: { ask: '' } })).toBeNull();
    expect(parseUsdRate({ USDBRL: { ask: 'abc' } })).toBeNull();
    expect(parseUsdRate({})).toBeNull();
    expect(parseUsdRate(null)).toBeNull();
  });
});

describe('priceCents', () => {
  it('custo em dólar vezes cotação mais margem', () => {
    expect(priceCents(65000, 5.42, 80000)).toBe(432300);
    expect(priceCents(2800, 5.42, 9000)).toBe(24176);
  });
});

describe('refreshUsdRate', () => {
  const eq = vi.fn();
  const update = vi.fn(() => ({ eq }));
  const rpc = vi.fn();
  const supabase = { from: () => ({ update }), rpc } as unknown as SupabaseClient;

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    eq.mockReset();
    update.mockClear();
    rpc.mockReset();
  });

  const api = (body: unknown, ok = true) =>
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok, json: async () => body }));

  it('cotação inválida não toca o banco', async () => {
    api({ USDBRL: { ask: '0' } });
    expect(await refreshUsdRate(supabase)).toBeNull();
    expect(update).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it('erro de rede devolve null sem lançar', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('rede')));
    expect(await refreshUsdRate(supabase)).toBeNull();
    expect(update).not.toHaveBeenCalled();
  });

  it('a busca tem timeout (API pendurada não trava o save nem o cron)', async () => {
    api({ USDBRL: { ask: '0' } });
    await refreshUsdRate(supabase);
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it('com AWESOMEAPI_TOKEN, a busca leva o token na URL', async () => {
    vi.stubEnv('AWESOMEAPI_TOKEN', 'abc');
    api({ USDBRL: { ask: '0' } });
    await refreshUsdRate(supabase);
    expect(vi.mocked(fetch).mock.calls[0][0]).toMatch(/\?token=abc$/);
  });

  it('sem AWESOMEAPI_TOKEN, a URL não tem token', async () => {
    vi.stubEnv('AWESOMEAPI_TOKEN', '');
    api({ USDBRL: { ask: '0' } });
    await refreshUsdRate(supabase);
    expect(vi.mocked(fetch).mock.calls[0][0]).not.toContain('token');
  });

  it('HTTP não-ok devolve null', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    api({ USDBRL: { ask: '5.4' } }, false);
    expect(await refreshUsdRate(supabase)).toBeNull();
    expect(update).not.toHaveBeenCalled();
  });

  it('grava a cotação e recalcula', async () => {
    api({ USDBRL: { ask: '5.4' } });
    eq.mockResolvedValue({ error: null });
    rpc.mockResolvedValue({ error: null });
    expect(await refreshUsdRate(supabase)).toBe(5.4);
    expect(update).toHaveBeenCalledWith({ usd_rate: 5.4, usd_rate_at: expect.any(String) });
    expect(eq).toHaveBeenCalledWith('id', 1);
    expect(rpc).toHaveBeenCalledWith('recalc_prices');
  });

  it('erro no update ou no rpc devolve null', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    api({ USDBRL: { ask: '5.4' } });
    eq.mockResolvedValue({ error: { message: 'x' } });
    expect(await refreshUsdRate(supabase)).toBeNull();
    expect(rpc).not.toHaveBeenCalled();
    eq.mockResolvedValue({ error: null });
    rpc.mockResolvedValue({ error: { message: 'y' } });
    expect(await refreshUsdRate(supabase)).toBeNull();
  });
});
