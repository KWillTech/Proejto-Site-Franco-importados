import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Header } from './Header';

afterEach(cleanup);

describe('Header', () => {
  it('mostra logo, busca e atalhos, sem "Minha conta"', () => {
    const { container } = render(<Header whatsappHref="https://wa.me/5511999999999" cartCount={0} />);
    expect(screen.getByAltText('Franco Importados — atacado e varejo')).toBeTruthy();
    const form = container.querySelector('form');
    expect(form?.getAttribute('action')).toBe('/busca');
    expect(form?.querySelector('input[name="q"]')).toBeTruthy();
    expect(screen.getByText('Atendimento').closest('a')?.getAttribute('href')).toBe('https://wa.me/5511999999999');
    expect(screen.getByText('Meu carrinho').closest('a')?.getAttribute('href')).toBe('/carrinho');
    expect(screen.queryByText('Minha conta')).toBeNull();
  });

  it('sem número de WhatsApp, "Atendimento" não é link', () => {
    render(<Header whatsappHref={null} cartCount={0} />);
    expect(screen.getByText('Atendimento').closest('a')).toBeNull();
  });
});
