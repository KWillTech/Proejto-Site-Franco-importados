import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireUser = vi.fn();
const createClient = vi.fn();
vi.mock('@/lib/auth', () => ({ requireUser: () => requireUser() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: () => createClient() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { saveSettings } from './actions';

const footer = {
  hours: 'Seg a sex', email: 'contato@francoimportado.com.br', payment: 'Pix', shipping: 'Correios', copyright: '© Franco',
};

beforeEach(() => {
  requireUser.mockReset();
  createClient.mockReset();
});

describe('saveSettings', () => {
  it('sem sessão, nada é gravado', async () => {
    requireUser.mockRejectedValue(new Error('NEXT_REDIRECT /admin/login'));
    await expect(saveSettings({ whatsappNumber: '62999990000', topbarText: '', footer })).rejects.toThrow('NEXT_REDIRECT');
    expect(createClient).not.toHaveBeenCalled();
  });

  it('número inválido não chega ao banco', async () => {
    requireUser.mockResolvedValue({ id: 'u1' });
    expect(await saveSettings({ whatsappNumber: '123', topbarText: '', footer })).toEqual({
      ok: false, errors: { whatsappNumber: 'Informe um número de WhatsApp com DDD.' },
    });
    expect(createClient).not.toHaveBeenCalled();
  });

  it('grava o número normalizado na linha 1', async () => {
    requireUser.mockResolvedValue({ id: 'u1' });
    const update = vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) }));
    createClient.mockResolvedValue({ from: () => ({ update }) });
    expect(await saveSettings({ whatsappNumber: '(62) 99999-0000', topbarText: ' Frete ', footer: { ...footer, hours: ' Seg a sex ' } })).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      whatsapp_number: '5562999990000', topbar_text: 'Frete',
      footer_hours: 'Seg a sex', footer_email: 'contato@francoimportado.com.br', footer_payment: 'Pix',
      footer_shipping: 'Correios', footer_copyright: '© Franco',
    });
  });

  it('e-mail do rodapé inválido não chega ao banco', async () => {
    requireUser.mockResolvedValue({ id: 'u1' });
    expect(await saveSettings({ whatsappNumber: '62999990000', topbarText: '', footer: { ...footer, email: 'contato' } })).toEqual({
      ok: false, errors: { 'footer.email': 'E-mail inválido.' },
    });
    expect(createClient).not.toHaveBeenCalled();
  });

  it('sem a migração do rodapé, avisa o que falta', async () => {
    requireUser.mockResolvedValue({ id: 'u1' });
    const update = vi.fn(() => ({ eq: vi.fn(async () => ({ error: { code: 'PGRST204', message: 'column' } })) }));
    createClient.mockResolvedValue({ from: () => ({ update }) });
    const r = await saveSettings({ whatsappNumber: '62999990000', topbarText: '', footer });
    expect(r.ok).toBe(false);
    expect(!r.ok && r.errors.form).toMatch(/0006_rodape/);
  });
});
