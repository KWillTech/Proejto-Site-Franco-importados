import { WHOLESALE_MIN_PIECES, formatBRL, installmentCents, pixCents, unitCents } from '@/lib/pricing';
import type { Channel } from '@/lib/types';
import styles from './PriceBlock.module.css';

type Props = {
  retailCents: number; wholesaleCents: number;
  pixPercent: number | null; installments: number | null;
  channel: Channel; from?: boolean;
};

export function PriceBlock({ retailCents, wholesaleCents, pixPercent, installments, channel, from }: Props) {
  const unit = unitCents({ retailCents, wholesaleCents }, channel);
  const atacado = channel === 'atacado';
  const prefix = from ? 'a partir de ' : '';
  const main = pixPercent === null
    ? `${prefix}${formatBRL(unit)}${atacado ? ' por peça' : ''}`
    : `${prefix}${formatBRL(pixCents(unit, pixPercent))} com Pix`;
  return (
    <div>
      <div className={styles.price}>{main}</div>
      {atacado ? (
        <>
          {pixPercent !== null && <div className={styles.inst}>{formatBRL(unit)} por peça</div>}
          <div className={styles.min}>a partir de {WHOLESALE_MIN_PIECES} peças</div>
        </>
      ) : (
        installments && <div className={styles.inst}>ou {installments}x de {formatBRL(installmentCents(unit, installments))}</div>
      )}
    </div>
  );
}
