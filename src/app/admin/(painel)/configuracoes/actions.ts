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
    .update({ whatsapp_number: parsed.data.whatsappNumber, topbar_text: parsed.data.topbarText }).eq('id', 1);
  if (error) return SAVE_FAILED;
  revalidatePath('/', 'layout'); // topbar, botão flutuante e carrinho leem as configurações
  return { ok: true };
}
