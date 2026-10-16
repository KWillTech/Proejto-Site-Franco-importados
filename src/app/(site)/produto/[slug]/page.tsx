import { notFound } from 'next/navigation';
import { ChannelToggle } from '@/components/site/ChannelToggle';
import { ProductDetail } from '@/components/site/ProductDetail';
import { getFeaturedProducts, getProductBySlug } from '@/lib/data';

// Cache por slug; o notFound fica fora da função cacheada.
async function loadProduct(slug: string) {
  'use cache';
  return getProductBySlug(slug);
}

// Destaques são pré-gerados; os demais produtos renderizam sob demanda.
export async function generateStaticParams() {
  return (await getFeaturedProducts()).map((p) => ({ slug: p.slug }));
}

export default async function ProductPage({ params }: PageProps<'/produto/[slug]'>) {
  const { slug } = await params;
  const product = await loadProduct(slug);
  // shortcut: slug fora do generateStaticParams responde 200 com noindex (notFound depois do shell em streaming), trocar por checagem em src/proxy.ts se o SEO exigir 404 real
  if (!product) notFound();
  return (
    <main className="page-main">
      <section className="container">
        <ChannelToggle />
        <ProductDetail product={product} />
      </section>
    </main>
  );
}
