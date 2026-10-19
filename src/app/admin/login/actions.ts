'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { NO_ACCESS } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

const loginSchema = z.object({
  email: z.string().trim().pipe(z.email()),
  password: z.string().min(1),
});

/** Devolve a mensagem de erro, ou redireciona para o painel. */
export async function signIn(_prev: string | null, formData: FormData): Promise<string | null> {
  const parsed = loginSchema.safeParse({ email: formData.get('email'), password: formData.get('password') });
  if (!parsed.success) return 'Informe um e-mail válido e a senha.';

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // status 400 cobre servidores do Auth que não mandam o código.
    return error.code === 'invalid_credentials' || error.status === 400
      ? 'E-mail ou senha incorretos.'
      : 'Não foi possível entrar agora. Tente de novo em instantes.';
  }
  if ((await supabase.rpc('is_admin')).data !== true) {
    await supabase.auth.signOut({ scope: 'local' });
    return NO_ACCESS;
  }
  redirect('/admin/calculo');
}

export async function signOut() {
  const supabase = await createClient();
  // local: limpa os cookies mesmo se a chamada ao Auth falhar.
  await supabase.auth.signOut({ scope: 'local' });
  redirect('/admin/login');
}
