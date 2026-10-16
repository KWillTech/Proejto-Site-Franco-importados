'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { UUID } from '@/lib/cart';
import { createClient } from '@/lib/supabase/server';
import { bannerSchema, fieldErrors } from '@/lib/validation';

type Result = { ok: true } | { ok: false; errors: Record<string, string> };

const fail = (message: string): Result => ({ ok: false, errors: { form: message } });
const SAVE_FAILED = fail('Não foi possível salvar. Tente de novo.');
const isId = (id: unknown): id is string => typeof id === 'string' && UUID.test(id);
const done = (): Result => {
  revalidatePath('/', 'layout'); // o slider está na home
  return { ok: true };
};

export async function saveBanner(id: string | null, input: unknown): Promise<Result> {
  await requireUser();
  if (id !== null && !isId(id)) return fail('Banner não encontrado.');
  const parsed = bannerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const b = parsed.data;
  const row = { image_desktop: b.imageDesktop, image_mobile: b.imageMobile, alt: b.alt, link: b.link, active: b.active };
  const supabase = await createClient();
  if (id) {
    const { error } = await supabase.from('banners').update(row).eq('id', id);
    if (error) return SAVE_FAILED;
  } else {
    const { data, error } = await supabase.from('banners').select('position').order('position', { ascending: false }).limit(1);
    if (error) return SAVE_FAILED;
    const last = (data as Array<{ position: number }> | null)?.[0]?.position ?? -1;
    const { error: insError } = await supabase.from('banners').insert({ ...row, position: last + 1 });
    if (insError) return SAVE_FAILED;
  }
  return done();
}

export async function deleteBanner(id: string): Promise<Result> {
  await requireUser();
  if (!isId(id)) return fail('Banner não encontrado.');
  const supabase = await createClient();
  // shortcut: os arquivos das imagens ficam no bucket media, limpar órfãos se o espaço do plano gratuito apertar.
  const { error } = await supabase.from('banners').delete().eq('id', id);
  return error ? fail('Não foi possível excluir. Tente de novo.') : done();
}

/** `ids`: todos os banners, na nova ordem. */
export async function reorderBanners(ids: unknown): Promise<Result> {
  await requireUser();
  if (!Array.isArray(ids) || !ids.every(isId) || new Set(ids).size !== ids.length) return fail('Ordem inválida.');
  const supabase = await createClient();
  const { data, error: readError } = await supabase.from('banners').select('id');
  if (readError) return SAVE_FAILED;
  const have = new Set((data ?? []).map((r: { id: string }) => r.id));
  if (have.size !== ids.length || !ids.every((id) => have.has(id))) return fail('Ordem inválida.');
  // shortcut: uma gravação por banner, sem transação; uma falha no meio deixa a ordem pela metade, mover de novo corrige.
  for (const [position, id] of ids.entries()) {
    const { error } = await supabase.from('banners').update({ position }).eq('id', id);
    if (error) return SAVE_FAILED;
  }
  return done();
}
