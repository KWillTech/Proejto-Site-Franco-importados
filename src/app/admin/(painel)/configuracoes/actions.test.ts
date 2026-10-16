import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireUser = vi.fn();
const createClient = vi.fn();
vi.mock('@/lib/auth', () => ({ requireUser: () => requireUser() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: () => createClient() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { saveSettings } from './actions';

beforeEach(() => {
  requireUser.mockReset();
  createClient.mockReset();
});

describe('saveSettings', () => {
  it('sem sessão, nada é gravado', async () => {
    requireUser.mockRejectedValue(new Error('NEXT_REDIRECT /admin/login'));
    await expect(saveSettings({ whatsappNumber: '62999990000', topbarText: '' })).rejects.toThrow('NEXT_REDIRECT');
    expect(createClient).not.toHaveBeenCalled();
  });

  it('número inválido não chega ao banco', async () => {
    requireUser.mockResolvedValue({ id: 'u1' });
    expect(await saveSettings({ whatsappNumber: '123', topbarText: '' })).toEqual({
      ok: false, errors: { whatsappNumber: 'Informe um número de WhatsApp com DDD.' },
    });
    expect(createClient).not.toHaveBeenCalled();
  });

  it('grava o número normalizado na linha 1', async () => {
    requireUser.mockResolvedValue({ id: 'u1' });
    const update = vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) }));
    createClient.mockResolvedValue({ from: () => ({ update }) });
    expect(await saveSettings({ whatsappNumber: '(62) 99999-0000', topbarText: ' Frete ' })).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({ whatsapp_number: '5562999990000', topbar_text: 'Frete' });
  });
});
