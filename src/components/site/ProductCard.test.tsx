import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CartProvider } from '@/components/cart/CartProvider';
import type { Product } from '@/lib/types';
import { ProductCard } from './ProductCard';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const product: Product = {
  id: 'p1', slug: 'iphone-17-pro', name: 'iPhone 17 Pro', description: '', categorySlug: 'iphone',
  images: ['/placeholders/phone-blue.svg'], badge: null, available: true, featured: true,
  pixPercent: 10, installments: 12, optionNames: ['Cor'],
  variants: [
    { id: 'v1', optionValues: ['Azul'], retailCents: 967072, wholesaleCents: 899000, available: true },
    { id: 'v2', optionValues: ['Preto'], retailCents: 967072, wholesaleCents: 899000, available: true },
  ],
};

describe('ProductCard', () => {
  it('produto esgotado mostra "Esgotado" e não tem "Comprar"', () => {
    render(<ProductCard product={{ ...product, available: false }} />);
    expect(screen.getByText('Esgotado')).toBeTruthy();
    expect(screen.queryByText('Comprar')).toBeNull();
  });

  it('com variações, "Comprar" leva à página do produto', () => {
    render(<ProductCard product={product} />);
    expect(screen.getByText('Comprar').closest('a')?.getAttribute('href')).toBe('/produto/iphone-17-pro');
  });

  it('sem variações, "Comprar" adiciona 1 unidade e mostra "Ver carrinho"', () => {
    const perfume: Product = {
      ...product, slug: 'khamrah', name: 'Lattafa Khamrah EDP 100ml', optionNames: [],
      variants: [{ id: 'v9', optionValues: [], retailCents: 34990, wholesaleCents: 21990, available: true }],
    };
    render(<CartProvider><ProductCard product={perfume} /></CartProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Comprar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Comprar' }));
    expect(screen.getByRole('link', { name: 'Ver carrinho' }).getAttribute('href')).toBe('/carrinho');
    const saved = JSON.parse(localStorage.getItem('franco.cart.v1')!);
    expect(saved).toMatchObject([{ variantId: 'v9', qty: 2 }]);
  });

  it('sem variações, "Comprar" usa a primeira variante disponível', () => {
    const perfume: Product = {
      ...product, slug: 'khamrah', optionNames: [],
      variants: [
        { id: 'esgotada', optionValues: [], retailCents: 34990, wholesaleCents: 21990, available: false },
        { id: 'ok', optionValues: [], retailCents: 34990, wholesaleCents: 21990, available: true },
      ],
    };
    render(<CartProvider><ProductCard product={perfume} /></CartProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Comprar' }));
    expect(JSON.parse(localStorage.getItem('franco.cart.v1')!)).toMatchObject([{ variantId: 'ok', qty: 1 }]);
  });
});
