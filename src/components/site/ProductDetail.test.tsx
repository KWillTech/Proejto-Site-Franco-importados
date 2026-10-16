import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CartProvider } from '@/components/cart/CartProvider';
import type { Product } from '@/lib/types';
import { ProductDetail } from './ProductDetail';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const iphone: Product = {
  id: 'p1', slug: 'iphone-17-pro', name: 'iPhone 17 Pro', description: '', categorySlug: 'iphone',
  images: [], badge: null, available: true, featured: true, pixPercent: 10, installments: 12, optionNames: ['Cor'],
  variants: [
    { id: 'v1', optionValues: ['Azul'], retailCents: 967072, wholesaleCents: 899000, available: true },
    { id: 'v2', optionValues: ['Preto'], retailCents: 967072, wholesaleCents: 899000, available: true },
  ],
};

describe('ProductDetail', () => {
  it('adiciona a variação escolhida com a quantidade e mostra "Ver carrinho"', () => {
    render(<CartProvider><ProductDetail product={iphone} /></CartProvider>);
    expect((screen.getByRole('button', { name: 'Escolha as opções' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Preto' }));
    fireEvent.click(screen.getByLabelText('Aumentar quantidade'));
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar ao carrinho' }));
    expect(screen.getByRole('link', { name: 'Ver carrinho' }).getAttribute('href')).toBe('/carrinho');
    expect(JSON.parse(localStorage.getItem('franco.cart.v1')!)).toMatchObject([{ variantId: 'v2', optionLabel: 'Preto', qty: 2 }]);
  });
});
