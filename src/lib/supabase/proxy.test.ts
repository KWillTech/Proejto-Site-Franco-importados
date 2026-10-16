// @vitest-environment node
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getClaims = vi.fn();
vi.mock('@supabase/ssr', () => ({ createServerClient: () => ({ auth: { getClaims } }) }));

import { updateSession } from './proxy';

const req = (path: string) => new NextRequest(`http://localhost${path}`);

beforeEach(() => getClaims.mockReset());

describe('updateSession', () => {
  it('sem sessão, /admin/* vai para o login', async () => {
    getClaims.mockResolvedValue({ data: null, error: null });
    for (const path of ['/admin', '/admin/produtos', '/admin/produtos/novo']) {
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
});
