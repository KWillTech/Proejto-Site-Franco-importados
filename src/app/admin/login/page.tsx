import Image from 'next/image';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import styles from '../admin.module.css';
import { LoginForm } from './LoginForm';

async function RedirectIfLoggedIn() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect('/admin/produtos');
  return null;
}

export default function LoginPage() {
  return (
    <main className={styles.loginPage}>
      <Suspense>
        <RedirectIfLoggedIn />
      </Suspense>
      <div className={styles.card}>
        <div className={styles.logo}>
          <Image src="/logos/franco-logo-preto.png" alt="Franco Importados" width={311} height={179} priority />
        </div>
        <h1>Entrar no painel</h1>
        <LoginForm />
      </div>
    </main>
  );
}
