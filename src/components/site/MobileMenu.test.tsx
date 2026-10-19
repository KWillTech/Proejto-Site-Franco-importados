import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { MenuCategory } from '@/lib/types';
import { MobileMenu } from './MobileMenu';

afterEach(cleanup);

const cat = (id: string, name: string, slug: string, children: MenuCategory['children'] = []) =>
  ({ id, name, slug, parentId: null, position: 0, children }) as unknown as MenuCategory;

const categories = [
  cat('1', 'Apple', 'apple', [cat('11', 'Celulares', 'apple-celulares'), cat('12', 'Macbook', 'macbook')]),
  cat('2', 'Notebook', 'notebook'),
  cat('3', 'Perfumaria', 'perfumaria', [cat('31', 'Masculino', 'masculino')]),
];

describe('MobileMenu', () => {
  it('categoria sem subcategorias continua sendo link direto', () => {
    render(<MobileMenu categories={categories} />);
    expect(screen.getByText('Notebook').closest('a')?.getAttribute('href')).toBe('/categoria/notebook');
  });

  it('subcategorias começam escondidas e abrem ao tocar na categoria', () => {
    render(<MobileMenu categories={categories} />);
    const apple = screen.getByRole('button', { name: 'Apple', hidden: true });
    expect(apple.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByText('Macbook').closest('[hidden]')).toBeTruthy();

    fireEvent.click(apple);
    expect(apple.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Macbook').closest('[hidden]')).toBeNull();
    expect(screen.getByText('Ver tudo em Apple').closest('a')?.getAttribute('href')).toBe('/categoria/apple');

    fireEvent.click(apple);
    expect(screen.getByText('Macbook').closest('[hidden]')).toBeTruthy();
  });

  it('abrir outra categoria fecha a anterior', () => {
    render(<MobileMenu categories={categories} />);
    fireEvent.click(screen.getByRole('button', { name: 'Apple', hidden: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Perfumaria', hidden: true }));
    expect(screen.getByText('Macbook').closest('[hidden]')).toBeTruthy();
    expect(screen.getByText('Masculino').closest('[hidden]')).toBeNull();
  });
});
