import type { User } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const NO_ACCESS = 'Esta conta não tem acesso ao painel.';

/** Exige sessão válida (confirmada no servidor do Supabase) de uma conta em public.admins. */
// Toda server action e toda leitura do painel chama isto: as actions não passam pelo proxy.
export async function requireUser(): Promise<User> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect('/admin/login');
  // Com RLS, gravação barrada atinge 0 linhas sem erro: sem esta checagem o painel diria "salvo". Erro no RPC = sem acesso.
  if ((await supabase.rpc('is_admin')).data !== true) redirect('/admin/login?erro=sem-acesso');
  return data.user;
}
