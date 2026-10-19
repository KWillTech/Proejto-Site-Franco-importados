import Image from 'next/image';
import Link from 'next/link';
import { Suspense, type ReactNode } from 'react';
import { signOut } from '@/app/admin/login/actions';
import { AdminNav } from '@/components/admin/AdminNav';
import h from '@/components/admin/AdminHeader.module.css';
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
      <header className={h.head}>
        <div className={`container ${h.row}`}>
          <Link className={h.brand} href="/admin/calculo">
            <Image src="/logos/franco-logo-preto.png" alt="Franco Importados — painel" width={311} height={179} priority />
            <span className={h.tag}>Painel</span>
          </Link>
          <AdminNav />
          <div className={h.side}>
            <a className={h.store} href="/" target="_blank" rel="noopener noreferrer">
              <span>Ver loja</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 5h5v5M19 5l-8 8M17 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h4" /></svg>
            </a>
            <form action={signOut}>
              <button type="submit" className={h.logout}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4" /></svg>
                Sair
              </button>
            </form>
          </div>
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
