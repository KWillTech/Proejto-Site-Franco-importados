import { describe, expect, it } from 'vitest';
import { parseMoney, productSchema, slugify, uniqueSlug, validateImageFile } from './validation';

const CAT = '0b6c4a2e-1f3d-4c5b-9a8e-7d6f5e4c3b2a';
const base = {
  name: 'iPhone 17 Pro', categoryId: CAT, description: '', badge: null,
  featured: false, available: true, pixPercent: 10, installments: 12,
  optionNames: ['Cor', 'Armazenamento'],
  variants: [
    { optionValues: ['Azul', '256GB'], retailCents: 967072, wholesaleCents: 899000, available: true },
    { optionValues: ['Preto', '256GB'], retailCents: 967072, wholesaleCents: 899000, available: true },
  ],
  images: ['https://x.supabase.co/storage/v1/object/public/media/produtos/a.jpg'],
};

// Mesmo mapeamento que a action devolve ao formulário: caminho do campo -> mensagem.
function errorsOf(input: unknown): Record<string, string> {
  const r = productSchema.safeParse(input);
  if (r.success) return {};
  return Object.fromEntries(r.error.issues.map((i) => [i.path.join('.'), i.message]));
}

describe('parseMoney', () => {
  it('converte reais digitados em centavos', () => {
    expect(parseMoney('8.990,00')).toBe(899000);
    expect(parseMoney('219,9')).toBe(21990);
    expect(parseMoney('1500')).toBe(150000);
  });
  it('recusa vazio, texto e negativo', () => {
    expect(parseMoney('')).toBeNull();
    expect(parseMoney('abc')).toBeNull();
    expect(parseMoney('-5')).toBeNull();
  });
});

describe('slugify', () => {
  it('gera slug sem acentos nem símbolos', () => {
    expect(slugify('MacBook Air M4 13"')).toBe('macbook-air-m4-13');
    expect(slugify('Perfume Árabe Ção')).toBe('perfume-arabe-cao');
  });
});

describe('uniqueSlug', () => {
  it('acrescenta -2, -3… quando o slug já existe', () => {
    expect(uniqueSlug('khamrah', [])).toBe('khamrah');
    expect(uniqueSlug('khamrah', ['khamrah'])).toBe('khamrah-2');
    expect(uniqueSlug('khamrah', ['khamrah', 'khamrah-2', 'khamrah-3'])).toBe('khamrah-4');
  });
});

describe('productSchema', () => {
  it('aceita um produto coerente e trata Pix e parcelas vazios como null', () => {
    const r = productSchema.safeParse({ ...base, pixPercent: '', installments: '' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.pixPercent).toBeNull();
      expect(r.data.installments).toBeNull();
    }
  });

  it('recusa nome vazio', () => {
    expect(errorsOf({ ...base, name: '   ' }).name).toBe('Informe o nome do produto.');
  });

  it('recusa produto sem variação', () => {
    expect(errorsOf({ ...base, variants: [] }).variants).toBe('Cadastre ao menos uma variação.');
  });

  it('recusa atacado maior que varejo', () => {
    const variants = [{ ...base.variants[0], wholesaleCents: 967073 }];
    expect(errorsOf({ ...base, variants })['variants.0.wholesaleCents'])
      .toBe('O preço de atacado não pode ser maior que o de varejo.');
  });

  it('recusa preço zero', () => {
    const variants = [{ ...base.variants[0], retailCents: 0, wholesaleCents: 0 }];
    expect(errorsOf({ ...base, variants })['variants.0.retailCents']).toBe('Informe um preço maior que zero.');
  });

  it('recusa Pix 0, negativo ou acima de 100', () => {
    const msg = 'O desconto no Pix deve ser maior que 0% e no máximo 100%.';
    expect(errorsOf({ ...base, pixPercent: 0 }).pixPercent).toBe(msg);
    expect(errorsOf({ ...base, pixPercent: -5 }).pixPercent).toBe(msg);
    expect(errorsOf({ ...base, pixPercent: 101 }).pixPercent).toBe(msg);
    expect(errorsOf({ ...base, pixPercent: 100 }).pixPercent).toBeUndefined();
  });

  it('recusa parcelas fora de 1 a 24', () => {
    const msg = 'As parcelas devem ser um número inteiro de 1 a 24.';
    expect(errorsOf({ ...base, installments: 0 }).installments).toBe(msg);
    expect(errorsOf({ ...base, installments: 25 }).installments).toBe(msg);
    expect(errorsOf({ ...base, installments: 1.5 }).installments).toBe(msg);
  });

  it('recusa variação com quantidade de valores diferente das opções', () => {
    const variants = [{ ...base.variants[0], optionValues: ['Azul'] }];
    expect(errorsOf({ ...base, variants })['variants.0.optionValues']).toBe('Preencha todas as opções desta variação.');
  });

  it('recusa variações repetidas, sem diferenciar maiúsculas', () => {
    const variants = [base.variants[0], { ...base.variants[1], optionValues: ['azul ', '256gb'] }];
    expect(errorsOf({ ...base, variants }).variants).toBe('Há variações repetidas.');
  });

  it('recusa produto sem opções com mais de uma variação', () => {
    const variants = base.variants.map((v) => ({ ...v, optionValues: [] }));
    expect(errorsOf({ ...base, optionNames: [], variants }).variants).toBe('Produto sem opções tem uma única variação.');
  });

  it('recusa mais de 3 opções', () => {
    expect(errorsOf({ ...base, optionNames: ['a', 'b', 'c', 'd'] }).optionNames).toBe('Use no máximo 3 opções.');
  });

  it('recusa categoria inválida e imagem que não é link', () => {
    expect(errorsOf({ ...base, categoryId: 'x' }).categoryId).toBe('Escolha uma categoria.');
    expect(errorsOf({ ...base, images: ['javascript:alert(1)'] })['images.0']).toBe('Imagem inválida.');
  });
});

describe('validateImageFile', () => {
  const MB = 1024 * 1024;
  it('aceita JPG, PNG e WebP até 5MB', () => {
    expect(validateImageFile({ type: 'image/jpeg', size: 5 * MB })).toBeNull();
    expect(validateImageFile({ type: 'image/png', size: 100 })).toBeNull();
    expect(validateImageFile({ type: 'image/webp', size: 100 })).toBeNull();
  });
  it('recusa outro tipo e arquivo grande', () => {
    expect(validateImageFile({ type: 'application/pdf', size: 100 })).toBe('Envie uma imagem JPG, PNG ou WebP.');
    expect(validateImageFile({ type: 'image/jpeg', size: 6 * MB })).toBe('A imagem deve ter até 5MB.');
  });
});
