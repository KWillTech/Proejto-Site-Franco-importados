import Image from 'next/image';
import Link from 'next/link';
import { Suspense, type ReactNode } from 'react';
import { signOut } from '@/app/admin/login/actions';
import { requireUser } from '@/lib/auth';
import styles from '../admin.module.css';

// Segunda camada: a barreira é o proxy. O layout não controla o RSC dos filhos nem re-renderiza
// na navegação, então cada página e action do painel chama requireUser() por conta própria.
async function RequireSession({ children }: { children: ReactNode }) {
  await requireUser();
  return children;
}

export default function PainelLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <>
      <header className={styles.head}>
        <div className={`container ${styles.headRow}`}>
          <Link className={styles.logo} href="/admin/produtos">
            <Image src="/logos/franco-logo-preto.png" alt="Franco Importados — painel" width={311} height={179} priority />
          </Link>
          <nav className={styles.nav} aria-label="Painel">
            <Link href="/admin/produtos">Produtos</Link>
            <Link href="/admin/categorias">Categorias</Link>
            <Link href="/admin/banners">Banners</Link>
            <Link href="/admin/calculo">Cálculo</Link>
            <Link href="/admin/configuracoes">Configurações</Link>
            <form action={signOut}>
              <button type="submit">Sair</button>
            </form>
          </nav>
        </div>
      </header>
      <main className={`container ${styles.main}`}>
        <Suspense>
          <RequireSession>{children}</RequireSession>
        </Suspense>
      </main>
    </>
  );
}
