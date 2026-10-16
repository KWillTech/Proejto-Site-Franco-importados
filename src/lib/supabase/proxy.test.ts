// @vitest-environment node
import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type CookieOpts = { cookies: { setAll: (c: { name: string; value: string; options: object }[], h: Record<string, string>) => void } };
let opts: CookieOpts;
const getClaims = vi.fn();
vi.mock('@supabase/ssr', () => ({
  createServerClient: (_url: string, _key: string, o: CookieOpts) => {
    opts = o;
    return { auth: { getClaims } };
  },
}));

import { config } from '@/proxy';
import { updateSession } from './proxy';

const req = (path: string) => new NextRequest(`http://localhost${path}`);
// Simula o auth-js renovando o token durante getClaims.
const renewing = (data: unknown) => async () => {
  opts.cookies.setAll([{ name: 'sb-token', value: 'novo', options: { path: '/' } }], { 'cache-control': 'private, no-store' });
  return { data, error: null };
};

beforeEach(() => getClaims.mockReset());

describe('updateSession', () => {
  it('sem sessão, /admin/* vai para o login, sem a query', async () => {
    getClaims.mockResolvedValue({ data: null, error: null });
    for (const path of ['/admin', '/admin/produtos', '/admin/produtos/novo?x=1']) {
      const res = await updateSession(req(path));
      expect(res.headers.get('location')).toBe('http://localhost/admin/login');
    }
  });

  it('sem sessão, a própria página de login abre', async () => {
    getClaims.mockResolvedValue({ data: null, error: null });
    const res = await updateSession(req('/admin/login'));
    expect(res.headers.get('location')).toBeNull();
  });

  it('com sessão, segue para o painel', async () => {
    getClaims.mockResolvedValue({ data: { claims: { sub: 'u1' } }, error: null });
    const res = await updateSession(req('/admin/produtos'));
    expect(res.headers.get('location')).toBeNull();
  });

  it('cookies renovados chegam na resposta que segue', async () => {
    getClaims.mockImplementation(renewing({ claims: { sub: 'u1' } }));
    const res = await updateSession(req('/admin/produtos'));
    expect(res.cookies.get('sb-token')?.value).toBe('novo');
    expect(res.headers.get('cache-control')).toBe('private, no-store');
  });

  it('o redirecionamento leva os cookies gravados pelo Supabase', async () => {
    getClaims.mockImplementation(renewing(null));
    const res = await updateSession(req('/admin/produtos'));
    expect(res.headers.get('location')).toBe('http://localhost/admin/login');
    expect(res.cookies.get('sb-token')?.value).toBe('novo');
  });
});

describe('matcher do proxy', () => {
  it('casa o painel e deixa a vitrine de fora', () => {
    const match = (path: string) => unstable_doesMiddlewareMatch({ config, url: `http://localhost${path}` });
    expect(match('/admin')).toBe(true);
    expect(match('/admin/produtos')).toBe(true);
    expect(match('/')).toBe(false);
    expect(match('/produto/x')).toBe(false);
  });
});
