import Link from 'next/link';
import type { Category } from '@/lib/types';
import styles from './Nav.module.css';

export function Nav({ categories }: { categories: Category[] }) {
  return (
    <nav className={styles.nav} aria-label="Categorias">
      <Link href="/">Início</Link>
      {categories.map((c) => (
        <Link key={c.id} href={`/categoria/${c.slug}`}>{c.name}</Link>
      ))}
    </nav>
  );
}
