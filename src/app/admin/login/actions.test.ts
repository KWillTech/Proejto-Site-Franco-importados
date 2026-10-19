import { beforeEach, describe, expect, it, vi } from 'vitest';

const signInWithPassword = vi.fn();
const signOutFn = vi.fn();
const rpc = vi.fn();
const redirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT ${url}`);
});
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { signInWithPassword, signOut: signOutFn }, rpc }),
}));
vi.mock('next/navigation', () => ({ redirect: (url: string) => redirect(url) }));

import { signIn, signOut } from './actions';

const form = (email: string, password: string) => {
  const fd = new FormData();
  fd.set('email', email);
  fd.set('password', password);
  return fd;
};

beforeEach(() => {
  signInWithPassword.mockReset();
  signOutFn.mockReset().mockResolvedValue({ error: null });
  redirect.mockClear();
  rpc.mockReset().mockResolvedValue({ data: true, error: null });
});

describe('signIn', () => {
  it('recusa entrada inválida sem chamar o Supabase', async () => {
    expect(await signIn(null, form('nao-e-email', 'x'))).toBe('Informe um e-mail válido e a senha.');
    expect(await signIn(null, form('dona@loja.com', ''))).toBe('Informe um e-mail válido e a senha.');
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it('credenciais erradas mostram a mensagem combinada', async () => {
    signInWithPassword.mockResolvedValue({ data: {}, error: { code: 'invalid_credentials', message: 'Invalid login credentials' } });
    expect(await signIn(null, form('dona@loja.com', 'errada'))).toBe('E-mail ou senha incorretos.');
  });

  it('400 sem código também é credencial inválida', async () => {
    signInWithPassword.mockResolvedValue({ data: {}, error: { status: 400, message: 'Invalid login credentials' } });
    expect(await signIn(null, form('dona@loja.com', 'errada'))).toBe('E-mail ou senha incorretos.');
  });

  it('outra falha não culpa a senha', async () => {
    signInWithPassword.mockResolvedValue({ data: {}, error: { status: 429, code: 'over_request_rate_limit', message: 'rate limit' } });
    expect(await signIn(null, form('dona@loja.com', 'x'))).toBe('Não foi possível entrar agora. Tente de novo em instantes.');
  });

  it('sucesso vai para /admin/calculo', async () => {
    signInWithPassword.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    await expect(signIn(null, form(' dona@loja.com ', 'certa'))).rejects.toThrow('NEXT_REDIRECT /admin/calculo');
    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'dona@loja.com', password: 'certa' });
    expect(signOutFn).not.toHaveBeenCalled();
  });

  it('conta que não é admin sai na hora e vê o aviso', async () => {
    signInWithPassword.mockResolvedValue({ data: { user: { id: 'u2' } }, error: null });
    rpc.mockResolvedValue({ data: false, error: null });
    expect(await signIn(null, form('estranho@x.com', 'certa'))).toBe('Esta conta não tem acesso ao painel.');
    expect(signOutFn).toHaveBeenCalledWith({ scope: 'local' });
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe('signOut', () => {
  it('encerra a sessão e volta ao login', async () => {
    await expect(signOut()).rejects.toThrow('NEXT_REDIRECT /admin/login');
    expect(signOutFn).toHaveBeenCalledWith({ scope: 'local' });
  });
});
