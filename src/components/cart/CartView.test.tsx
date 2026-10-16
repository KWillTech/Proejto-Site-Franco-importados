import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { refreshCart } from '@/app/(site)/carrinho/actions';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { iphone, khamrah } from '@/lib/test-fixtures';
import type { CartLine } from '@/lib/types';
import { CartProvider } from './CartProvider';
import { CartView } from './CartView';

// A atualização de preços depende do banco; aqui ela nunca responde e o carrinho fica como gravado.
vi.mock('@/app/(site)/carrinho/actions', () => ({ refreshCart: vi.fn(() => new Promise(() => {})) }));

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function renderCart(lines: CartLine[], whatsappNumber = '(62) 99999-0000') {
  localStorage.setItem('franco.cart.v1', JSON.stringify(lines));
  return render(<CartProvider><CartView whatsappNumber={whatsappNumber} /></CartProvider>);
}

describe('CartView', () => {
  it('com 7 peças avisa que faltam 3', () => {
    renderCart([{ ...khamrah, qty: 7 }]);
    expect(screen.getByText('Faltam 3 peças para o preço de atacado')).toBeTruthy();
    expect(screen.getByText('Varejo')).toBeTruthy();
  });

  it('com 9 peças avisa que falta 1', () => {
    renderCart([{ ...khamrah, qty: 9 }]);
    expect(screen.getByText('Falta 1 peça para o preço de atacado')).toBeTruthy();
  });

  it('com 10 peças aplica o atacado', () => {
    renderCart([{ ...khamrah, qty: 10 }]);
    expect(screen.getByText('Preço de atacado aplicado')).toBeTruthy();
    expect(screen.getByText('Atacado')).toBeTruthy();
  });

  it('com número de WhatsApp inválido, "Enviar pedido" fica desabilitado com explicação', () => {
    renderCart([iphone], '123');
    const send = screen.getByRole('button', { name: 'Enviar pedido' }) as HTMLButtonElement;
    expect(send.disabled).toBe(true);
    expect(screen.getByText('Pedidos pelo WhatsApp estão indisponíveis no momento.')).toBeTruthy();
  });

  it('nome ou cidade em branco impedem o envio', () => {
    renderCart([iphone]);
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Maria' } });
    const send = screen.getByRole('link', { name: 'Enviar pedido' });
    // fireEvent devolve false quando o clique foi cancelado (o link não abre).
    expect(fireEvent.click(send)).toBe(false);
    expect(screen.getByText('Informe seu nome e sua cidade.')).toBeTruthy();
  });

  it('com nome e cidade, "Enviar pedido" leva ao WhatsApp com a mensagem em nova aba', () => {
    renderCart([iphone]);
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Maria Souza' } });
    fireEvent.change(screen.getByLabelText('Cidade'), { target: { value: 'Goiânia - GO' } });
    const send = screen.getByRole('link', { name: 'Enviar pedido' });
    expect(send.getAttribute('target')).toBe('_blank');
    expect(send.getAttribute('rel')).toBe('noopener noreferrer');
    const href = send.getAttribute('href')!;
    expect(href.startsWith('https://wa.me/5562999990000?text=')).toBe(true);
    expect(decodeURIComponent(href.split('?text=')[1])).toContain('Nome: Maria Souza\nCidade: Goiânia - GO');
    expect(JSON.parse(localStorage.getItem('franco.customer.v1')!)).toEqual({ name: 'Maria Souza', city: 'Goiânia - GO' });
  });

  it('carrinho vazio mostra a mensagem com link para a home', () => {
    renderCart([]);
    expect(screen.getByText('Seu carrinho está vazio.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Ver produtos' }).getAttribute('href')).toBe('/');
  });

  it('"Esvaziar carrinho" só esvazia depois de confirmar', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    renderCart([iphone]);
    fireEvent.click(screen.getByRole('button', { name: 'Esvaziar carrinho' }));
    expect(screen.queryByText('Seu carrinho está vazio.')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Esvaziar carrinho' }));
    expect(screen.getByText('Seu carrinho está vazio.')).toBeTruthy();
    confirm.mockRestore();
  });

  it('ao abrir, item que não existe mais sai com aviso', async () => {
    vi.mocked(refreshCart).mockResolvedValueOnce([]);
    renderCart([iphone]);
    expect(await screen.findByText('Removemos do carrinho por indisponibilidade: iPhone 17 Pro — Azul, 256GB.')).toBeTruthy();
    expect(screen.getByText('Seu carrinho está vazio.')).toBeTruthy();
  });

  it('se a atualização falhar, o carrinho fica como estava', async () => {
    vi.mocked(refreshCart).mockRejectedValueOnce(new Error('fora do ar'));
    renderCart([iphone]);
    await Promise.resolve();
    expect(screen.getByText('iPhone 17 Pro')).toBeTruthy();
    expect(JSON.parse(localStorage.getItem('franco.cart.v1')!)).toEqual([iphone]);
  });
});
