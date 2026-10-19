import { SettingsForm } from '@/components/admin/SettingsForm';
import { requireUser } from '@/lib/auth';
import { mapSettings, type SettingsRow } from '@/lib/settings';
import { createClient } from '@/lib/supabase/server';

// Painel lê a sessão a cada requisição: bloqueia no servidor em vez de mostrar um esqueleto.
export const instant = false;

export default async function ConfiguracoesPage() {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single();
  if (error) throw new Error(error.message);
  const s = mapSettings(data as SettingsRow);

  return (
    <SettingsForm whatsappNumber={s.whatsappNumber} topbarText={s.topbarText} footer={s.footer} />
  );
}
