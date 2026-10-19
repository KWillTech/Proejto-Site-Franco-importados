import { CalculoTable, type CostRow } from '@/components/admin/CalculoTable';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import styles from '../../admin.module.css';

type ProductRow = {
  name: string;
  variants: Array<{ id: string; option_values: string[] | null; retail_cents: number; position: number }>;
};

// Painel lê a sessão a cada requisição: bloqueia no servidor em vez de mostrar um esqueleto.
export const instant = false;

export default async function CalculoPage() {
  await requireUser();
  const supabase = await createClient();
  // shortcut: sem paginação, trocar se passar de ~2000 variações
  const [products, costs, settings] = await Promise.all([
    supabase.from('products').select('id, name, option_names, variants(id, option_values, retail_cents, position)')
      .order('name').overrideTypes<ProductRow[], { merge: false }>(),
    supabase.from('variant_costs').select('variant_id, cost_usd_cents, margin_cents'),
    supabase.from('settings').select('usd_rate, usd_rate_at').eq('id', 1).single(),
  ]);
  if (products.error) throw new Error(products.error.message);
  if (costs.error) throw new Error(costs.error.message);
  if (settings.error) throw new Error(settings.error.message);

  const byVariant = new Map(costs.data.map((c) => [c.variant_id as string, c]));
  const rows: CostRow[] = products.data.flatMap((p) =>
    [...p.variants].sort((a, b) => a.position - b.position).map((v) => {
      const c = byVariant.get(v.id);
      return {
        variantId: v.id,
        productName: p.name,
        variantLabel: v.option_values?.length ? v.option_values.join(', ') : 'Única',
        costUsdCents: c?.cost_usd_cents ?? null,
        marginCents: c?.margin_cents ?? null,
        retailCents: v.retail_cents,
      };
    }));
  const rate = settings.data.usd_rate === null ? null : Number(settings.data.usd_rate);

  return (
    <>
      <h1 className={styles.title}>Cálculo</h1>
      <CalculoTable rows={rows} rate={rate} rateAt={settings.data.usd_rate_at} />
    </>
  );
}
