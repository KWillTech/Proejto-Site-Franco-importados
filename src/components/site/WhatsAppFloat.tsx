import styles from './WhatsAppFloat.module.css';

export function WhatsAppFloat({ href }: { href: string }) {
  return (
    <a className={styles.wa} href={href} target="_blank" rel="noopener noreferrer" aria-label="Falar no WhatsApp">
      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 20l1.4-4.6A8 8 0 1 1 8.7 18.7z" />
        <path d="M9 8.5c0 3 2.5 6 6 6.5l1-1.6-2-1-1 .8c-.8-.4-1.6-1.2-2-2l.8-1-1-2z" fill="#fff" stroke="none" />
      </svg>
    </a>
  );
}
