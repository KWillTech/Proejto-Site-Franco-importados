import type { FooterSettings } from '@/lib/types';
import styles from './Footer.module.css';

// 55 + DDD + 9 dígitos vira (DDD) NNNNN-NNNN; outros formatos aparecem como +número.
function displayPhone(phone: string): string {
  const m = /^55(\d{2})(\d{5})(\d{4})$/.exec(phone);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : `+${phone}`;
}

// Textos vêm de Painel → Configurações; campo em branco esconde o bloco.
export function Footer({ phone, whatsappHref, texts }: {
  phone: string | null; whatsappHref: string | null; texts: FooterSettings;
}) {
  const hasContact = (phone && whatsappHref) || texts.email;
  return (
    <footer className={styles.footer}>
      <div className={styles.foot}>
        <div className={styles.row}>
          {texts.hours && (
            <div className={styles.col}>
              <h4>Horário de atendimento</h4>
              <p>{texts.hours}</p>
            </div>
          )}
          {hasContact && (
            <div className={styles.col}>
              <h4>Entre em contato</h4>
              {phone && whatsappHref && (
                <a className={styles.ic} href={whatsappHref} target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#0e1733" strokeWidth="2.4" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 20l1.5-5A8 8 0 1 1 9 18.5z" />
                  </svg>
                  {displayPhone(phone)}
                </a>
              )}
              {texts.email && (
                <a className={styles.ic} href={`mailto:${texts.email}`}>
                  <svg viewBox="0 0 24 24" fill="#0e1733" aria-hidden="true">
                    <path d="M3 6h18v12H3z" />
                    <path d="M3 6l9 7 9-7" stroke="#ecf0f1" strokeWidth="1.6" fill="none" />
                  </svg>
                  {texts.email}
                </a>
              )}
            </div>
          )}
        </div>
        <div className={styles.row}>
          {texts.payment && (
            <div className={styles.col}>
              <h4>Meios de pagamento</h4>
              <p>{texts.payment}</p>
            </div>
          )}
          {texts.shipping && (
            <div className={styles.col}>
              <h4>Meios de envio</h4>
              <p>{texts.shipping}</p>
            </div>
          )}
        </div>
      </div>
      {texts.copyright && <div className={styles.legal}>{texts.copyright}</div>}
    </footer>
  );
}
