import { ProductForm } from '@/components/admin/ProductForm';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

// Painel lê a sessão a cada requisição: bloqueia no servidor em vez de mostrar um esqueleto.
export const instant = false;

export default async function NovoProdutoPage() {
  await requireUser();
  const supabase = await createClient();
  const { data: categories, error } = await supabase.from('categories').select('id, name, parent_id').order('position');
  if (error) throw new Error(error.message);
  return (
    <ProductForm id={null} categories={categories.map((c) => ({ id: c.id, name: c.name, parentId: c.parent_id }))} initial={null} />
  );
}
