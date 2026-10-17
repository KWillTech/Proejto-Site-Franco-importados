import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { refreshCart } from '@/app/(site)/carrinho/actions';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { iphone as iphoneBase, khamrah as khamrahBase } from '@/lib/test-fixtures';
import type { CartLine, Product, Variant } from '@/lib/types';
import { CartProvider } from './CartProvider';
import { CartView } from './CartView';

// A atualização de preços depende do banco; por padrão ela nunca responde e o carrinho fica como gravado.
vi.mock('@/app/(site)/carrinho/actions', () => ({ refreshCart: vi.fn(() => new Promise(() => {})) }));

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.mocked(refreshCart).mockClear();
});

const iphone: CartLine = { ...iphoneBase, variantId: '11111111-1111-4111-8111-111111111111' };
const khamrah: CartLine = { ...khamrahBase, variantId: '22222222-2222-4222-8222-222222222222' };

// Variante e produto "do banco" equivalentes a uma linha do carrinho.
function freshOf(l: CartLine, over: Partial<Variant> = {}): { variant: Variant; product: Product } {
  const variant: Variant = { id: l.variantId, optionValues: l.optionLabel ? l.optionLabel.split(', ') : [],
    retailCents: l.retailCents, wholesaleCents: l.wholesaleCents, available: true, ...over };
  return { variant, product: {
    id: l.productId, slug: l.slug, name: l.name, description: '', categorySlug: 'x', images: [], badge: null,
    available: true, featured: false, pixPercent: l.pixPercent, installments: l.installments,
    optionNames: variant.optionValues.map(() => 'Opção'), variants: [variant],
  } };
}

