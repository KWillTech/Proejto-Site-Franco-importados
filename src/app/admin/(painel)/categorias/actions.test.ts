import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireUser = vi.fn();
const createClient = vi.fn();
vi.mock('@/lib/auth', () => ({ requireUser: () => requireUser() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: () => createClient() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { deleteCategory, reorderCategories, saveCategory } from './actions';

const ID = '0b6c4a2e-1f3d-4c5b-9a8e-7d6f5e4c3b2a';
const input = { name: 'Perfumes', visible: true, homeCard: true, homeCardImage: null, homeCardTag: null };

beforeEach(() => {
  requireUser.mockReset();
  createClient.mockReset();
});

describe('sem sessão, nada é gravado', () => {
  it.each([
    ['saveCategory', () => saveCategory(null, input)],
    ['deleteCategory', () => deleteCategory(ID)],
    ['reorderCategories', () => reorderCategories([ID])],
  ])('%s', async (_name, call) => {
    requireUser.mockRejectedValue(new Error('NEXT_REDIRECT /admin/login'));
    await expect(call()).rejects.toThrow('NEXT_REDIRECT /admin/login');
    expect(createClient).not.toHaveBeenCalled();
  });
});

describe('com sessão', () => {
  beforeEach(() => requireUser.mockResolvedValue({ id: 'u1' }));

  it('entrada inválida não chega ao banco', async () => {
    expect(await saveCategory(null, { ...input, name: '' })).toEqual({ ok: false, errors: { name: 'Informe o nome da categoria.' } });
    expect((await saveCategory('1 or 1=1', input)).ok).toBe(false);
    expect((await deleteCategory('x')).ok).toBe(false);
    expect((await reorderCategories([ID, ID])).ok).toBe(false);
    expect((await reorderCategories('x')).ok).toBe(false);
    expect(createClient).not.toHaveBeenCalled();
  });

  // Supabase falso: toda consulta devolve `byTable[tabela]` ou `rows`; registra as gravações e o que foi gravado.
  let sent: unknown[] = [];
  function fake(rows: unknown[], byTable: Record<string, unknown[]> = {}) {
    const writes: string[] = [];
    sent = [];
    createClient.mockResolvedValue({
      from: (table: string) => {
        const b: Record<string, unknown> = {};
        for (const f of ['select', 'eq', 'neq', 'or', 'order', 'limit']) b[f] = () => b;
        for (const f of ['insert', 'update', 'delete']) b[f] = (v?: unknown) => { writes.push(f); sent.push(v); return b; };
        b.then = (ok: (r: unknown) => void) => ok({ data: byTable[table] ?? rows, error: null });
        return b;
      },
    });
    return writes;
  }

  const PARENT = '1b6c4a2e-1f3d-4c5b-9a8e-7d6f5e4c3b2a';
  const child = { ...input, homeCard: false, parentId: PARENT };
  const PRINCIPAL = { ok: false, errors: { parentId: 'Escolha uma categoria principal.' } };

  it('recusa mãe que já é subcategoria, que não existe ou que é a própria categoria', async () => {
    const writes = fake([{ id: PARENT, parent_id: ID }]);
    expect(await saveCategory(null, child)).toEqual(PRINCIPAL);
    fake([]);
    expect(await saveCategory(null, child)).toEqual(PRINCIPAL);
    expect(await saveCategory(ID, { ...child, parentId: ID })).toEqual(PRINCIPAL);
    expect(writes).toEqual([]);
  });

  it('recusa dar mãe a categoria que tem subcategorias', async () => {
    const writes = fake([{ id: PARENT, parent_id: null }, { id: 'c1', parent_id: ID }]);
    expect(await saveCategory(ID, child)).toEqual({ ok: false, errors: { parentId: 'Esta categoria tem subcategorias.' } });
    expect(writes).toEqual([]);
  });

  it('grava parent_id ao criar e ao editar; sem o campo grava null', async () => {
    const writes = fake([{ id: PARENT, parent_id: null }]);
    expect(await saveCategory(null, child)).toEqual({ ok: true });
    expect(sent[0]).toMatchObject({ parent_id: PARENT });
    expect(await saveCategory(ID, child)).toEqual({ ok: true });
    expect(sent[1]).toMatchObject({ parent_id: PARENT });
    expect(await saveCategory(ID, { ...input, homeCard: false })).toEqual({ ok: true });
    expect(sent[2]).toMatchObject({ parent_id: null });
    expect(writes).toEqual(['insert', 'update', 'update']);
  });

  it('não exclui categoria com subcategorias, antes de olhar os produtos', async () => {
    const writes = fake([], { categories: [{ id: 'c1' }], products: [{ id: 'p1' }] });
    expect(await deleteCategory(ID)).toEqual({ ok: false, errors: { form: 'Mova ou exclua as subcategorias antes.' } });
    expect(writes).toEqual([]);
  });

  it('recusa o quarto cartão da home', async () => {
    const writes = fake([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    expect(await saveCategory(null, input)).toEqual({ ok: false, errors: { homeCard: 'Escolha no máximo 3 categorias para a home.' } });
    expect(writes).toEqual([]);
  });

  it('recusa ordem parcial ou com id desconhecido', async () => {
    const OTHER = '1b6c4a2e-1f3d-4c5b-9a8e-7d6f5e4c3b2a';
    const writes = fake([{ id: ID }, { id: OTHER }]);
    expect(await reorderCategories([ID])).toEqual({ ok: false, errors: { form: 'Ordem inválida.' } });
    expect((await reorderCategories([ID, '2b6c4a2e-1f3d-4c5b-9a8e-7d6f5e4c3b2a'])).ok).toBe(false);
    expect(writes).toEqual([]);
  });

  it('não exclui categoria com produtos', async () => {
    const writes = fake([], { products: [{ id: 'p1' }] });
    expect(await deleteCategory(ID)).toEqual({ ok: false, errors: { form: 'Mova ou exclua os produtos desta categoria antes.' } });
    expect(writes).toEqual([]);
  });
});
