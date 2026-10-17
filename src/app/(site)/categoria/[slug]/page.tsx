import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ChannelToggle } from '@/components/site/ChannelToggle';
import { ProductGrid } from '@/components/site/ProductGrid';
import { getMenuCategories, getProductsByCategory } from '@/lib/data';

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
  return (await getMenuCategories()).map((c) => ({ slug: c.slug }));
}

export default async function CategoryPage({ params }: PageProps<'/categoria/[slug]'>) {
  const { slug } = await params;
  const data = await loadCategory(slug);
  // shortcut: slug fora do generateStaticParams responde 200 com noindex (notFound depois do shell em streaming), trocar por checagem em src/proxy.ts se o SEO exigir 404 real
  if (!data) notFound();
  return (
    <main className="page-main">
      <section className="container">
        <h1 className="sec-title">{data.category.name}</h1>
        <ChannelToggle />
        {data.products.length ? (
          <ProductGrid products={data.products} />
        ) : (
          <p className="center">Ainda não há produtos nesta categoria.</p>
        )}
      </section>
    </main>
  );
}
