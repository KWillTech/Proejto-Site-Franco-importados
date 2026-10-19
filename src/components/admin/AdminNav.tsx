'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import n from './AdminHeader.module.css';

const ICON: Record<string, ReactNode> = {
  calculo: <><rect x="5" y="3" width="14" height="18" rx="2.5" /><path d="M8.5 7h7M8.5 11h1M12 11h1M15.5 11h0M8.5 14.5h1M12 14.5h1M8.5 18h1M12 18h1M15.5 14.5v3.5" /></>,
  produtos: <><path d="M4 8l8-4 8 4-8 4z" /><path d="M4 8v8l8 4 8-4V8M12 12v8" /></>,
  categorias: <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>,
  banners: <><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M3 15l5-4 4 3 3-2 6 4" /><circle cx="15.5" cy="9" r="1.5" /></>,
  configuracoes: <><circle cx="12" cy="12" r="3" /><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" /></>,
};

export const ADMIN_TABS = [
  { href: '/admin/calculo', key: 'calculo', label: 'Cálculo' },
  { href: '/admin/produtos', key: 'produtos', label: 'Produtos' },
  { href: '/admin/categorias', key: 'categorias', label: 'Categorias' },
  { href: '/admin/banners', key: 'banners', label: 'Banners' },
  { href: '/admin/configuracoes', key: 'configuracoes', label: 'Configurações' },
];

export function AdminNav() {
  const path = usePathname() ?? '';
  return (
    <nav className={n.nav} aria-label="Painel">
      {ADMIN_TABS.map((t) => {
        const on = path === t.href || path.startsWith(`${t.href}/`);
        return (
          <Link key={t.key} href={t.href} className={on ? n.tabOn : n.tab} aria-current={on ? 'page' : undefined}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICON[t.key]}</svg>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
