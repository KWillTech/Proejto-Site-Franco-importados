'use client';

import Link from 'next/link';
import { Fragment, useRef } from 'react';
import type { MenuCategory } from '@/lib/types';
import styles from './MobileMenu.module.css';

// Popover nativo: abre pelo botão do cabeçalho, fecha com Esc ou clique fora.
export function MobileMenu({ categories }: { categories: MenuCategory[] }) {
  const ref = useRef<HTMLElement>(null);
  const close = () => ref.current?.hidePopover();
  return (
    <nav id="menu-mobile" popover="auto" ref={ref} className={styles.menu} aria-label="Menu">
      <button type="button" className={styles.close} aria-label="Fechar menu" onClick={close}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#0e1733" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
          <path d="M5 5l14 14M19 5L5 19" />
        </svg>
      </button>
      <Link href="/" onClick={close}>Início</Link>
      {categories.map((c) => (
        <Fragment key={c.id}>
          <Link href={`/categoria/${c.slug}`} onClick={close}>{c.name}</Link>
          {c.children.map((s) => (
            <Link key={s.id} href={`/categoria/${s.slug}`} className={styles.sub} onClick={close}>{s.name}</Link>
          ))}
        </Fragment>
      ))}
    </nav>
  );
}
