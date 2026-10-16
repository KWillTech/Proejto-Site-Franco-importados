import { beforeEach, describe, expect, it, vi } from 'vitest';

const getUser = vi.fn();
const redirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT ${url}`);
});
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser } }) }));
vi.mock('next/navigation', () => ({ redirect: (url: string) => redirect(url) }));

import { requireUser } from './auth';

beforeEach(() => {
  getUser.mockReset();
  redirect.mockClear();
});

describe('requireUser', () => {
  it('sem sessão, redireciona para o login', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { message: 'Auth session missing!' } });
    await expect(requireUser()).rejects.toThrow('NEXT_REDIRECT /admin/login');
  });

  it('com sessão, devolve o usuário', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    await expect(requireUser()).resolves.toEqual({ id: 'u1' });
    expect(redirect).not.toHaveBeenCalled();
  });
});
