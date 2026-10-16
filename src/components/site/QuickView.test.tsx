import { act, cleanup, render } from '@testing-library/react';
import { Activity } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '@/lib/types';
import { QuickView } from './QuickView';

afterEach(cleanup);

// jsdom não implementa o modal do <dialog>: só o essencial (abrir, fechar e o evento close assíncrono).
HTMLDialogElement.prototype.showModal = function () { this.open = true; };
HTMLDialogElement.prototype.close = function () {
  if (!this.open) return;
  this.open = false;
  setTimeout(() => this.dispatchEvent(new Event('close')));
};

const product: Product = {
  id: 'p2', slug: 'khamrah', name: 'Lattafa Khamrah EDP 100ml', description: '', categorySlug: 'perfumes',
  images: [], badge: null, available: true, featured: false, pixPercent: 10, installments: null, optionNames: [],
  variants: [{ id: 'v9', optionValues: [], retailCents: 34990, wholesaleCents: 21990, available: true }],
};

describe('QuickView', () => {
  // Ao navegar, o Next esconde a rota anterior com <Activity>; um modal aberto deixaria a página nova inerte.
  it('fecha o diálogo quando a rota que o contém é escondida', async () => {
    const onClose = vi.fn();
    const ui = (mode: 'visible' | 'hidden') => (
      <Activity mode={mode}><QuickView product={product} onClose={onClose} /></Activity>
    );
    const { rerender } = render(ui('visible'));
    const dialog = document.querySelector('dialog')!;
    expect(dialog.open).toBe(true);
    await act(async () => rerender(ui('hidden')));
    expect(dialog.open).toBe(false);
    await act(() => new Promise((r) => setTimeout(r, 0)));
    expect(onClose).toHaveBeenCalled();
  });
});
