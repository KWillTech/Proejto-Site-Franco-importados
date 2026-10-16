'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { fieldErrors, isId, productSchema, SAVE_FAILED, slugify, uniqueSlug } from '@/lib/validation';

type Result = { ok: true; id: string } | { ok: false; errors: Record<string, string> };
type SlugRow = { slug: string; categories: { slug: string } | null };


function checkId(id: unknown): asserts id is string {
  if (!isId(id)) throw new Error('Produto inválido.');
}

// Vitrine em cache ('use cache'): home, página do produto e categorias afetadas.
function revalidateStore(productSlug: string, categorySlugs: Array<string | undefined>) {
  revalidatePath('/');
  revalidatePath(`/produto/${productSlug}`);
  for (const c of new Set(categorySlugs)) if (c) revalidatePath(`/categoria/${c}`);
}

// shortcut: produto, variações e fotos são gravados em chamadas separadas, sem transação; na criação uma falha apaga o produto recém-criado, na edição deixa a gravação pela metade (salvar de novo corrige), trocar por uma função RPC se isso acontecer na prática.
export async function saveProduct(id: string | null, input: unknown): Promise<Result> {
  await requireUser();
  if (id !== null && !isId(id)) return { ok: false, errors: { form: 'Produto não encontrado.' } };
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const p = parsed.data;
  const supabase = await createClient();
  let productId: string | undefined;
  const fail = async (step: string, error: unknown): Promise<Result> => {
    console.error(`saveProduct: ${step}`, error);
    // Criação que falhou no meio: desfaz o produto (variações e fotos saem em cascata).
    if (!id && productId) await supabase.from('products').delete().eq('id', productId);
    return SAVE_FAILED;
  };

  const { data: category, error: catError } = await supabase.from('categories').select('slug').eq('id', p.categoryId).maybeSingle();
  if (catError) return fail('categoria', catError);
  if (!category) return { ok: false, errors: { categoryId: 'Escolha uma categoria.' } };

  const row = {
    category_id: p.categoryId, name: p.name, description: p.description, badge: p.badge,
    featured: p.featured, available: p.available, pix_percent: p.pixPercent, installments: p.installments,
    option_names: p.optionNames,
  };

  let slug: string;
  let oldCategory: string | undefined;
  if (id) {
    // O slug não muda ao editar: links já compartilhados continuam valendo.
    const { data: current, error } = await supabase.from('products').select('slug, categories(slug)').eq('id', id).maybeSingle<SlugRow>();
    if (error) return fail('ler produto', error);
    if (!current) return { ok: false, errors: { form: 'Produto não encontrado.' } };
    const { error: upError } = await supabase.from('products').update(row).eq('id', id);
    if (upError) return fail('atualizar produto', upError);
    productId = id;
    slug = current.slug;
    oldCategory = current.categories?.slug;
  } else {
    const base = slugify(p.name) || 'produto';
    // base só tem [a-z0-9-]: seguro dentro do like.
    const { data: taken, error } = await supabase.from('products').select('slug').like('slug', `${base}%`);
    if (error) return fail('slugs', error);
    slug = uniqueSlug(base, (taken ?? []).map((t: { slug: string }) => t.slug));
    // shortcut: dois cadastros simultâneos com o mesmo nome podem colidir no unique do slug e cair em "Tente de novo", tratar o 23505 com nova tentativa se acontecer.
    const { data: created, error: insError } = await supabase.from('products').insert({ ...row, slug }).select('id').single();
    if (insError || !created) return fail('criar produto', insError);
    productId = created.id;
  }

  // Variações: atualiza pelo id, insere as novas e apaga só as removidas (carrinhos guardam o variantId).
  const { data: existing, error: varError } = await supabase.from('variants').select('id').eq('product_id', productId);
  if (varError) return fail('ler variações', varError);
  const existingIds = new Set((existing ?? []).map((v: { id: string }) => v.id));
  const kept = new Set(p.variants.map((v) => v.id).filter((v): v is string => !!v && existingIds.has(v)));
  const removed = [...existingIds].filter((v) => !kept.has(v));
  if (removed.length) {
    const { error } = await supabase.from('variants').delete().eq('product_id', productId).in('id', removed);
    if (error) return fail('apagar variações', error);
  }
  for (const [position, v] of p.variants.entries()) {
    const values = {
      option_values: v.optionValues, retail_cents: v.retailCents, wholesale_cents: v.wholesaleCents,
      available: v.available, position,
    };
    // id de outro produto (cliente adulterado) não está em kept: vira variação nova deste produto.
    const { error } = v.id && kept.has(v.id)
      ? await supabase.from('variants').update(values).eq('id', v.id).eq('product_id', productId)
      : await supabase.from('variants').insert({ ...values, product_id: productId });
    if (error) return fail('gravar variação', error);
  }

  // Fotos não têm referência externa: grava a lista nova e só então apaga a antiga (falha no meio não deixa o produto sem foto).
  const { data: oldImages, error: readImgError } = await supabase.from('product_images').select('id').eq('product_id', productId);
  if (readImgError) return fail('ler fotos', readImgError);
  if (p.images.length) {
    const { error } = await supabase.from('product_images')
      .insert(p.images.map((url, position) => ({ product_id: productId, url, position })));
    if (error) return fail('gravar fotos', error);
  }
  const oldImageIds = (oldImages ?? []).map((i: { id: string }) => i.id);
  if (oldImageIds.length) {
    const { error } = await supabase.from('product_images').delete().eq('product_id', productId).in('id', oldImageIds);
    if (error) return fail('apagar fotos antigas', error);
  }

  revalidateStore(slug, [category.slug, oldCategory]);
  return { ok: true, id: productId! }; // os dois ramos acima atribuem; o closure fail impede o TS de estreitar
}

export async function deleteProduct(id: string): Promise<void> {
  await requireUser();
  checkId(id);
  const supabase = await createClient();
  const { data, error } = await supabase.from('products').select('slug, categories(slug)').eq('id', id).maybeSingle<SlugRow>();
  if (error || !data) throw new Error('Produto não encontrado.');
  // Variações e fotos saem em cascata.
  // shortcut: os arquivos das fotos ficam no bucket media, limpar órfãos se o espaço do plano gratuito apertar.
  const { error: delError } = await supabase.from('products').delete().eq('id', id);
  if (delError) throw new Error('Não foi possível excluir.');
  revalidateStore(data.slug, [data.categories?.slug]);
}

async function updateFlag(id: string, patch: { featured: boolean } | { available: boolean }) {
  checkId(id);
  if (typeof Object.values(patch)[0] !== 'boolean') throw new Error('Valor inválido.');
  const supabase = await createClient();
  const { data, error } = await supabase.from('products').update(patch).eq('id', id)
    .select('slug, categories(slug)').maybeSingle<SlugRow>();
  if (error || !data) throw new Error('Não foi possível salvar.');
  revalidateStore(data.slug, [data.categories?.slug]);
}

export async function setFeatured(id: string, value: boolean): Promise<void> {
  await requireUser();
  await updateFlag(id, { featured: value });
}

export async function setAvailable(id: string, value: boolean): Promise<void> {
  await requireUser();
  await updateFlag(id, { available: value });
}
