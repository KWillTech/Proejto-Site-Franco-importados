'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { refreshUsdRate } from '@/lib/dolar';
import { createClient } from '@/lib/supabase/server';
import { costsSchema, fieldErrors, SAVE_FAILED } from '@/lib/validation';

type Result = { ok: true } | { ok: false; errors: Record<string, string> };

export async function saveCosts(input: unknown): Promise<Result> {
  await requireUser();
  const parsed = costsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const supabase = await createClient();
  const rows = parsed.data.map((r) => ({ variant_id: r.variantId, cost_usd_cents: r.costUsdCents, margin_cents: r.marginCents }));
  const { error } = await supabase.from('variant_costs').upsert(rows, { onConflict: 'variant_id' });
  if (error) return SAVE_FAILED;

  const { data: s, error: sError } = await supabase.from('settings').select('usd_rate').eq('id', 1).single();
  if (sError) return SAVE_FAILED;
  // Sem cotação ainda: busca agora para o dono não esperar o primeiro cron.
  if (s.usd_rate === null && (await refreshUsdRate(supabase)) === null)
    return { ok: false, errors: { form: 'Custos salvos, mas a cotação do dólar não carregou. Os produtos ficam fora da vitrine até a cotação chegar. Tente salvar de novo.' } };
  const { error: rpcError } = await supabase.rpc('recalc_prices');
  if (rpcError) return SAVE_FAILED;
  revalidatePath('/', 'layout'); // preços e produtos que entram/saem da vitrine
  return { ok: true };
}
