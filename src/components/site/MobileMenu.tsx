'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Fragment, useRef, useState } from 'react';
import type { MenuCategory } from '@/lib/types';
import styles from './MobileMenu.module.css';

// Popover nativo: abre pelo botão do cabeçalho, fecha com Esc ou clique fora.
// Categorias com subcategorias viram sanfona: tocar no nome abre/fecha a lista (uma por vez).
export function MobileMenu({ categories }: { categories: MenuCategory[] }) {
  const ref = useRef<HTMLElement>(null);
  const [aberta, setAberta] = useState<string | null>(null);
  const close = () => ref.current?.hidePopover();
  return (
    <nav id="menu-mobile" popover="auto" ref={ref} className={styles.menu} aria-label="Menu">
      <div className={styles.top}>
        <Link href="/" onClick={close} className={styles.logo} aria-label="Início">
          <Image src="/logos/franco-logo-preto.png" alt="" width={311} height={179} />
        </Link>
        <button type="button" className={styles.close} aria-label="Fechar menu" onClick={close}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <span className={styles.section}>Categorias</span>
      <div className={styles.links}>
      <Link href="/" onClick={close}>Início</Link>
      {categories.map((c) => {
        if (c.children.length === 0) {
          return <Link key={c.id} href={`/categoria/${c.slug}`} onClick={close}>{c.name}</Link>;
        }
        const open = aberta === c.id;
        const listId = `submenu-${c.id}`;
        return (
          <Fragment key={c.id}>
            <button type="button" className={styles.parent} aria-expanded={open} aria-controls={listId}
              onClick={() => setAberta(open ? null : c.id)}>
              {c.name}
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 6l4 4 4-4" />
              </svg>
            </button>
            <div id={listId} className={styles.subs} hidden={!open}>
              <Link href={`/categoria/${c.slug}`} className={styles.sub} onClick={close}>Ver tudo em {c.name}</Link>
              {c.children.map((s) => (
                <Link key={s.id} href={`/categoria/${s.slug}`} className={styles.sub} onClick={close}>{s.name}</Link>
              ))}
            </div>
          </Fragment>
        );
      })}
      </div>
      <Link href="/carrinho" onClick={close} className={styles.cart}>
        <svg viewBox="0 0 30 28" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 5h4l4 13h13l3-9" /><circle cx="12" cy="24" r="1.6" fill="currentColor" /><circle cx="22" cy="24" r="1.6" fill="currentColor" />
        </svg>
        Meu carrinho
      </Link>
    </nav>
  );
}
