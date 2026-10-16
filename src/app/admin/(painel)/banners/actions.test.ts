import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireUser = vi.fn();
const createClient = vi.fn();
vi.mock('@/lib/auth', () => ({ requireUser: () => requireUser() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: () => createClient() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { deleteBanner, reorderBanners, saveBanner } from './actions';

const ID = '0b6c4a2e-1f3d-4c5b-9a8e-7d6f5e4c3b2a';
const input = { imageDesktop: '/a.svg', imageMobile: '/b.svg', alt: '', link: '', active: true };

beforeEach(() => {
  requireUser.mockReset();
  createClient.mockReset();
});

describe('sem sessão, nada é gravado', () => {
  it.each([
    ['saveBanner', () => saveBanner(null, input)],
    ['deleteBanner', () => deleteBanner(ID)],
    ['reorderBanners', () => reorderBanners([ID])],
  ])('%s', async (_name, call) => {
    requireUser.mockRejectedValue(new Error('NEXT_REDIRECT /admin/login'));
    await expect(call()).rejects.toThrow('NEXT_REDIRECT /admin/login');
    expect(createClient).not.toHaveBeenCalled();
  });
});

describe('com sessão, entrada inválida não chega ao banco', () => {
  beforeEach(() => requireUser.mockResolvedValue({ id: 'u1' }));

  it('recusa link perigoso, ids ruins e ordem repetida', async () => {
    const r = await saveBanner(null, { ...input, link: 'javascript:alert(1)' });
    expect(r.ok).toBe(false);
    expect((await saveBanner('x', input)).ok).toBe(false);
    expect((await deleteBanner('x')).ok).toBe(false);
    expect((await reorderBanners([ID, ID])).ok).toBe(false);
    expect(createClient).not.toHaveBeenCalled();
  });
});
