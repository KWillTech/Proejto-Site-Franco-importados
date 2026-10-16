import { notFound } from 'next/navigation';
import { ChannelToggle } from '@/components/site/ChannelToggle';
import { ProductGrid } from '@/components/site/ProductGrid';
import { getMenuCategories, getProductsByCategory } from '@/lib/data';

// Cache por slug; o notFound fica fora da função cacheada.
async function loadCategory(slug: string) {
  'use cache';
  return getProductsByCategory(slug);
}

// Categorias do menu são pré-geradas; as demais renderizam sob demanda.
export async function generateStaticParams() {
  return (await getMenuCategories()).map((c) => ({ slug: c.slug }));
}

export default async function CategoryPage({ params }: PageProps<'/categoria/[slug]'>) {
  const { slug } = await params;
  const data = await loadCategory(slug);
  if (!data) notFound();
  return (
    <main style={{ padding: '32px 0' }}>
      <section className="container">
        <h1 className="sec-title">{data.category.name}</h1>
        <ChannelToggle />
        {data.products.length ? (
          <ProductGrid products={data.products} />
        ) : (
          <p style={{ textAlign: 'center' }}>Ainda não há produtos nesta categoria.</p>
        )}
      </section>
    </main>
  );
}
