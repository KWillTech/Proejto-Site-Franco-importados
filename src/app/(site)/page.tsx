import { Benefits } from '@/components/site/Benefits';
import { CategoryCards } from '@/components/site/CategoryCards';
import { ChannelToggle } from '@/components/site/ChannelToggle';
import { HeroSlider } from '@/components/site/HeroSlider';
import { ProductGrid } from '@/components/site/ProductGrid';
import { getActiveBanners, getFeaturedProducts, getHomeCards } from '@/lib/data';

// Mesmo critério do layout: cache até o painel chamar revalidatePath.
export default async function Home() {
  'use cache';
  const [banners, cards, products] = await Promise.all([getActiveBanners(), getHomeCards(), getFeaturedProducts()]);
  return (
    <main>
      <HeroSlider banners={banners} />
      <Benefits />
      <CategoryCards categories={cards} />
      <section className="container">
        <h2 className="sec-title">Lançamentos</h2>
        <ChannelToggle />
        <ProductGrid products={products} />
      </section>
    </main>
  );
}
