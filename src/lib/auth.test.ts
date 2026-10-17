import { beforeEach, describe, expect, it, vi } from 'vitest';

const getUser = vi.fn();
const rpc = vi.fn();
const redirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT ${url}`);
});
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser }, rpc }) }));
vi.mock('next/navigation', () => ({ redirect: (url: string) => redirect(url) }));

import { requireUser } from './auth';

beforeEach(() => {
  getUser.mockReset();
  rpc.mockReset().mockResolvedValue({ data: true, error: null });
  redirect.mockClear();
});

describe('requireUser', () => {
  it('sem sessão, redireciona para o login', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { message: 'Auth session missing!' } });
    await expect(requireUser()).rejects.toThrow('NEXT_REDIRECT /admin/login');
  });

  it('admin logado, devolve o usuário', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    await expect(requireUser()).resolves.toEqual({ id: 'u1' });
    expect(rpc).toHaveBeenCalledWith('is_admin');
    expect(redirect).not.toHaveBeenCalled();
  });

  it('logado sem ser admin, volta ao login com aviso', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u2' } }, error: null });
    rpc.mockResolvedValue({ data: false, error: null });
    await expect(requireUser()).rejects.toThrow('NEXT_REDIRECT /admin/login?erro=sem-acesso');
  });

  it('erro ao consultar is_admin conta como sem acesso', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    rpc.mockResolvedValue({ data: null, error: { message: 'fetch failed' } });
    await expect(requireUser()).rejects.toThrow('NEXT_REDIRECT /admin/login?erro=sem-acesso');
  });
});
