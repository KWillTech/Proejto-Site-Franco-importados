import Image from 'next/image';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { NO_ACCESS } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import styles from '../admin.module.css';
import { LoginForm } from './LoginForm';

// Só admin vai direto ao painel: mandar qualquer logado criaria um laço login -> painel -> login.
async function LoginGate({ searchParams }: Pick<PageProps<'/admin/login'>, 'searchParams'>) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user && (await supabase.rpc('is_admin')).data === true) redirect('/admin/calculo');
  const { erro } = await searchParams;
  return <LoginForm initialError={erro === 'sem-acesso' ? NO_ACCESS : null} />;
}

export default function LoginPage({ searchParams }: PageProps<'/admin/login'>) {
  return (
    <main className={styles.loginPage}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <Image src="/logos/franco-logo-preto.png" alt="Franco Importados" width={311} height={179} priority />
        </div>
        <h1>Entrar no painel</h1>
        <Suspense>
          <LoginGate searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
