import type { User } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/** Exige sessão válida (confirmada no servidor do Supabase). Chamar antes de toda gravação do painel. */
export async function requireUser(): Promise<User> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect('/admin/login');
  return data.user;
}
