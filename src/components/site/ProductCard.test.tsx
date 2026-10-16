import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Product } from '@/lib/types';
import { ProductCard } from './ProductCard';

afterEach(cleanup);

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
});
