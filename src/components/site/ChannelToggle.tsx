'use client';

import { WHOLESALE_MIN_PIECES } from '@/lib/pricing';
import type { Channel } from '@/lib/types';
import { useChannel } from './ChannelProvider';
import styles from './ChannelToggle.module.css';

const OPTIONS: Array<[Channel, string]> = [['varejo', 'Varejo'], ['atacado', 'Atacado']];

export function ChannelToggle() {
  const { channel, setChannel } = useChannel();
  return (
    <div className={styles.channel}>
      <div className={styles.pills} role="group" aria-label="Tabela de preços">
        {OPTIONS.map(([value, label]) => (
          <button key={value} type="button" aria-pressed={channel === value}
            className={channel === value ? styles.on : undefined} onClick={() => setChannel(value)}>
            {label}
          </button>
        ))}
      </div>
      <p>
        {channel === 'varejo'
          ? 'Preço unitário para compras no varejo.'
          : `Preço de atacado, válido a partir de ${WHOLESALE_MIN_PIECES} peças por pedido.`}
      </p>
    </div>
  );
}
