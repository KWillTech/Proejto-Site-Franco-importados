import { describe, expect, it } from 'vitest';
import { agrupar, categoria, marcaPerfume, parseTitulo } from './coletar.mjs';

const anuncio = (title: string, cents = 100000) => ({
  title,
  url: `https://x/${title}`,
  cents,
  images: [`${title}.jpg`],
  description_es: 'd',
});

describe('parseTitulo', () => {
  it('separa armazenamento e cor, e traduz a cor', () => {
    expect(parseTitulo('CELULAR XIAOMI 17 12GB RAM 512GB SLIM BLACK')).toEqual({
      model: 'Xiaomi 17 12GB RAM Slim',
      color: 'Preto',
      storage: '512GB',
    });
  });
  it('tira o código de peça da Apple e arruma marcas', () => {
    const r = parseTitulo('CELULAR APPLE IPHONE 18 PRO A3472 MJQ44LL/A 256GB SILVER');
    expect(r.model).toBe('iPhone 18 Pro');
    expect(r.storage).toBe('256GB');
  });
});

describe('categoria', () => {
  it('filtra marcas e acessórios', () => {
    expect(categoria('CELULAR APPLE IPHONE 17 256GB BLACK')).toBe('iphone-celulares');
    expect(categoria('CELULAR REDMI NOTE 15 8GB 256GB BLUE')).toBe('xiaomi-celulares');
    expect(categoria('CELULAR GOOGLE PIXEL 10A 128GB BERRY')).toBeNull();
    expect(categoria('CAPA CON TECLADO APPLE MAGIC KEYBOARD PARA IPAD AIR')).toBeNull();
    expect(categoria('SMARTWATCH APPLE WATCH ULTRA 3 49MM BLACK')).toBe('iphone-apple-watch');
  });
});

describe('agrupar', () => {
  it('junta cor e armazenamento num produto só', () => {
    const [p, ...resto] = agrupar([
      anuncio('CELULAR APPLE IPHONE 17 256GB BLACK', 100000),
      anuncio('CELULAR APPLE IPHONE 17 512GB BLACK', 120000),
      anuncio('CELULAR APPLE IPHONE 17 256GB WHITE', 100000),
    ]);
    expect(resto).toEqual([]);
    expect(p.name).toBe('iPhone 17');
    expect(p.option_names).toEqual(['Cor', 'Armazenamento']);
    expect(p.variants.map((v: { option_values: string[] }) => v.option_values)).toEqual([
      ['Preto', '256GB'],
      ['Preto', '512GB'],
      ['Branco', '256GB'],
    ]);
    expect(p.variants[1].cost_usd_cents).toBe(120000);
  });
  it('só lista a opção que varia; anúncio solto fica sem opções', () => {
    const r = agrupar([
      anuncio('CELULAR APPLE IPHONE 17 256GB BLACK'),
      anuncio('CELULAR APPLE IPHONE 17 256GB WHITE'),
      anuncio('CELULAR SAMSUNG A17 128GB'),
    ]);
    expect(r[0].option_names).toEqual(['Cor']);
    expect(r[1].option_names).toEqual([]);
  });
});

describe('recondicionados', () => {
  it('descarta CPO, UPO e ASIS só como palavra isolada', () => {
    expect(categoria('CELULAR APPLE IPHONE 16 128GB PINK CPO')).toBeNull();
    expect(categoria('CELULAR SAMSUNG A17 8GB RAM 256GB BLACK UPO')).toBeNull();
    expect(categoria('CELULAR APPLE IPHONE 17 PRO MAX 512GB ORANGE ASIS')).toBeNull();
    expect(categoria('CELULAR APPLE IPHONE 17 256GB BLACK')).toBe('iphone-celulares');
  });
});

describe('perfumes', () => {
  it('filtra marca e exclui tester, kit, set e desodorante', () => {
    expect(marcaPerfume('PERFUME LATTAFA ASAD EDP 100ML')).toBeTruthy();
    expect(marcaPerfume('PERFUME LANCÔME LA VIE EST BELLE EDP 50ML')).toBeTruthy();
    expect(marcaPerfume('PERFUME ARSENAL TITANIUM EDP 100ML')).toBeNull();
    expect(marcaPerfume('PERFUME LATTAFA ASAD EDP 100ML TESTER')).toBeNull();
    expect(marcaPerfume('PERFUME DIOR SAUVAGE KIT')).toBeNull();
    expect(marcaPerfume('DESODORANTE AZZARO CHROME 150ML')).toBeNull();
  });
  const perfume = (title: string, cat = 'perfumes-arabes-masculino') => ({
    ...anuncio(title), cat,
  });
  it('mesmo perfume em tamanhos diferentes vira um produto com Tamanho', () => {
    const r = agrupar([
      perfume('PERFUME LATTAFA ASAD EDP 100ML'),
      perfume('PERFUME LATTAFA ASAD EDP 50ML'),
      perfume('PERFUME LATTAFA ASAD EDT 100ML'),
    ]);
    expect(r).toHaveLength(2);
    expect(r[0].name).toBe('Lattafa Asad Eau de Parfum');
    expect(r[0].option_names).toEqual(['Tamanho']);
    expect(r[0].variants.map((v: { option_values: string[] }) => v.option_values)).toEqual([['100ml'], ['50ml']]);
    expect(r[0].category_slug).toBe('perfumes-arabes-masculino');
  });
  it('lê tamanho colado ou escrito 100M, e ignora perfume sólido', () => {
    const [p, q] = agrupar([perfume('PERFUME LATTAFA QUIMMAH WOMEN EDP100ML'), perfume('PERFUME GIVENCHY GENTLEMAN 100M EDP')]);
    expect(p.name).toBe('Lattafa Quimmah Women Eau de Parfum 100ml');
    expect(q.name).toBe('Givenchy Gentleman Eau de Parfum 100ml');
    expect(marcaPerfume('SÓLIDO MISS DIOR PARFUM 3,2G')).toBeNull();
  });
  it('tamanho único vai no nome e não há opção', () => {
    const [p] = agrupar([perfume('PERFUME AFNAN 9PM EDP 100ML', 'perfumes-arabes-unissex')]);
    expect(p.name).toBe('Afnan 9PM Eau de Parfum 100ml');
    expect(p.option_names).toEqual([]);
    expect(p.variants[0].option_values).toEqual([]);
  });
});
