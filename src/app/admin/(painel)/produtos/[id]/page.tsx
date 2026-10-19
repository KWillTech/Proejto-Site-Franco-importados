import { notFound } from 'next/navigation';
import { ProductForm } from '@/components/admin/ProductForm';
import { requireUser } from '@/lib/auth';
import { mapProduct, PRODUCT_SELECT, type ProductRow } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';
import { isId, type ProductInput } from '@/lib/validation';
import styles from '../../../admin.module.css';

type Row = ProductRow & { category_id: string };

// Painel lê a sessão a cada requisição: bloqueia no servidor em vez de mostrar um esqueleto.
export const instant = false;

export default async function EditarProdutoPage({ params }: PageProps<'/admin/produtos/[id]'>) {
  await requireUser();
  const { id } = await params;
  if (!isId(id)) notFound();

  const supabase = await createClient();
  const [product, categories] = await Promise.all([
    supabase.from('products')
      .select(`${PRODUCT_SELECT}, category_id`)
      .eq('id', id).maybeSingle<Row>(),
    supabase.from('categories').select('id, name, parent_id').order('position'),
  ]);
  if (product.error) throw new Error(product.error.message);
  if (categories.error) throw new Error(categories.error.message);
  if (!product.data) notFound();

  const p = mapProduct(product.data);
  const initial: ProductInput = {
    name: p.name, categoryId: product.data.category_id, description: p.description, badge: p.badge,
    featured: p.featured, available: p.available, pixPercent: p.pixPercent, installments: p.installments,
    optionNames: p.optionNames, images: p.images,
    variants: p.variants.map((v) => ({ id: v.id, optionValues: v.optionValues, available: v.available })),
  };

  return (
    <>
      <h1 className={styles.title}>Editar produto</h1>
      <ProductForm id={id} categories={categories.data.map((c) => ({ id: c.id, name: c.name, parentId: c.parent_id }))} initial={initial} />
    </>
  );
}
