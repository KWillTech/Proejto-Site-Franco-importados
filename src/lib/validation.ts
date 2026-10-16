import { z } from 'zod';
import { UUID } from './cart';
import { normalizePhone } from './whatsapp';

export type ProductInput = {
  name: string; categoryId: string; description: string; badge: string | null;
  featured: boolean; available: boolean;
  pixPercent: number | null; installments: number | null;
  optionNames: string[];                       // 0 a 3 nomes
  variants: Array<{ id?: string; optionValues: string[]; retailCents: number; wholesaleCents: number; available: boolean }>;
  images: string[];
};

export const isId = (id: unknown): id is string => typeof id === 'string' && UUID.test(id);
/** Falha genérica de gravação, no formato de erro que os formulários do painel mostram. */
export const SAVE_FAILED = { ok: false, errors: { form: 'Não foi possível salvar. Tente de novo.' } } as const;

const PIX_MSG = 'O desconto no Pix deve ser maior que 0% e no máximo 100%.';
const INSTALLMENTS_MSG = 'As parcelas devem ser um número inteiro de 1 a 24.';
const PRICE_MSG = 'Informe um preço válido.';

// Campo opcional do formulário: vazio vira null.
const emptyToNull = (v: unknown) => (v === '' || v === undefined ? null : v);

// Teto de R$ 999.999,99: a coluna é int e o valor digitado não pode estourar.
const cents = z.number({ error: PRICE_MSG }).int(PRICE_MSG).positive('Informe um preço maior que zero.').max(99_999_999, PRICE_MSG);
const text = z.string().trim();

const imageUrl = z.string().regex(/^(https?:\/\/|\/(?![\/\\]))\S+$/, 'Imagem inválida.');

const variantSchema = z.object({
  id: z.string().regex(UUID).optional(),
  optionValues: z.array(text.min(1, 'Preencha todas as opções desta variação.')),
  retailCents: cents,
  wholesaleCents: cents,
  available: z.boolean(),
}).refine((v) => v.wholesaleCents <= v.retailCents, {
  path: ['wholesaleCents'], message: 'O preço de atacado não pode ser maior que o de varejo.',
});

export const productSchema: z.ZodType<ProductInput> = z.object({
  name: text.min(1, 'Informe o nome do produto.'),
  categoryId: z.string({ error: 'Escolha uma categoria.' }).regex(UUID, 'Escolha uma categoria.'),
  description: text,
  badge: text.nullable().transform((v) => v || null),
  featured: z.boolean(),
  available: z.boolean(),
  pixPercent: z.preprocess(emptyToNull, z.number({ error: PIX_MSG }).gt(0, PIX_MSG).max(100, PIX_MSG).nullable()),
  installments: z.preprocess(emptyToNull, z.number({ error: INSTALLMENTS_MSG }).int(INSTALLMENTS_MSG)
    .min(1, INSTALLMENTS_MSG).max(24, INSTALLMENTS_MSG).nullable()),
  optionNames: z.array(text.min(1, 'Dê um nome a cada opção.')).max(3, 'Use no máximo 3 opções.'),
  variants: z.array(variantSchema).min(1, 'Cadastre ao menos uma variação.'),
  images: z.array(imageUrl).max(10, 'Envie no máximo 10 fotos.'),
}).superRefine((p, ctx) => {
  if (new Set(p.optionNames.map((n) => n.toLowerCase())).size !== p.optionNames.length) {
    ctx.addIssue({ code: 'custom', path: ['optionNames'], message: 'Os nomes das opções devem ser diferentes.' });
  }
  if (p.optionNames.length === 0 && p.variants.length > 1) {
    ctx.addIssue({ code: 'custom', path: ['variants'], message: 'Produto sem opções tem uma única variação.' });
    return;
  }
  const seen = new Set<string>();
  p.variants.forEach((v, i) => {
    if (v.optionValues.length !== p.optionNames.length) {
      ctx.addIssue({ code: 'custom', path: ['variants', i, 'optionValues'], message: 'Preencha todas as opções desta variação.' });
    }
    const key = v.optionValues.map((s) => s.toLowerCase()).join('\u0000');
    if (seen.has(key)) ctx.addIssue({ code: 'custom', path: ['variants'], message: 'Há variações repetidas.' });
    seen.add(key);
  });
});

/** "8.990,00" -> 899000; "219,9" -> 21990; inválido -> null. */
export function parseMoney(input: string): number | null {
  const s = input.trim();
  if (!/^(\d{1,3}(\.\d{3})+|\d+)(,\d{1,2})?$/.test(s)) return null;
  const [int, frac = ''] = s.replace(/\./g, '').split(',');
  return Number(int) * 100 + Number(frac.padEnd(2, '0'));
}

export function slugify(name: string): string {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Primeiro slug livre: base, base-2, base-3… */
export function uniqueSlug(base: string, taken: string[]): string {
  const used = new Set(taken);
  let slug = base;
  for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
  return slug;
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validateImageFile(f: { type: string; size: number }): string | null {
  if (!IMAGE_TYPES.includes(f.type)) return 'Envie uma imagem JPG, PNG ou WebP.';
  if (f.size > 5 * 1024 * 1024) return 'A imagem deve ter até 5MB.';
  return null;
}

export const settingsSchema = z.object({
  whatsappNumber: text.transform((v, ctx) => {
    const n = normalizePhone(v);
    if (!n) ctx.addIssue({ code: 'custom', message: 'Informe um número de WhatsApp com DDD.' });
    return n ?? v;
  }),
  topbarText: text.max(80, 'O texto do topo deve ter até 80 caracteres.'),
});

export const categorySchema = z.object({
  name: text.min(1, 'Informe o nome da categoria.'),
  visible: z.boolean(),
  homeCard: z.boolean(),
  homeCardImage: z.preprocess(emptyToNull, imageUrl.nullable()),
  homeCardTag: z.string().trim().nullable().transform((v) => v || null),
});

const imageRequired = (msg: string) => z.string({ error: msg }).min(1, msg).pipe(imageUrl);
const LINK_MSG = 'Use um caminho como /categoria/perfumes ou um endereço http(s).';

export const bannerSchema = z.object({
  imageDesktop: imageRequired('Envie a imagem para tela larga.'),
  imageMobile: imageRequired('Envie a imagem para celular.'),
  alt: text,
  link: text.regex(/^(\/(?![\/\\])\S*|https?:\/\/\S+)?$/, LINK_MSG).transform((v) => v || null),
  active: z.boolean(),
});

/** Erros do Zod como "caminho do campo" -> primeira mensagem, o formato que os formulários do painel mostram. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const i of error.issues) errors[i.path.join('.')] ??= i.message;
  return errors;
}
