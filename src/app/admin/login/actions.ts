'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
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
    return error.code === 'invalid_credentials'
      ? 'E-mail ou senha incorretos.'
      : 'Não foi possível entrar agora. Tente de novo em instantes.';
  }
  redirect('/admin/produtos');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
