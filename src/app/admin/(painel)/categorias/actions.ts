'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { UUID } from '@/lib/cart';
import { createClient } from '@/lib/supabase/server';
import { categorySchema, fieldErrors, slugify, uniqueSlug } from '@/lib/validation';

type Result = { ok: true } | { ok: false; errors: Record<string, string> };

const fail = (message: string, key = 'form'): Result => ({ ok: false, errors: { [key]: message } });
const SAVE_FAILED = fail('Não foi possível salvar. Tente de novo.');
const DELETE_FAILED = fail('Não foi possível excluir. Tente de novo.');
const HAS_PRODUCTS = fail('Mova ou exclua os produtos desta categoria antes.');
const isId = (id: unknown): id is string => typeof id === 'string' && UUID.test(id);
const done = (): Result => {
  revalidatePath('/', 'layout'); // menu, home e categorias da vitrine
  return { ok: true };
};

export async function saveCategory(id: string | null, input: unknown): Promise<Result> {
  await requireUser();
  if (id !== null && !isId(id)) return fail('Categoria não encontrada.');
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const c = parsed.data;
  const supabase = await createClient();

  if (c.homeCard) {
    let q = supabase.from('categories').select('id').eq('home_card', true);
    if (id) q = q.neq('id', id);
    const { data, error } = await q;
    if (error) return SAVE_FAILED;
    if ((data ?? []).length >= 3) return fail('Escolha no máximo 3 categorias para a home.', 'homeCard');
  }

  const row = {
    name: c.name, visible: c.visible, home_card: c.homeCard,
    home_card_image: c.homeCardImage, home_card_tag: c.homeCardTag,
  };
  if (id) {
    // O slug não muda ao renomear: links já compartilhados continuam valendo.
    const { error } = await supabase.from('categories').update(row).eq('id', id);
    if (error) return SAVE_FAILED;
  } else {
    const { data: all, error } = await supabase.from('categories').select('slug, position').order('position', { ascending: false });
    if (error) return SAVE_FAILED;
    const rows = (all ?? []) as Array<{ slug: string; position: number }>;
    const slug = uniqueSlug(slugify(c.name) || 'categoria', rows.map((r) => r.slug));
    // shortcut: duas criações simultâneas podem colidir no unique do slug e cair em "Tente de novo", tratar o 23505 se acontecer.
    const { error: insError } = await supabase.from('categories').insert({ ...row, slug, position: (rows[0]?.position ?? -1) + 1 });
    if (insError) return SAVE_FAILED;
  }
  return done();
}

export async function deleteCategory(id: string): Promise<Result> {
  await requireUser();
  if (!isId(id)) return fail('Categoria não encontrada.');
  const supabase = await createClient();
  const { data, error } = await supabase.from('products').select('id').eq('category_id', id).limit(1);
  if (error) return DELETE_FAILED;
  if ((data ?? []).length) return HAS_PRODUCTS;
  const { error: delError } = await supabase.from('categories').delete().eq('id', id);
  // 23503: um produto entrou entre a conferência e a exclusão (a FK é on delete restrict).
  if (delError) return delError.code === '23503' ? HAS_PRODUCTS : DELETE_FAILED;
  return done();
}

/** `ids`: todas as categorias, na nova ordem. */
export async function reorderCategories(ids: unknown): Promise<Result> {
  await requireUser();
  if (!Array.isArray(ids) || !ids.every(isId) || new Set(ids).size !== ids.length) return fail('Ordem inválida.');
  const supabase = await createClient();
  // shortcut: uma gravação por categoria, sem transação; uma falha no meio deixa a ordem pela metade, mover de novo corrige.
  for (const [position, id] of ids.entries()) {
    const { error } = await supabase.from('categories').update({ position }).eq('id', id);
    if (error) return SAVE_FAILED;
  }
  return done();
}
