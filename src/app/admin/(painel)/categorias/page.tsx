import { CategoriesManager } from '@/components/admin/CategoriesManager';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

// Painel lê a sessão a cada requisição: bloqueia no servidor em vez de mostrar um esqueleto.
export const instant = false;

type Row = {
  id: string; name: string; parent_id: string | null; visible: boolean; home_card: boolean;
  home_card_image: string | null; home_card_tag: string | null;
};

export default async function CategoriasPage() {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.from('categories')
    .select('id, name, parent_id, visible, home_card, home_card_image, home_card_tag').order('position')
    .overrideTypes<Row[], { merge: false }>();
  if (error) throw new Error(error.message);

  return (
    <>
      <CategoriesManager categories={data.map((c) => ({
        id: c.id, name: c.name, parentId: c.parent_id, visible: c.visible, homeCard: c.home_card,
        homeCardImage: c.home_card_image, homeCardTag: c.home_card_tag,
      }))} />
    </>
  );
}
