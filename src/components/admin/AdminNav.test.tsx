import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminNav } from './AdminNav';

let path = '/admin/produtos/abc';
vi.mock('next/navigation', () => ({ usePathname: () => path }));
afterEach(cleanup);

describe('AdminNav', () => {
  it('Cálculo vem primeiro, ao lado de Produtos', () => {
    render(<AdminNav />);
    expect(screen.getAllByRole('link').map((a) => a.textContent)).toEqual(['Cálculo', 'Produtos', 'Categorias', 'Banners', 'Configurações']);
  });

  it('marca a aba atual, inclusive em subpáginas', () => {
    render(<AdminNav />);
    expect(screen.getByRole('link', { name: 'Produtos' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Cálculo' }).getAttribute('aria-current')).toBeNull();
    path = '/admin/calculo';
  });
});
