import { BannersManager } from '@/components/admin/BannersManager';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

// Painel lê a sessão a cada requisição: bloqueia no servidor em vez de mostrar um esqueleto.
export const instant = false;

type Row = { id: string; image_desktop: string; image_mobile: string; alt: string; link: string | null; active: boolean };

export default async function BannersPage() {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.from('banners')
    .select('id, image_desktop, image_mobile, alt, link, active').order('position')
    .overrideTypes<Row[], { merge: false }>();
  if (error) throw new Error(error.message);

  return (
    <BannersManager banners={data.map((b) => ({
        id: b.id, imageDesktop: b.image_desktop, imageMobile: b.image_mobile, alt: b.alt, link: b.link, active: b.active,
    }))} />
  );
}
