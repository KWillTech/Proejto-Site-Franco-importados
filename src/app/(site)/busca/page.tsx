import Link from 'next/link';
import { Suspense } from 'react';
import { ChannelToggle } from '@/components/site/ChannelToggle';
import { ProductGrid } from '@/components/site/ProductGrid';
import { searchProducts } from '@/lib/data';

async function SearchContent({ searchParams }: Pick<PageProps<'/busca'>, 'searchParams'>) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? '';
  if (!q) {
    return (
      <section className="container">
        <p className="center">Digite o que você procura na busca.</p>
      </section>
    );
  }
  const products = await searchProducts(q);
  return (
    <section className="container">
      <h1 className="sec-title">Resultados para &quot;{q}&quot;</h1>
      {products.length ? (
        <>
          <ChannelToggle />
          <ProductGrid products={products} />
        </>
      ) : (
        <p className="center">
          Nenhum produto encontrado para &quot;{q}&quot;. <Link href="/">Voltar para a home</Link>
        </p>
      )}
    </section>
  );
}

export default function SearchPage({ searchParams }: PageProps<'/busca'>) {
  return (
    <main className="page-main">
      <Suspense>
        <SearchContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
