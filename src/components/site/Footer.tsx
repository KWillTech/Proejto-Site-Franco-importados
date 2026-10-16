import styles from './Footer.module.css';

// 55 + DDD + 9 dígitos vira (DDD) NNNNN-NNNN; outros formatos aparecem como +número.
function displayPhone(phone: string): string {
  const m = /^55(\d{2})(\d{5})(\d{4})$/.exec(phone);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : `+${phone}`;
}

export function Footer({ phone, whatsappHref }: { phone: string | null; whatsappHref: string | null }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.foot}>
        <div className={styles.row}>
          <div className={styles.col}>
            <h4>Horário de atendimento</h4>
            <p>Segunda à sexta das 09h00 às 18h00. Sábado das 10h00 às 14h00</p>
          </div>
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
            <a className={styles.ic} href="mailto:contato@francoimportados.com.br">
              <svg viewBox="0 0 24 24" fill="#0e1733" aria-hidden="true">
                <path d="M3 6h18v12H3z" />
                <path d="M3 6l9 7 9-7" stroke="#ecf0f1" strokeWidth="1.6" fill="none" />
              </svg>
              contato@francoimportados.com.br
            </a>
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.col}>
            <h4>Meios de pagamento</h4>
            <p>Pix · Cartão de crédito — combinados no WhatsApp</p>
          </div>
          <div className={styles.col}>
            <h4>Meios de envio</h4>
            <p>Correios · Transportadora</p>
          </div>
        </div>
      </div>
      <div className={styles.legal}>Copyright FRANCO IMPORTADOS - 2026. Todos os direitos reservados.</div>
    </footer>
  );
}
