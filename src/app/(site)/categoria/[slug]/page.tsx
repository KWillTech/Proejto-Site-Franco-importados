import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ChannelToggle } from '@/components/site/ChannelToggle';
import { ProductGrid } from '@/components/site/ProductGrid';
import { filterBySub, getMenuCategories, getProductsByCategory } from '@/lib/data';
import styles from './page.module.css';

// Cache por slug; o notFound fica fora da função cacheada.
async function loadCategory(slug: string) {
  'use cache';
  return getProductsByCategory(slug);
}

export async function generateMetadata({ params }: PageProps<'/categoria/[slug]'>): Promise<Metadata> {
  const data = await loadCategory((await params).slug);
  return data ? { title: data.category.name } : {};
}

// Slugs fora do generateStaticParams renderizam sob demanda: a navegação pode bloquear, então a validação de instant não se aplica.
export const instant = false;

// Categorias do menu são pré-geradas; as demais renderizam sob demanda.
export async function generateStaticParams() {
  const slugs = (await getMenuCategories()).flatMap((c) => [c, ...c.children]).map((c) => ({ slug: c.slug }));
  // Cache Components exige ≥1 param; o sentinela cai no notFound() da página.
  return slugs.length ? slugs : [{ slug: 'sem-categoria' }];
}

async function CategoryContent({ params, searchParams }: PageProps<'/categoria/[slug]'>) {
  const { slug } = await params;
  const data = await loadCategory(slug);
  // shortcut: categoria inexistente ou oculta responde 200 com noindex (notFound dentro do Suspense, depois do shell em streaming), trocar por checagem em src/proxy.ts se o SEO exigir 404 real
  if (!data) notFound();
  const raw = (await searchParams).sub;
  const { active, products } = filterBySub(data.products, data.subcategories, typeof raw === 'string' ? raw : undefined);
  const { name } = data.category;
  return (
    <section className="container">
      <h1 className="sec-title">{data.parent ? `${data.parent.name} › ${name}` : name}</h1>
      <ChannelToggle />
      {data.subcategories.length > 0 && (
        <nav className={styles.subs} aria-label="Subcategorias">
          <Link href={`/categoria/${slug}`} aria-current={active ? undefined : 'page'}>Todos</Link>
          {data.subcategories.map((c) => (
            <Link key={c.id} href={`/categoria/${slug}?sub=${c.slug}`} aria-current={active === c.slug ? 'page' : undefined}>
              {c.name}
            </Link>
          ))}
        </nav>
      )}
      {products.length ? (
        <ProductGrid products={products} />
      ) : (
        <p className="center">Ainda não há produtos nesta categoria.</p>
      )}
    </section>
  );
}

export default function CategoryPage({ params, searchParams }: PageProps<'/categoria/[slug]'>) {
  return (
    <main className="page-main">
      <Suspense>
        <CategoryContent params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
