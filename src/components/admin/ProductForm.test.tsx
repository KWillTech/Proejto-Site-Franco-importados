import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { saveProduct } from '@/app/admin/(painel)/produtos/actions';
import { ProductForm } from './ProductForm';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('@/app/admin/(painel)/produtos/actions', () => ({
  saveProduct: vi.fn(async () => ({ ok: true })), deleteProduct: vi.fn(async () => undefined),
}));
vi.mock('./ImageUploader', () => ({ ImageUploader: () => null }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

const P = '11111111-1111-4111-8111-111111111111';
const S = '22222222-2222-4222-8222-222222222222';
const cats = [{ id: P, name: 'Perfumaria', parentId: null }, { id: S, name: 'Masculino', parentId: P }];

describe('ProductForm', () => {
  it('novo produto: prévia acompanha nome e categoria, e salva com a subcategoria', async () => {
    render(<ProductForm id={null} categories={cats} initial={null} />);
    expect(screen.getByRole('heading', { name: 'Novo produto' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Afnan 9PM' } });
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: P } });
    fireEvent.change(screen.getByLabelText('Subcategoria'), { target: { value: S } });
    expect(screen.getByText('Perfumaria › Masculino')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Destaque (aparece em Lançamentos)'));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar produto' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/admin/produtos'));
    expect(saveProduct).toHaveBeenCalledWith(null, expect.objectContaining({ name: 'Afnan 9PM', categoryId: S, featured: true, available: true }));
  });

  it('opções e variações: adiciona opção, nova linha e remove', () => {
    render(<ProductForm id={null} categories={cats} initial={null} />);
    fireEvent.click(screen.getByRole('button', { name: '+ Adicionar opção' }));
    fireEvent.change(screen.getByLabelText('Nome da opção 1'), { target: { value: 'Cor' } });
    fireEvent.click(screen.getByRole('button', { name: '+ Adicionar variação' }));
    expect(screen.getAllByLabelText('Cor')).toHaveLength(2);
    fireEvent.click(screen.getAllByRole('button', { name: 'Remover variação' })[0]);
    expect(screen.getAllByLabelText('Cor')).toHaveLength(1);
  });

  it('mostra o erro do servidor na barra de salvar', async () => {
    vi.mocked(saveProduct).mockResolvedValueOnce({ ok: false, errors: { name: 'Informe o nome.' } });
    render(<ProductForm id={null} categories={cats} initial={null} />);
    fireEvent.click(screen.getByRole('button', { name: 'Salvar produto' }));
    expect(await screen.findByText('Informe o nome.')).toBeTruthy();
    expect(screen.getByText('Revise os campos destacados.')).toBeTruthy();
  });
});
