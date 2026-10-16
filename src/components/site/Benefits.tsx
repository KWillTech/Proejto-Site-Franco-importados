import { WHOLESALE_MIN_PIECES } from '@/lib/pricing';
import styles from './Benefits.module.css';

const ICON = { fill: 'none', stroke: '#95a5a6', strokeWidth: 4, 'aria-hidden': true } as const;

const ITEMS = [
  {
    title: 'Desconto no Pix',
    text: 'Desconto aplicado no pedido.',
    icon: (
      <svg viewBox="0 0 70 70" {...ICON}>
        <circle cx="35" cy="35" r="31" /><circle cx="27" cy="28" r="4" /><circle cx="43" cy="42" r="4" />
        <path d="M44 25L26 45" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: `Atacado a partir de ${WHOLESALE_MIN_PIECES} peças`,
    text: 'Preço especial para revenda.',
    icon: (
      <svg viewBox="0 0 70 70" {...ICON}>
        <circle cx="35" cy="35" r="31" /><rect x="19" y="24" width="32" height="22" rx="3" /><path d="M19 32h32M25 40h8" />
      </svg>
    ),
  },
  {
    title: 'Enviamos para todo o Brasil com seguro',
    text: null,
    icon: (
      <svg viewBox="0 0 70 70" {...ICON} strokeLinejoin="round">
        <circle cx="35" cy="35" r="31" /><path d="M19 23h6l7 20h14" />
        <rect x="33" y="24" width="13" height="12" transform="rotate(-15 39 30)" /><circle cx="30" cy="49" r="3" />
      </svg>
    ),
  },
  {
    title: 'Pedido finalizado pelo WhatsApp',
    text: 'Atendimento direto com a loja.',
    icon: (
      <svg viewBox="0 0 70 70" {...ICON} strokeLinejoin="round">
        <circle cx="35" cy="35" r="31" /><path d="M22 47l3-9a12 12 0 1 1 5 5z" />
      </svg>
    ),
  },
];

export function Benefits() {
  return (
    <section className={styles.info}>
      <div className="container">
        <div className={styles.row}>
          {ITEMS.map((it) => (
            <div key={it.title} className={styles.item}>
              {it.icon}
              <div>
                <h3>{it.title}</h3>
                {it.text && <p>{it.text}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
