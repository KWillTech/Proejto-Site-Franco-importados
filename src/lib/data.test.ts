import { describe, it, expect } from 'vitest';
import { mapProduct, forStorefront, fromPrices, isSoldOut, filterBySub, pickHomeCards, type ProductRow } from './data';
import type { Category, Product, Variant } from './types';

const row = (over: Partial<ProductRow> = {}): ProductRow => ({
  id: 'p1', slug: 'iphone-17-pro', name: 'iPhone 17 Pro', description: 'desc',
  featured: true, available: true, badge: null, pix_percent: 10, installments: 12,
  option_names: ['Cor'],
  categories: { slug: 'iphone' },
  product_images: [
    { url: '/b.svg', position: 2 },
    { url: '/a.svg', position: 1 },
  ],
  variants: [
    { id: 'v2', option_values: ['Preto'], retail_cents: 1100, wholesale_cents: 900, available: true, priced: true, position: 2 },
    { id: 'v1', option_values: ['Azul'], retail_cents: 1000, wholesale_cents: 800, available: true, priced: true, position: 1 },
  ],
  ...over,
});

const v = (over: Partial<Variant> = {}): Variant => ({
  id: 'v', optionValues: [], retailCents: 1000, wholesaleCents: 800, available: true, ...over,
});
const prod = (variants: Variant[], over: Partial<Product> = {}): Product => ({
  ...mapProduct(row()), variants, ...over,
});

describe('mapProduct', () => {
  it('ordena imagens e variantes por position e converte os campos', () => {
    const p = mapProduct(row());
    expect(p.images).toEqual(['/a.svg', '/b.svg']);
    expect(p.variants.map((x) => x.id)).toEqual(['v1', 'v2']);
    expect(p.variants[0]).toEqual({
      id: 'v1', optionValues: ['Azul'], retailCents: 1000, wholesaleCents: 800, available: true,
    });
    expect(p.categorySlug).toBe('iphone');
    expect(p.pixPercent).toBe(10);
    expect(p.optionNames).toEqual(['Cor']);
  });
});

describe('mapProduct (painel)', () => {
  it('mantém variação sem preço, porque o painel precisa editá-la', () => {
    const base = row();
    const p = mapProduct(row({ variants: [{ ...base.variants[0], priced: false }] }));
    expect(p.variants.map((x) => x.id)).toEqual(['v2']);
  });
});

describe('forStorefront', () => {
  it('fica só com as variações com preço', () => {
    const [a, b] = row().variants;
    const p = forStorefront(row({ variants: [a, { ...b, priced: false }] }));
    expect(p?.variants.map((x) => x.id)).toEqual(['v2']);
  });
  it('devolve null quando nenhuma variação tem preço', () => {
    const variants = row().variants.map((x) => ({ ...x, priced: false }));
    expect(forStorefront(row({ variants }))).toBeNull();
  });
});

describe('fromPrices', () => {
  it('devolve o menor preço entre as variantes disponíveis, com hasRange', () => {
    const p = prod([
      v({ retailCents: 2000, wholesaleCents: 1500 }),
      v({ retailCents: 1000, wholesaleCents: 900 }),
      v({ retailCents: 500, wholesaleCents: 400, available: false }),
    ]);
    expect(fromPrices(p)).toEqual({ retailCents: 1000, wholesaleCents: 900, hasRange: true });
  });
  it('hasRange é false quando os preços são iguais', () => {
    expect(fromPrices(prod([v(), v()]))?.hasRange).toBe(false);
  });
  it('devolve null quando todas estão esgotadas', () => {
    expect(fromPrices(prod([v({ available: false })]))).toBeNull();
  });
});

describe('isSoldOut', () => {
  it('é true para produto indisponível', () => {
    expect(isSoldOut(prod([v()], { available: false }))).toBe(true);
  });
  it('é true quando nenhuma variante está disponível', () => {
    expect(isSoldOut(prod([v({ available: false })]))).toBe(true);
  });
  it('é false com produto e variante disponíveis', () => {
    expect(isSoldOut(prod([v()]))).toBe(false);
  });
});

describe('filterBySub', () => {
  const cat = (slug: string): Category => ({
    id: slug, name: slug, slug, parentId: 'apple', homeCard: false, homeCardImage: null, homeCardTag: null,
  });
  const subs = [cat('iphone'), cat('macbook')];
  const products = [
    prod([v()], { id: 'a', categorySlug: 'iphone' }),
    prod([v()], { id: 'b', categorySlug: 'macbook' }),
    prod([v()], { id: 'c', categorySlug: 'apple' }),
  ];

  it('filtra pelos produtos da subcategoria escolhida', () => {
    const r = filterBySub(products, subs, 'iphone');
    expect(r.active).toBe('iphone');
    expect(r.products.map((p) => p.id)).toEqual(['a']);
  });
  it('mostra todos quando sub é ausente, inválido ou de outra principal', () => {
    for (const sub of [undefined, 'xyz', 'perfumes', '']) {
      const r = filterBySub(products, subs, sub);
      expect(r.active).toBeNull();
      expect(r.products).toHaveLength(3);
    }
  });
});

describe('pickHomeCards', () => {
  const c = (id: string, over: Partial<Category> = {}): Category => ({
    id, name: id, slug: id, parentId: null, homeCard: true, homeCardImage: null, homeCardTag: null, ...over,
  });
  it('descarta cartão de subcategoria cuja mãe não está visível e limita a 3', () => {
    const visible = [c('a'), c('filha-ok', { parentId: 'a' }), c('filha-orfa', { parentId: 'oculta' }), c('b'), c('d'), c('x', { homeCard: false })];
    expect(pickHomeCards(visible).map((x) => x.id)).toEqual(['a', 'filha-ok', 'b']);
  });
});
