import Image from 'next/image';
import Link from 'next/link';
import styles from './Header.module.css';

const ICON_ATENDIMENTO = (
  <svg viewBox="0 0 30 28" fill="none" stroke="#0e1733" strokeWidth="2.6" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 3h14v10H9l-5 4z" />
    <path d="M12 17v3h8l5 4v-4h1V10h-4" />
  </svg>
);

export function Header({ whatsappHref, cartCount }: { whatsappHref: string | null; cartCount: number }) {
  const atendimento = (
    <>
      {ICON_ATENDIMENTO}
      <span>Atendimento</span>
    </>
  );
  return (
    <header className={styles.head}>
      <div className={styles.row}>
        <button type="button" className={styles.burger} aria-label="Abrir menu" popoverTarget="menu-mobile">
          <svg viewBox="0 0 24 24" fill="none" stroke="#0e1733" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
        <Link className={styles.logo} href="/">
          <Image src="/logos/franco-logo-preto.png" alt="Franco Importados — atacado e varejo" width={240} height={80} priority />
        </Link>
        <form className={styles.search} action="/busca" role="search">
          <input type="search" name="q" placeholder="O que você está buscando?" aria-label="Buscar produtos" />
          <button type="submit" aria-label="Buscar">
            <svg viewBox="0 0 24 24" fill="none" stroke="#0e1733" strokeWidth="3.2" strokeLinecap="round" aria-hidden="true">
              <circle cx="10" cy="10" r="6.5" />
              <path d="M15 15l6 6" />
            </svg>
          </button>
        </form>
        <div className={styles.utils}>
          {whatsappHref ? (
            <a className={`${styles.util} ${styles.hideMobile}`} href={whatsappHref} target="_blank" rel="noopener noreferrer">
              {atendimento}
            </a>
          ) : (
            <div className={`${styles.util} ${styles.hideMobile}`}>{atendimento}</div>
          )}
          <Link className={styles.util} href="/carrinho">
            <svg viewBox="0 0 30 28" fill="none" stroke="#0e1733" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 5h4l4 13h13l3-9" />
              <circle cx="12" cy="24" r="1.6" fill="#0e1733" />
              <circle cx="22" cy="24" r="1.6" fill="#0e1733" />
            </svg>
            <i className={styles.badge} aria-label={`${cartCount} itens`}>{cartCount}</i>
            <span>Meu carrinho</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
