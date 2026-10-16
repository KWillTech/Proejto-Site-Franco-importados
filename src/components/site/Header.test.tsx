import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CartProvider } from '@/components/cart/CartProvider';
import { khamrah } from '@/lib/test-fixtures';
import { Header } from './Header';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('Header', () => {
  it('mostra logo, busca e atalhos, sem "Minha conta"', () => {
    const { container } = render(<Header whatsappHref="https://wa.me/5511999999999" />);
    expect(screen.getByAltText('Franco Importados — atacado e varejo')).toBeTruthy();
    const form = container.querySelector('form');
    expect(form?.getAttribute('action')).toBe('/busca');
    expect(form?.querySelector('input[name="q"]')).toBeTruthy();
    expect(screen.getByText('Atendimento').closest('a')?.getAttribute('href')).toBe('https://wa.me/5511999999999');
    expect(screen.getByText('Meu carrinho').closest('a')?.getAttribute('href')).toBe('/carrinho');
    expect(screen.queryByText('Minha conta')).toBeNull();
  });

  it('sem número de WhatsApp, "Atendimento" não é link', () => {
    render(<Header whatsappHref={null} />);
    expect(screen.getByText('Atendimento').closest('a')).toBeNull();
  });

  it('o contador mostra as peças do carrinho guardado', () => {
    localStorage.setItem('franco.cart.v1', JSON.stringify([{ ...khamrah, qty: 9 }]));
    render(<CartProvider><Header whatsappHref={null} /></CartProvider>);
    expect(screen.getByLabelText('9 itens').textContent).toBe('9');
  });
});
