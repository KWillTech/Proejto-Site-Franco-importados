// Importação única do catálogo gerado em scripts/importar/saida/produtos.json para o Supabase.
// Uso: node --env-file=.env.local scripts/importar/importar.mjs [--dry-run] [arquivo.json]
// Só cria: produto com nome já cadastrado é pulado, nada existente é alterado; rodar de novo é seguro.
import { registerHooks } from 'node:module';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

// src/lib importa sem extensão (padrão do bundler do Next); o Node exige, então tenta de novo com .ts.
// shortcut: hook de resolução só para este script, trocar por um runner de TS se surgirem outros scripts.
registerHooks({
  resolve(spec, ctx, next) {
    let r;
    try {
      r = next(spec, ctx);
    } catch (e) {
      if (e.code !== 'ERR_MODULE_NOT_FOUND' || !spec.startsWith('.')) throw e;
      r = next(`${spec}.ts`, ctx);
    }
    return r.url.endsWith('.ts') ? { ...r, format: 'module-typescript' } : r;
  },
});
const { plan, productRow, variantRows, costRows } = await import('./linhas.mjs');
const { slugify, uniqueSlug, validateImageFile } = await import('../../src/lib/validation.ts');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const file = args.find((a) => !a.startsWith('--')) ?? new URL('./saida/produtos.json', import.meta.url);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
// O dry-run só lê dados públicos com a chave anon: não consegue gravar nada.
const key = dryRun ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(`Faltam NEXT_PUBLIC_SUPABASE_URL e ${dryRun ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : 'SUPABASE_SERVICE_ROLE_KEY'} no .env.local.`);
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

// Subcategorias de Apple (slug "iphone"); slug montado como saveCategory faz: slugify(`${mãe} ${nome}`).
const NEW_CATEGORIES = [{ name: 'iPad', slug: 'iphone-ipad' }, { name: 'AirPods', slug: 'iphone-airpods' }];
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_IMAGES = 10; // mesmo limite do formulário do painel

const must = ({ data, error }, step) => {
  if (error) throw new Error(`${step}: ${error.message}`);
  return data;
};

const items = JSON.parse(await readFile(file, 'utf8'));
if (!Array.isArray(items)) throw new Error('O arquivo de entrada deve ser uma lista de produtos.');
for (const i of items) if (Array.isArray(i?.images)) i.images = i.images.slice(0, MAX_IMAGES);

const cats = must(await supabase.from('categories').select('id, slug, parent_id, position'), 'ler categorias');
const bySlug = new Map(cats.map((c) => [c.slug, c.id]));
const apple = cats.find((c) => c.slug === 'iphone' && !c.parent_id);
if (!apple) console.warn('Aviso: categoria Apple (slug "iphone") não encontrada; iPad e AirPods não serão criadas.');
const newCats = apple ? NEW_CATEGORIES.filter((c) => !bySlug.has(c.slug)) : [];
const names = must(await supabase.from('products').select('name'), 'ler produtos').map((p) => p.name);
const { create, skipped } = plan(items, names, new Set([...bySlug.keys(), ...newCats.map((c) => c.slug)]));

const list = (title, lines) => console.log(`\n${title} (${lines.length})${lines.map((l) => `\n  - ${l}`).join('')}`);
const skippedLines = skipped.map((s) => `${s.name}: ${s.reason}`);

if (dryRun) {
  console.log('DRY-RUN: nada foi gravado.');
  list('Categorias a criar', newCats.map((c) => `${c.name} (${c.slug}), dentro de Apple`));
  list('Produtos a criar', create.map((i) => `${i.name} [${i.category_slug}]: ${i.variants.length} variações, ${i.images.length} fotos`));
  list('Produtos a pular', skippedLines);
  process.exit(0);
}

let position = Math.max(-1, ...cats.map((c) => c.position));
for (const c of newCats) {
  const row = { name: c.name, slug: c.slug, parent_id: apple.id, position: ++position };
  bySlug.set(c.slug, must(await supabase.from('categories').insert(row).select('id').single(), `criar categoria ${c.name}`).id);
}

async function upload(src) {
  const res = await fetch(src, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get('content-type')?.split(';')[0].trim() ?? '';
  const body = await res.arrayBuffer();
  const bad = validateImageFile({ type, size: body.byteLength });
  if (bad) throw new Error(bad);
  const storage = supabase.storage.from('media');
  const path = `produtos/${randomUUID()}.${EXT[type]}`; // mesmo caminho do ImageUploader
  must(await storage.upload(path, body, { contentType: type }), 'enviar');
  return storage.getPublicUrl(path).data.publicUrl;
}

const created = [];
const failed = [];
const photoFails = [];
const warnings = [];
// shortcut: gravações separadas, sem transação; uma falha apaga o produto (cascata leva variações, custos e fotos),
// mas os arquivos já enviados ao bucket media ficam órfãos; limpar se o espaço do plano gratuito apertar.
for (const item of create) {
  let productId;
  try {
    const base = slugify(item.name) || 'produto';
    // base só tem [a-z0-9-]: seguro dentro do like.
    const taken = must(await supabase.from('products').select('slug').like('slug', `${base}%`), 'ler slugs');
    const { row, warning } = productRow(item, bySlug.get(item.category_slug), uniqueSlug(base, taken.map((t) => t.slug)));
    if (warning) warnings.push(`${item.name}: ${warning}`);
    productId = must(await supabase.from('products').insert(row).select('id').single(), 'criar produto').id;
    const variants = must(await supabase.from('variants').insert(variantRows(item, productId)).select('id, position'), 'criar variações');
    must(await supabase.from('variant_costs').insert(costRows(item, variants)), 'gravar custos');
    const urls = [];
    for (const src of item.images) {
      try {
        urls.push(await upload(src));
      } catch (e) {
        photoFails.push(`${item.name}: ${src} (${e.message})`);
      }
    }
    if (urls.length) {
      must(await supabase.from('product_images').insert(urls.map((u, i) => ({ product_id: productId, url: u, position: i }))), 'gravar fotos');
    }
    created.push(`${item.name}: ${variants.length} variações, ${urls.length} fotos`);
  } catch (e) {
    let undo = '';
    if (productId) {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      // Se nem desfazer der certo, o produto pela metade seria pulado como duplicado na próxima rodada.
      undo = error ? ' — NÃO consegui desfazer: exclua o produto no painel antes de rodar de novo' : ' (desfeito)';
    }
    failed.push(`${item.name}: ${e.message}${undo}`);
  }
}

list('Categorias criadas', newCats.map((c) => `${c.name} (${c.slug})`));
list('Produtos criados', created);
list('Produtos pulados', skippedLines);
list('Produtos que falharam', failed);
list('Fotos que falharam', photoFails);
list('Avisos', warnings);
console.log('\nOs produtos entram indisponíveis e sem preço. No painel: preencha a margem na aba Cálculo e marque'
  + ' cada produto como disponível para ele aparecer na loja.');
if (failed.length) process.exitCode = 1;
