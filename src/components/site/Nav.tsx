import Link from 'next/link';
import type { MenuCategory } from '@/lib/types';
import styles from './Nav.module.css';

// Lista das filhas abre por CSS (:hover e :focus-within), sem JS.
export function Nav({ categories }: { categories: MenuCategory[] }) {
  return (
    <nav className={styles.nav} aria-label="Categorias">
      <Link href="/">Início</Link>
      {categories.map((c) => (
        <div key={c.id} className={styles.item}>
          <Link href={`/categoria/${c.slug}`}>{c.name}</Link>
          {c.children.length > 0 && (
            <ul className={styles.sub}>
              {c.children.map((s) => (
                <li key={s.id}><Link href={`/categoria/${s.slug}`}>{s.name}</Link></li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </nav>
  );
}
