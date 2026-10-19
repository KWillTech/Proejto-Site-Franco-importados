import Link from 'next/link';
import { CategoryFilter } from '@/components/admin/CategoryFilter';
import { Toggle } from '@/components/admin/Toggle';
import { categoryFilterIds } from '@/lib/categories';
import { requireUser } from '@/lib/auth';
import { fromPrices, mapProduct, PRODUCT_SELECT, type ProductRow } from '@/lib/data';
import { formatBRL } from '@/lib/pricing';
import { createClient } from '@/lib/supabase/server';
import p from './produtos.module.css';
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

  const total = data.length;
  const availableCount = data.filter((r) => r.available).length;
  const featuredCount = data.filter((r) => r.featured).length;
  const filtered = Boolean(raw || ids);

  return (
    <div className={p.page}>
      <header className={p.intro}>
        <div>
          <h1>Produtos</h1>
          <p>Clique no nome para editar. Os interruptores gravam na hora.</p>
        </div>
        <Link className={p.primary} href="/admin/produtos/novo">+ Novo produto</Link>
      </header>

      <div className={p.stats}>
        <div className={p.stat}><span>{filtered ? 'Encontrados' : 'Produtos'}</span><strong>{total}</strong></div>
        <div className={p.stat}><span>Disponíveis</span><strong>{availableCount}</strong>
          <i className={p.barOn} style={{ width: `${total ? (availableCount / total) * 100 : 0}%` }} /></div>
        <div className={p.stat}><span>Em destaque na home</span><strong className={p.gold}>{featuredCount}</strong></div>
      </div>

      <section className={p.card}>
        <form className={p.tools} action="/admin/produtos">
          <label className={p.search}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>
            <input key={raw} type="search" name="q" defaultValue={raw} placeholder="Buscar por nome" aria-label="Buscar por nome" />
          </label>
          <span className={p.select}><CategoryFilter key={current} categories={categories} current={current} /></span>
          <button type="submit" className={p.ghost}>Buscar</button>
          {filtered && <Link className={p.clear} href="/admin/produtos">Limpar filtros</Link>}
        </form>

        {data.length === 0 ? (
          <p className={p.empty}>{filtered ? 'Nenhum produto encontrado.' : 'Nenhum produto cadastrado ainda.'}</p>
        ) : (
          <ul className={p.list}>
            {data.map((row) => {
              const prod = mapProduct(row);
              const thumb = prod.images[0];
              // Mesma regra da vitrine: variações esgotadas não entram no "a partir de".
              const from = fromPrices(prod);
              const n = prod.variants.length;
              return (
                <li className={`${p.item} ${prod.available ? '' : p.off}`} key={prod.id}>
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element -- fotos do Storage ou SVG de /placeholders
                    <img className={p.thumb} src={thumb} alt="" />
                  ) : (
                    <span className={`${p.thumb} ${p.noThumb}`}>sem foto</span>
                  )}
                  <div className={p.info}>
                    <Link className={p.name} href={`/admin/produtos/${prod.id}`}>{prod.name}</Link>
                    <div className={p.meta}>
                      <span className={p.cat}>{row.category?.name ?? 'Sem categoria'}</span>
                      {n > 1 && <span className={p.variants}>{n} variações</span>}
                      {prod.badge && <span className={p.badge}>{prod.badge}</span>}
                    </div>
                  </div>
                  <div className={p.price}>
                    {from ? <><small>a partir de</small><b>{formatBRL(from.retailCents)}</b></> : <span className={p.soldOut}>variações esgotadas</span>}
                  </div>
                  <div className={p.toggles}>
                    <Toggle label="Destaque" checked={prod.featured} action={setFeatured.bind(null, prod.id)} />
                    <Toggle label="Disponível" checked={prod.available} action={setAvailable.bind(null, prod.id)} />
                  </div>
                  <Link className={p.edit} href={`/admin/produtos/${prod.id}`} aria-label={`Editar ${prod.name}`}>Editar</Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
