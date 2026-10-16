import { SettingsForm } from '@/components/admin/SettingsForm';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import styles from '../../admin.module.css';

// Painel lê a sessão a cada requisição: bloqueia no servidor em vez de mostrar um esqueleto.
export const instant = false;

export default async function ConfiguracoesPage() {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.from('settings').select('whatsapp_number, topbar_text').eq('id', 1).single();
  if (error) throw new Error(error.message);

  return (
    <>
      <h1 className={styles.title}>Configurações</h1>
      <SettingsForm whatsappNumber={data.whatsapp_number} topbarText={data.topbar_text} />
    </>
  );
}
