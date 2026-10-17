import Link from 'next/link';
import { CategoryFilter } from '@/components/admin/CategoryFilter';
import { Toggle } from '@/components/admin/Toggle';
import { categoryFilterIds } from '@/lib/categories';
import { requireUser } from '@/lib/auth';
import { fromPrices, mapProduct, PRODUCT_SELECT, type ProductRow } from '@/lib/data';
import { formatBRL } from '@/lib/pricing';
import { createClient } from '@/lib/supabase/server';
import styles from '../../admin.module.css';
import { setAvailable, setFeatured } from './actions';

type Row = ProductRow & { category: { name: string } | null };

// Painel lê a sessão a cada requisição: bloqueia no servidor em vez de mostrar um esqueleto.
export const instant = false;

export default async function ProdutosPage({ searchParams }: PageProps<'/admin/produtos'>) {
  await requireUser();
  const { q, cat } = await searchParams;
  const raw = typeof q === 'string' ? q : '';
  // % e _ são curingas do ilike: tratados como texto comum (mesma limpeza da busca da vitrine).
  const term = raw.replace(/[%_,()]/g, ' ').trim();

  const supabase = await createClient();
  const { data: cats, error: catsError } = await supabase.from('categories').select('id, name, slug, parent_id').order('position');
  if (catsError) throw new Error(catsError.message);
  const categories = cats.map((c) => ({ id: c.id, name: c.name, slug: c.slug, parentId: c.parent_id }));
  const ids = categoryFilterIds(categories, cat);
  const current = ids ? (cat as string) : '';
  let query = supabase.from('products')
    .select(`${PRODUCT_SELECT}, category:categories(name)`)
    .order('name');
  if (term) query = query.ilike('name', `%${term}%`);
  if (ids) query = query.in('category_id', ids);
  const { data, error } = await query.overrideTypes<Row[], { merge: false }>();
  if (error) throw new Error(error.message);

  return (
    <>
      <h1 className={styles.title}>Produtos</h1>
      <div className={styles.toolbar}>
        <form className={styles.search} action="/admin/produtos">
          <input type="search" name="q" defaultValue={raw} placeholder="Buscar por nome" aria-label="Buscar por nome" />
          <CategoryFilter categories={categories} current={current} />
          <button type="submit" className={styles.btn}>Buscar</button>
        </form>
        {(raw || ids) && <Link className={styles.btn} href="/admin/produtos">Limpar filtros</Link>}
        <Link className={`${styles.btn} ${styles.primary}`} href="/admin/produtos/novo">Novo produto</Link>
      </div>
      {data.length === 0 ? (
        <p>{term || ids ? 'Nenhum produto encontrado.' : 'Nenhum produto cadastrado ainda.'}</p>
      ) : (
        <ul className={styles.list}>
          {data.map((row) => {
            const p = mapProduct(row);
            const thumb = p.images[0];
            // Mesma regra da vitrine: variações esgotadas não entram no "a partir de".
            const from = fromPrices(p);
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
                    {row.category?.name ?? 'Sem categoria'} · {from ? `a partir de ${formatBRL(from.retailCents)}` : 'variações esgotadas'}
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
