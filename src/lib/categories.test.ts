import { describe, expect, it } from 'vitest';
import { buildTree, categoryFilterIds, moveAmongSiblings } from './categories';

const row = (id: string, parentId: string | null = null) => ({ id, parentId });

describe('buildTree', () => {
  it('agrupa filhas sob a mãe mantendo a ordem de entrada', () => {
    const tree = buildTree([row('A'), row('a1', 'A'), row('B'), row('a2', 'A')]);
    expect(tree.map((t) => t.id)).toEqual(['A', 'B']);
    expect(tree[0].children.map((c) => c.id)).toEqual(['a1', 'a2']);
  });
  it('descarta filha órfã e dá children vazio à raiz sem filhas', () => {
    const tree = buildTree([row('A'), row('x', 'sumiu')]);
    expect(tree).toEqual([{ id: 'A', parentId: null, children: [] }]);
  });
});

describe('moveAmongSiblings', () => {
  const rows = [row('A'), row('a1', 'A'), row('B'), row('a2', 'A')];
  it('pula categorias de outro grupo', () => {
    expect(moveAmongSiblings(rows, 'a1', 1)).toEqual(['A', 'a2', 'B', 'a1']);
  });
  it('troca principais entre si ignorando as filhas', () => {
    expect(moveAmongSiblings(rows, 'A', 1)).toEqual(['B', 'a1', 'A', 'a2']);
  });
  it('devolve null na ponta', () => {
    expect(moveAmongSiblings(rows, 'A', -1)).toBeNull();
    expect(moveAmongSiblings(rows, 'a2', 1)).toBeNull();
  });
});

describe('categoryFilterIds', () => {
  const cats = [
    { id: 'A', slug: 'a', parentId: null },
    { id: 'a1', slug: 'a-1', parentId: 'A' },
    { id: 'B', slug: 'b', parentId: null },
  ];
  it('principal inclui as filhas', () => {
    expect(categoryFilterIds(cats, 'a')).toEqual(['A', 'a1']);
  });
  it('filha só ela mesma', () => {
    expect(categoryFilterIds(cats, 'a-1')).toEqual(['a1']);
  });
  it('slug inválido ou ausente não filtra', () => {
    expect(categoryFilterIds(cats, 'x')).toBeNull();
    expect(categoryFilterIds(cats, '')).toBeNull();
    expect(categoryFilterIds(cats, ['a', 'b'])).toBeNull();
    expect(categoryFilterIds(cats, undefined)).toBeNull();
  });
});
