import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { reorderCategories, saveCategory } from '@/app/admin/(painel)/categorias/actions';
import { CategoriesManager, type CategoryItem } from './CategoriesManager';

vi.mock('@/app/admin/(painel)/categorias/actions', () => ({
  saveCategory: vi.fn(async () => ({ ok: true })),
  deleteCategory: vi.fn(async () => ({ ok: true })),
  reorderCategories: vi.fn(async () => ({ ok: true })),
}));
vi.mock('./ImageUploader', () => ({ ImageUploader: () => null }));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const C = '33333333-3333-4333-8333-333333333333';
const D = '44444444-4444-4444-8444-444444444444';
const cat = (id: string, name: string, parentId: string | null, extra: Partial<CategoryItem> = {}): CategoryItem =>
  ({ id, name, parentId, visible: true, homeCard: false, homeCardImage: null, homeCardTag: null, ...extra });
const list = [
  cat(A, 'Apple', null, { homeCard: true }),
  cat(B, 'Celulares', A),
  cat(C, 'Macbook', A),
  cat(D, 'Notebook', null),
];

describe('CategoriesManager', () => {
  it('agrupa subcategorias dentro da categoria e conta os cartões da home', () => {
    render(<CategoriesManager categories={list} />);
    const apple = screen.getByRole('region', { name: 'Apple' });
    expect(apple.textContent).toContain('Celulares');
    expect(apple.textContent).toContain('2 subcategorias');
    expect(screen.getByRole('region', { name: 'Notebook' }).textContent).toContain('sem subcategorias');
    expect(screen.getByText(/Cartões na home/).textContent).toContain('1 de 3');
  });

  it('"+ Subcategoria" abre a janela já dentro da categoria e salva com a mãe certa', async () => {
    render(<CategoriesManager categories={list} />);
    const apple = screen.getByRole('region', { name: 'Apple' });
    fireEvent.click(within(apple).getByRole('button', { name: '+ Subcategoria' }));
    expect(screen.getByRole('dialog').textContent).toContain('Nova subcategoria em Apple');
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Apple Watch' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(saveCategory).toHaveBeenCalledWith(null, expect.objectContaining({ name: 'Apple Watch', parentId: A }));
  });

  it('editar subcategoria permite trocar de categoria', () => {
    render(<CategoriesManager categories={list} />);
    fireEvent.click(screen.getByRole('button', { name: 'Editar Macbook' }));
    expect(screen.getByRole('dialog').textContent).toContain('Editar subcategoria');
    expect((screen.getByLabelText('Fica dentro de') as HTMLSelectElement).value).toBe(A);
  });

  it('com 3 cartões na home, não deixa marcar um quarto', () => {
    const full = [cat(A, 'A', null, { homeCard: true }), cat(B, 'B', null, { homeCard: true }), cat(C, 'C', null, { homeCard: true }), cat(D, 'D', null)];
    render(<CategoriesManager categories={full} />);
    fireEvent.click(screen.getByRole('button', { name: 'Editar D' }));
    expect((screen.getByLabelText('Mostrar como cartão na página inicial') as HTMLInputElement).disabled).toBe(true);
  });

  it('setas mudam a ordem só entre irmãs', async () => {
    render(<CategoriesManager categories={list} />);
    expect((screen.getByRole('button', { name: 'Subir Celulares' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Descer Celulares' }));
    await waitFor(() => expect(reorderCategories).toHaveBeenCalledWith([A, C, B, D]));
  });

  it('Esc fecha a janela', () => {
    render(<CategoriesManager categories={list} />);
    fireEvent.click(screen.getByRole('button', { name: '+ Nova categoria' }));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
