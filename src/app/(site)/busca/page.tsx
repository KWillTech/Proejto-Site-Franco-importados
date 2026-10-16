import Link from 'next/link';
import { Suspense } from 'react';
import { ChannelToggle } from '@/components/site/ChannelToggle';
import { ProductGrid } from '@/components/site/ProductGrid';
import { searchProducts } from '@/lib/data';

// Cache por termo de busca.
async function search(q: string) {
  'use cache';
  return searchProducts(q);
}

async function SearchContent({ searchParams }: Pick<PageProps<'/busca'>, 'searchParams'>) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? '';
  if (!q) {
    return (
      <section className="container">
        <p style={{ textAlign: 'center' }}>Digite o que você procura na busca.</p>
      </section>
    );
  }
  const products = await search(q);
  return (
    <section className="container">
      <h1 className="sec-title">Resultados para &quot;{q}&quot;</h1>
      {products.length ? (
        <>
          <ChannelToggle />
          <ProductGrid products={products} />
        </>
      ) : (
        <p style={{ textAlign: 'center' }}>
          Nenhum produto encontrado para &quot;{q}&quot;. <Link href="/">Voltar para a home</Link>
        </p>
      )}
    </section>
  );
}

export default function SearchPage({ searchParams }: PageProps<'/busca'>) {
  return (
    <main style={{ padding: '32px 0' }}>
      <Suspense>
        <SearchContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
