import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/** Renova a sessão do Supabase (padrão oficial do @supabase/ssr) e barra /admin sem login. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  // getClaims valida o JWT (não confia só no cookie, como getSession faria) e renova o token vencido.
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims && request.nextUrl.pathname !== '/admin/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = '';
    const redirect = NextResponse.redirect(url);
    // Leva junto o que o Supabase gravou (ex.: limpeza do cookie de sessão inválido).
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }
  return response;
}
