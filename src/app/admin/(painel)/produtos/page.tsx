import Link from 'next/link';
import { Toggle } from '@/components/admin/Toggle';
import { requireUser } from '@/lib/auth';
import { formatBRL } from '@/lib/pricing';
import { createClient } from '@/lib/supabase/server';
import styles from '../../admin.module.css';
import { setAvailable, setFeatured } from './actions';

type Row = {
  id: string; name: string; featured: boolean; available: boolean;
  categories: { name: string } | null;
  product_images: Array<{ url: string; position: number }>;
  variants: Array<{ retail_cents: number }>;
};

// Painel lê a sessão a cada requisição: bloqueia no servidor em vez de mostrar um esqueleto.
export const instant = false;

export default async function ProdutosPage({ searchParams }: PageProps<'/admin/produtos'>) {
  await requireUser();
  const { q } = await searchParams;
  const raw = typeof q === 'string' ? q : '';
  // % e _ são curingas do ilike: tratados como texto comum (mesma limpeza da busca da vitrine).
  const term = raw.replace(/[%_,()]/g, ' ').trim();

  const supabase = await createClient();
  let query = supabase.from('products')
    .select('id, name, featured, available, categories(name), product_images(url, position), variants(retail_cents)')
    .order('name');
  if (term) query = query.ilike('name', `%${term}%`);
  const { data, error } = await query.overrideTypes<Row[], { merge: false }>();
  if (error) throw new Error(error.message);

  return (
    <>
      <h1 className={styles.title}>Produtos</h1>
      <div className={styles.toolbar}>
        <form className={styles.search} action="/admin/produtos">
          <input type="search" name="q" defaultValue={raw} placeholder="Buscar por nome" aria-label="Buscar por nome" />
          <button type="submit" className={styles.btn}>Buscar</button>
        </form>
        <Link className={`${styles.btn} ${styles.primary}`} href="/admin/produtos/novo">Novo produto</Link>
      </div>
      {data.length === 0 ? (
        <p>{term ? 'Nenhum produto encontrado.' : 'Nenhum produto cadastrado ainda.'}</p>
      ) : (
        <ul className={styles.list}>
          {data.map((p) => {
            const thumb = [...p.product_images].sort((a, b) => a.position - b.position)[0]?.url;
            const prices = p.variants.map((v) => v.retail_cents);
            return (
              <li className={styles.item} key={p.id}>
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element -- fotos do Storage ou SVG de /placeholders
                  <img className={styles.thumb} src={thumb} alt="" />
                ) : (
                  <span className={styles.thumb} />
                )}
                <div className={styles.info}>
                  <Link href={`/admin/produtos/${p.id}`}>{p.name}</Link>
                  <span className={styles.muted}>
                    {p.categories?.name ?? 'Sem categoria'} · {prices.length ? `a partir de ${formatBRL(Math.min(...prices))}` : 'sem preço'}
                  </span>
                </div>
                <div className={styles.toggles}>
                  <Toggle label="Destaque" checked={p.featured} action={setFeatured.bind(null, p.id)} />
                  <Toggle label="Disponível" checked={p.available} action={setAvailable.bind(null, p.id)} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
