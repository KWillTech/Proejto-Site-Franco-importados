import { notFound } from 'next/navigation';
import { ProductForm } from '@/components/admin/ProductForm';
import { requireUser } from '@/lib/auth';
import { UUID } from '@/lib/cart';
import type { ProductRow } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';
import type { ProductInput } from '@/lib/validation';
import styles from '../../../admin.module.css';

type Row = Omit<ProductRow, 'slug' | 'categories'> & { category_id: string };

// Painel lê a sessão a cada requisição: bloqueia no servidor em vez de mostrar um esqueleto.
export const instant = false;

export default async function EditarProdutoPage({ params }: PageProps<'/admin/produtos/[id]'>) {
  await requireUser();
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const [product, categories] = await Promise.all([
    supabase.from('products')
      .select('id, name, category_id, description, featured, available, badge, pix_percent, installments, option_names, ' +
        'product_images(url, position), variants(id, option_values, retail_cents, wholesale_cents, available, position)')
      .eq('id', id).maybeSingle<Row>(),
    supabase.from('categories').select('id, name').order('position'),
  ]);
  if (product.error) throw new Error(product.error.message);
  if (categories.error) throw new Error(categories.error.message);
  const p = product.data;
  if (!p) notFound();

  const byPosition = (a: { position: number }, b: { position: number }) => a.position - b.position;
  const initial: ProductInput = {
    name: p.name, categoryId: p.category_id, description: p.description ?? '', badge: p.badge,
    featured: p.featured, available: p.available, pixPercent: p.pix_percent, installments: p.installments,
    optionNames: p.option_names ?? [],
    variants: [...p.variants].sort(byPosition).map((v) => ({
      id: v.id, optionValues: v.option_values ?? [], retailCents: v.retail_cents,
      wholesaleCents: v.wholesale_cents, available: v.available,
    })),
    images: [...p.product_images].sort(byPosition).map((i) => i.url),
  };

  return (
    <>
      <h1 className={styles.title}>Editar produto</h1>
      <ProductForm id={id} categories={categories.data} initial={initial} />
    </>
  );
}
