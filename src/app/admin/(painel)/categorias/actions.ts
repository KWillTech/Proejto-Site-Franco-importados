'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { categorySchema, fieldErrors, isId, SAVE_FAILED, slugify, uniqueSlug } from '@/lib/validation';

type Result = { ok: true } | { ok: false; errors: Record<string, string> };

const fail = (message: string, key = 'form'): Result => ({ ok: false, errors: { [key]: message } });
const DELETE_FAILED = fail('Não foi possível excluir. Tente de novo.');
const HAS_PRODUCTS = fail('Mova ou exclua os produtos desta categoria antes.');
const NOT_ROOT = fail('Escolha uma categoria principal.', 'parentId');
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
    // shortcut: conferir e gravar não são atômicos; duas gravações simultâneas poderiam passar de 3, tolerável com uma só pessoa no painel, trocar por trigger/constraint no banco se mudar.
    if ((data ?? []).length >= 3) return fail('Escolha no máximo 3 categorias para a home.', 'homeCard');
  }

  // Dois níveis no máximo; o trigger da 0003 garante no banco, aqui é para a mensagem.
  if (c.parentId) {
    if (c.parentId === id) return NOT_ROOT;
    // Uma leitura: a mãe escolhida e, ao editar, as filhas desta categoria (ids já validados como uuid).
    const filter = id ? `id.eq.${c.parentId},parent_id.eq.${id}` : `id.eq.${c.parentId}`;
    const { data, error } = await supabase.from('categories').select('id, parent_id').or(filter);
    if (error) return SAVE_FAILED;
    const rows = (data ?? []) as Array<{ id: string; parent_id: string | null }>;
    if (id && rows.some((r) => r.parent_id === id)) return fail('Esta categoria tem subcategorias.', 'parentId');
    const parent = rows.find((r) => r.id === c.parentId);
    if (!parent || parent.parent_id) return NOT_ROOT;
  }

  const row = {
    name: c.name, visible: c.visible, home_card: c.homeCard,
    home_card_image: c.homeCardImage, home_card_tag: c.homeCardTag, parent_id: c.parentId,
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
  const { data: children, error: childError } = await supabase.from('categories').select('id').eq('parent_id', id).limit(1);
  if (childError) return DELETE_FAILED;
  if ((children ?? []).length) return fail('Mova ou exclua as subcategorias antes.');
  const { data, error } = await supabase.from('products').select('id').eq('category_id', id).limit(1);
  if (error) return DELETE_FAILED;
  if ((data ?? []).length) return HAS_PRODUCTS;
  const { error: delError } = await supabase.from('categories').delete().eq('id', id);
  // 23503: um produto entrou entre a conferência e a exclusão (a FK é on delete restrict).
  // shortcut: uma subcategoria criada nesse intervalo também dá 23503 e mostra a mensagem de produtos, raro com uma pessoa no painel; olhar o nome da constraint se confundir.
  if (delError) return delError.code === '23503' ? HAS_PRODUCTS : DELETE_FAILED;
  return done();
}

/** `ids`: todas as categorias, na nova ordem. */
export async function reorderCategories(ids: unknown): Promise<Result> {
  await requireUser();
  if (!Array.isArray(ids) || !ids.every(isId) || new Set(ids).size !== ids.length) return fail('Ordem inválida.');
  const supabase = await createClient();
  const { data, error: readError } = await supabase.from('categories').select('id');
  if (readError) return SAVE_FAILED;
  const have = new Set((data ?? []).map((r: { id: string }) => r.id));
  if (have.size !== ids.length || !ids.every((id) => have.has(id))) return fail('Ordem inválida.');
  // shortcut: uma gravação por categoria, sem transação; uma falha no meio deixa a ordem pela metade, mover de novo corrige.
  for (const [position, id] of ids.entries()) {
    const { error } = await supabase.from('categories').update({ position }).eq('id', id);
    if (error) return SAVE_FAILED;
  }
  return done();
}
