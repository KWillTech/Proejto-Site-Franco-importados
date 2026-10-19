import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Category } from '@/lib/types';
import { CategoryCards } from './CategoryCards';

afterEach(cleanup);

const cat = (name: string, homeCardImage: string | null): Category => ({
  id: name, name, slug: name.toLowerCase(), parentId: null, homeCard: true, homeCardImage, homeCardTag: 'ORIGINAIS · LACRADOS',
});

describe('CategoryCards', () => {
  it('arte em SVG fica embaixo do título e da tag', () => {
    render(<CategoryCards categories={[cat('Notebook', '/placeholders/card-macbook.svg')]} />);
    expect(screen.getByRole('heading', { name: 'Notebook' })).toBeTruthy();
    expect(screen.getByText('ORIGINAIS · LACRADOS')).toBeTruthy();
  });

  it('foto pronta ocupa o cartão sem repetir título nem tag', () => {
    render(<CategoryCards categories={[cat('Apple', 'https://x.supabase.co/storage/v1/object/public/media/produtos/a.webp')]} />);
    expect(screen.queryByRole('heading', { name: 'Apple' })).toBeNull();
    expect(screen.queryByText('ORIGINAIS · LACRADOS')).toBeNull();
    expect(screen.getByAltText('Apple')).toBeTruthy();
    expect(screen.getByRole('link').getAttribute('href')).toBe('/categoria/apple');
  });
});
