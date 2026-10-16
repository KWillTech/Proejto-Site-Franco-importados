import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { connection } from 'next/server';

/** Cliente com sessão (cookies) para Server Components, Server Actions e Route Handlers. */
export async function createClient() {
  // Sessão é sempre por requisição: sem isso o prerender de runtime (cacheComponents) acusa o Date.now() do auth-js.
  await connection();
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Chamado de um Server Component: o proxy cuida de renovar a sessão.
          }
        },
      },
    },
  );
}
