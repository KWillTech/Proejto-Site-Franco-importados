import type { SupabaseClient } from '@supabase/supabase-js';

const API = 'https://economia.awesomeapi.com.br/json/last/USD-BRL';

/** Lê USDBRL.ask; só aceita cotação entre 1 e 20, o resto é lixo da API. */
export function parseUsdRate(json: unknown): number | null {
  const ask = (json as { USDBRL?: { ask?: unknown } } | null)?.USDBRL?.ask;
  const rate = typeof ask === 'string' || typeof ask === 'number' ? Number(ask) : NaN;
  return Number.isFinite(rate) && rate >= 1 && rate <= 20 ? rate : null;
}

export function priceCents(costUsdCents: number, rate: number, marginCents: number): number {
  return Math.round(costUsdCents * rate) + marginCents;
}

/** Busca a cotação, grava em settings e recalcula os preços. Nunca lança. */
export async function refreshUsdRate(supabase: SupabaseClient): Promise<number | null> {
  try {
    const token = process.env.AWESOMEAPI_TOKEN;
    const url = token ? `${API}?token=${encodeURIComponent(token)}` : API;
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`AwesomeAPI HTTP ${res.status}`);
    const rate = parseUsdRate(await res.json());
    if (rate === null) throw new Error('cotação inválida');

    const up = await supabase
      .from('settings')
      .update({ usd_rate: rate, usd_rate_at: new Date().toISOString() })
      .eq('id', 1);
    if (up.error) throw up.error;
    const rc = await supabase.rpc('recalc_prices');
    if (rc.error) throw rc.error;
    return rate;
  } catch (e) {
    console.error('refreshUsdRate', e);
    return null;
  }
}