const flush = () => act(() => new Promise((r) => setTimeout(r, 0)));

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

  it('nome ou cidade em branco impedem o envio', async () => {
    vi.mocked(refreshCart).mockResolvedValueOnce([freshOf(iphone)]);
    renderCart([iphone]);
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Maria' } });
    fireEvent.click(screen.getByLabelText('Pix'));
    const send = await screen.findByRole('link', { name: 'Enviar pedido' });
    // fireEvent devolve false quando o clique foi cancelado (o link não abre).
    expect(fireEvent.click(send)).toBe(false);
    expect(screen.getByText('Informe seu nome e sua cidade.')).toBeTruthy();
  });

  it('com nome e cidade, "Enviar pedido" leva ao WhatsApp com a mensagem em nova aba', async () => {
    vi.mocked(refreshCart).mockResolvedValueOnce([freshOf(iphone)]);
    renderCart([iphone]);
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Maria Souza' } });
    fireEvent.change(screen.getByLabelText('Cidade'), { target: { value: 'Goiânia - GO' } });
    fireEvent.click(screen.getByLabelText('Pix'));
    const send = await screen.findByRole('link', { name: 'Enviar pedido' });
    expect(send.getAttribute('target')).toBe('_blank');
    expect(send.getAttribute('rel')).toBe('noopener noreferrer');
    const href = send.getAttribute('href')!;
    expect(href.startsWith('https://wa.me/5562999990000?text=')).toBe(true);
    expect(decodeURIComponent(href.split('?text=')[1])).toContain('Nome: Maria Souza\nCidade: Goiânia - GO\nPagamento: Pix\n');
    expect(JSON.parse(localStorage.getItem('franco.customer.v1')!))
      .toEqual({ name: 'Maria Souza', city: 'Goiânia - GO', payment: 'Pix', installments: 1 });
  });

  it('enquanto confere os preços, "Enviar pedido" e "Copiar pedido" ficam desabilitados', () => {
    renderCart([iphone]);
    expect((screen.getByRole('button', { name: 'Enviar pedido' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Copiar pedido' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('depois de conferir os preços, "Enviar pedido" e "Copiar pedido" ficam ativos', async () => {
    vi.mocked(refreshCart).mockResolvedValueOnce([freshOf(iphone)]);
    renderCart([iphone]);
    fireEvent.click(screen.getByLabelText('Débito'));
    expect(await screen.findByRole('link', { name: 'Enviar pedido' })).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Copiar pedido' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('sem forma de pagamento, "Enviar pedido" e "Copiar pedido" ficam desabilitados com aviso', async () => {
    vi.mocked(refreshCart).mockResolvedValueOnce([freshOf(iphone)]);
    // Cliente salvo antes do campo de pagamento existir.
    localStorage.setItem('franco.customer.v1', JSON.stringify({ name: 'Maria', city: 'Rio' }));
    renderCart([iphone]);
    await flush();
    expect((screen.getByLabelText('Pix') as HTMLInputElement).checked).toBe(false);
    expect((screen.getByRole('button', { name: 'Enviar pedido' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Copiar pedido' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('Escolha a forma de pagamento.')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Pix'));
    expect(screen.queryByText('Escolha a forma de pagamento.')).toBeNull();
    expect(screen.getByRole('link', { name: 'Enviar pedido' })).toBeTruthy();
  });

  it('parcelas só no Crédito e no Boleto, até o menor limite do carrinho, com aviso de juros', () => {
    renderCart([iphone, { ...khamrah, installments: 3 }]);
    fireEvent.click(screen.getByLabelText('Pix'));
    expect(screen.queryByLabelText('Parcelas')).toBeNull();
    fireEvent.click(screen.getByLabelText('Débito'));
    expect(screen.queryByLabelText('Parcelas')).toBeNull();
    for (const forma of ['Crédito', 'Boleto']) {
      fireEvent.click(screen.getByLabelText(forma));
      const select = screen.getByLabelText('Parcelas') as HTMLSelectElement;
      expect([...select.options].map((o) => o.text)).toEqual(['1x', '2x', '3x']);
      expect(screen.getByText('Juros do parcelamento: consulte o vendedor.')).toBeTruthy();
    }
  });

  it('com produto sem parcelamento, só 1x e sem aviso de juros', () => {
    renderCart([iphone, khamrah]);
    fireEvent.click(screen.getByLabelText('Crédito'));
    expect([...(screen.getByLabelText('Parcelas') as HTMLSelectElement).options].map((o) => o.text)).toEqual(['1x']);
    expect(screen.queryByText('Juros do parcelamento: consulte o vendedor.')).toBeNull();
  });

  it('parcela escolhida acima do limite atual cai para o máximo, também na mensagem', async () => {
    vi.mocked(refreshCart).mockResolvedValueOnce([freshOf({ ...iphone, installments: 4 })]);
    localStorage.setItem('franco.customer.v1', JSON.stringify({ name: 'Maria', city: 'Rio', payment: 'Boleto', installments: 12 }));
    renderCart([{ ...iphone, installments: 4 }]);
    expect((screen.getByLabelText('Parcelas') as HTMLSelectElement).value).toBe('4');
    const href = (await screen.findByRole('link', { name: 'Enviar pedido' })).getAttribute('href')!;
    expect(decodeURIComponent(href.split('?text=')[1])).toContain('Pagamento: Boleto em 4x (juros a consultar)');
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

  it('id fora do formato não impede a conferência dos outros e sai com aviso', async () => {
    vi.mocked(refreshCart).mockImplementationOnce(async (ids) => (ids.includes(khamrah.variantId) ? [freshOf(khamrah)] : []));
    renderCart([{ ...iphone, variantId: 'abc' }, khamrah]);
    expect(await screen.findByText('Removemos do carrinho por indisponibilidade: iPhone 17 Pro — Azul, 256GB.')).toBeTruthy();
    expect(refreshCart).toHaveBeenCalledWith([khamrah.variantId]);
    expect(JSON.parse(localStorage.getItem('franco.cart.v1')!).map((l: CartLine) => l.variantId)).toEqual([khamrah.variantId]);
  });

  it('preço diferente no banco atualiza a linha e avisa', async () => {
    vi.mocked(refreshCart).mockResolvedValueOnce([freshOf(khamrah, { retailCents: 39990 })]);
    renderCart([{ ...khamrah, qty: 3 }]);
    expect(await screen.findByText('Alguns preços foram atualizados.')).toBeTruthy();
    expect(screen.getByText('R$ 399,90 cada')).toBeTruthy();
  });

  it('se a conferência falhar, o carrinho fica como estava e avisa', async () => {
    vi.mocked(refreshCart).mockRejectedValueOnce(new Error('fora do ar'));
    renderCart([iphone]);
    expect(await screen.findByText('Não foi possível conferir os preços agora.')).toBeTruthy();
    expect(screen.getByText('iPhone 17 Pro')).toBeTruthy();
    expect(JSON.parse(localStorage.getItem('franco.cart.v1')!)).toEqual([iphone]);
    expect((screen.getByRole('button', { name: 'Enviar pedido' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Copiar pedido' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('linha que chega depois da primeira conferência também é conferida', async () => {
    vi.mocked(refreshCart).mockResolvedValueOnce([freshOf(iphone)]).mockResolvedValueOnce([freshOf(khamrah)]);
    renderCart([iphone]);
    await flush();
    // Outra aba grava o carrinho com mais uma linha.
    localStorage.setItem('franco.cart.v1', JSON.stringify([iphone, khamrah]));
    await act(async () => window.dispatchEvent(new StorageEvent('storage', { key: 'franco.cart.v1' })));
    await flush();
    expect(vi.mocked(refreshCart).mock.calls).toEqual([[[iphone.variantId]], [[khamrah.variantId]]]);
  });
});
