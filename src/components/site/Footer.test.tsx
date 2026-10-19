import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { FOOTER_DEFAULTS, mapSettings } from '@/lib/settings';
import { Footer } from './Footer';

afterEach(cleanup);

describe('Footer', () => {
  it('mostra os textos vindos das configurações', () => {
    render(<Footer phone="5562999990000" whatsappHref="https://wa.me/5562999990000"
      texts={{ hours: 'Seg a sex 9h-18h', email: 'oi@francoimportado.com.br', payment: 'Pix', shipping: 'Correios', copyright: '© Franco 2026' }} />);
    expect(screen.getByText('Seg a sex 9h-18h')).toBeTruthy();
    expect(screen.getByText('oi@francoimportado.com.br').closest('a')?.getAttribute('href')).toBe('mailto:oi@francoimportado.com.br');
    expect(screen.getByText('(62) 99999-0000')).toBeTruthy();
    expect(screen.getByText('© Franco 2026')).toBeTruthy();
  });

  it('campo em branco esconde o bloco', () => {
    render(<Footer phone={null} whatsappHref={null}
      texts={{ hours: '', email: '', payment: 'Pix', shipping: '', copyright: '' }} />);
    expect(screen.queryByText('Horário de atendimento')).toBeNull();
    expect(screen.queryByText('Entre em contato')).toBeNull();
    expect(screen.queryByText('Meios de envio')).toBeNull();
    expect(screen.getByText('Meios de pagamento')).toBeTruthy();
  });
});

describe('mapSettings', () => {
  it('sem as colunas do rodapé (migração não rodada) usa os textos padrão', () => {
    expect(mapSettings({ whatsapp_number: '5562999990000', topbar_text: '' }).footer).toEqual(FOOTER_DEFAULTS);
  });

  it('texto vazio salvo no painel continua vazio', () => {
    expect(mapSettings({ whatsapp_number: '1', topbar_text: '', footer_email: '' }).footer.email).toBe('');
  });
});
