import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ChannelToggle } from '@/components/site/ChannelToggle';
import { ProductDetail } from '@/components/site/ProductDetail';
import { getFeaturedProducts, getProductBySlug } from '@/lib/data';

// Cache por slug; o notFound fica fora da função cacheada.
async function loadProduct(slug: string) {
  'use cache';
  return getProductBySlug(slug);
}

export async function generateMetadata({ params }: PageProps<'/produto/[slug]'>): Promise<Metadata> {
  const product = await loadProduct((await params).slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description.slice(0, 155) || undefined,
    openGraph: { images: product.images.slice(0, 1) },
  };
}

// Slugs fora do generateStaticParams renderizam sob demanda: a navegação pode bloquear, então a validação de instant não se aplica.
export const instant = false;

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
