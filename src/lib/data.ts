import { createClient } from '@supabase/supabase-js';
import { buildTree } from './categories';
import type { Banner, Category, MenuCategory, Product, Settings, Variant } from './types';

/** Forma devolvida por PRODUCT_SELECT. */
export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  featured: boolean;
  available: boolean;
  badge: string | null;
  pix_percent: number | null;
  installments: number | null;
  option_names: string[] | null;
  categories: { slug: string } | null;
  product_images: Array<{ url: string; position: number }>;
  variants: Array<{
    id: string;
    option_values: string[] | null;
    retail_cents: number;
    wholesale_cents: number;
    available: boolean;
    position: number;
  }>;
};

type CategoryRow = {
  id: string; name: string; slug: string; parent_id: string | null; home_card: boolean;
  home_card_image: string | null; home_card_tag: string | null;
};

export const PRODUCT_SELECT =
  'id, slug, name, description, featured, available, badge, pix_percent, installments, option_names, ' +
  'categories(slug), product_images(url, position), ' +
  'variants(id, option_values, retail_cents, wholesale_cents, available, position)';

const CATEGORY_SELECT = 'id, name, slug, parent_id, home_card, home_card_image, home_card_tag';

// Cliente anônimo (somente leitura pública via RLS), criado sob demanda:
// importar este módulo sem variáveis de ambiente não pode lançar erro.
function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

function mapVariant(v: ProductRow['variants'][number]): Variant {
  return {
    id: v.id,
    optionValues: v.option_values ?? [],
    retailCents: v.retail_cents,
    wholesaleCents: v.wholesale_cents,
    available: v.available,
  };
}

export function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? '',
    categorySlug: row.categories?.slug ?? '',
    images: [...row.product_images].sort((a, b) => a.position - b.position).map((i) => i.url),
    badge: row.badge,
    available: row.available,
    featured: row.featured,
    pixPercent: row.pix_percent,
    installments: row.installments,
    optionNames: row.option_names ?? [],
    variants: [...row.variants].sort((a, b) => a.position - b.position).map(mapVariant),
  };
}

export function fromPrices(p: Product): { retailCents: number; wholesaleCents: number; hasRange: boolean } | null {
  const open = p.variants.filter((v) => v.available);
  if (open.length === 0) return null;
  const retail = open.map((v) => v.retailCents);
  const wholesale = open.map((v) => v.wholesaleCents);
  const minR = Math.min(...retail);
  const minW = Math.min(...wholesale);
  const hasRange = Math.max(...retail) !== minR || Math.max(...wholesale) !== minW;
  return { retailCents: minR, wholesaleCents: minW, hasRange };
}

export function isSoldOut(p: Product): boolean {
  return !p.available || !p.variants.some((v) => v.available);
}

function mapCategory(r: CategoryRow): Category {
  return {
    id: r.id, name: r.name, slug: r.slug, parentId: r.parent_id, homeCard: r.home_card,
    homeCardImage: r.home_card_image, homeCardTag: r.home_card_tag,
  };
}

function mapProducts(rows: unknown): Product[] {
  return (rows as ProductRow[]).map(mapProduct);
}

export async function getSettings(): Promise<Settings> {
  const data = check(
    await db().from('settings').select('whatsapp_number, topbar_text').eq('id', 1).maybeSingle(),
  ) as { whatsapp_number: string; topbar_text: string } | null;
  if (!data) throw new Error('Linha de configurações (settings id=1) não encontrada.');
  return { whatsappNumber: data.whatsapp_number, topbarText: data.topbar_text };
}

async function getVisibleCategories(client = db()): Promise<Category[]> {
  const rows = check(await client.from('categories').select(CATEGORY_SELECT).eq('visible', true).order('position'));
  return (rows as CategoryRow[]).map(mapCategory);
}

// Filha de mãe oculta fica órfã e buildTree a descarta.
export async function getMenuCategories(): Promise<MenuCategory[]> {
  return buildTree(await getVisibleCategories());
}

export async function getHomeCards(): Promise<Category[]> {
  const rows = check(
    await db().from('categories').select(CATEGORY_SELECT)
      .eq('visible', true).eq('home_card', true).order('position').limit(3),
  );
  return (rows as CategoryRow[]).map(mapCategory);
}

export async function getActiveBanners(): Promise<Banner[]> {
  const rows = check(
    await db().from('banners').select('id, image_desktop, image_mobile, alt, link').eq('active', true).order('position'),
  );
  return rows.map((r) => ({
    id: r.id, imageDesktop: r.image_desktop, imageMobile: r.image_mobile, alt: r.alt, link: r.link,
  }));
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const rows = check(await db().from('products').select(PRODUCT_SELECT).eq('featured', true).order('created_at'));
  return mapProducts(rows);
}

export async function getProductsByCategory(slug: string): Promise<{
  category: Category; parent: Category | null; subcategories: Category[]; products: Product[];
} | null> {
  const client = db();
  const visible = await getVisibleCategories(client);
  const category = visible.find((c) => c.slug === slug);
  if (!category) return null;
  const parent = category.parentId ? visible.find((c) => c.id === category.parentId) : null;
  if (category.parentId && !parent) return null; // mãe oculta: filha oculta
  const subcategories = visible.filter((c) => c.parentId === category.id);
  const ids = [category.id, ...subcategories.map((c) => c.id)];
  const rows = check(await client.from('products').select(PRODUCT_SELECT).in('category_id', ids).order('created_at'));
  return { category, parent: parent ?? null, subcategories, products: mapProducts(rows) };
}

export function filterBySub(
  products: Product[], subcategories: Category[], sub: string | undefined,
): { active: string | null; products: Product[] } {
  const active = subcategories.find((c) => c.slug === sub)?.slug ?? null;
  return { active, products: active ? products.filter((p) => p.categorySlug === active) : products };
}

export async function searchProducts(q: string): Promise<Product[]> {
  const term = q.trim().replace(/[%_,()]/g, ' ').trim();
  if (!term) return [];
  const rows = check(await db().from('products').select(PRODUCT_SELECT).ilike('name', `%${term}%`).order('name'));
  return mapProducts(rows);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const row = check(await db().from('products').select(PRODUCT_SELECT).eq('slug', slug).maybeSingle());
  return row ? mapProduct(row as unknown as ProductRow) : null;
}

export async function getAllProductSlugs(): Promise<string[]> {
  return check(await db().from('products').select('slug')).map((r) => r.slug as string);
}

export async function getVariantsByIds(ids: string[]): Promise<Array<{ variant: Variant; product: Product }>> {
  if (ids.length === 0) return [];
  const client = db();
  const found = check(await client.from('variants').select('product_id').in('id', ids));
  const productIds = [...new Set(found.map((r) => r.product_id as string))];
  if (productIds.length === 0) return [];
  const rows = check(await client.from('products').select(PRODUCT_SELECT).in('id', productIds));
  const wanted = new Set(ids);
  const out: Array<{ variant: Variant; product: Product }> = [];
  for (const product of mapProducts(rows)) {
    for (const variant of product.variants) {
      if (wanted.has(variant.id)) out.push({ variant, product });
    }
  }
  return out;
}
