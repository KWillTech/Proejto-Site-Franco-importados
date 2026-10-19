'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { fieldErrors, SAVE_FAILED, settingsSchema } from '@/lib/validation';

type Result = { ok: true } | { ok: false; errors: Record<string, string> };

export async function saveSettings(input: unknown): Promise<Result> {
  await requireUser();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.from('settings')
    .update({
      whatsapp_number: parsed.data.whatsappNumber, topbar_text: parsed.data.topbarText,
      footer_hours: parsed.data.footer.hours, footer_email: parsed.data.footer.email,
      footer_payment: parsed.data.footer.payment, footer_shipping: parsed.data.footer.shipping,
      footer_copyright: parsed.data.footer.copyright,
    }).eq('id', 1);
  // Coluna do rodapé inexistente: a migração 0006 ainda não rodou no Supabase.
  if (error?.code === 'PGRST204' || error?.code === '42703') {
    return { ok: false, errors: { form: 'Falta atualizar o banco (migração 0006_rodape.sql) para salvar o rodapé.' } };
  }
  if (error) return SAVE_FAILED;
  revalidatePath('/', 'layout'); // topbar, rodapé, botão flutuante e carrinho leem as configurações
  return { ok: true };
}
