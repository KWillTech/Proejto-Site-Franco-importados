import type { MetadataRoute } from 'next';
import { getAllProductSlugs, getMenuCategories } from '@/lib/data';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const [categories, slugs] = await Promise.all([getMenuCategories(), getAllProductSlugs()]);
  // new URL tolera barra final na env (evita //).
  const url = (path: string) => new URL(path, base).href;
  return [
    { url: url('/') },
    ...categories.flatMap((c) => [c, ...c.children]).map((c) => ({ url: url(`/categoria/${c.slug}`) })),
    ...slugs.map((s) => ({ url: url(`/produto/${s}`) })),
  ];
}
