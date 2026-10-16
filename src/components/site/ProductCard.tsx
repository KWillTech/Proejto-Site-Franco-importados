'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AddedToCart, useCart } from '@/components/cart/CartProvider';
import { fromPrices, isSoldOut } from '@/lib/data';
import type { Product } from '@/lib/types';
import { findVariant, toCartLine } from '@/lib/variants';
import { useChannel } from './ChannelProvider';
import { PriceBlock } from './PriceBlock';
import { QuickView } from './QuickView';
import styles from './ProductCard.module.css';

// Selos "5% OFF" viram o círculo do mockup; o resto é etiqueta.
function Badge({ text }: { text: string }) {
  const off = /^(\d+%)\s*OFF$/i.exec(text.trim());
  if (off) return <span className={`${styles.label} ${styles.circle}`}>{off[1]}<br />OFF</span>;
  return <span className={styles.label}>{text}</span>;
}

export function ProductCard({ product }: { product: Product }) {
  const { channel } = useChannel();
  const { dispatch } = useCart();
  const [quick, setQuick] = useState(false);
  const [added, setAdded] = useState(false);
  const prices = fromPrices(product);
  const soldOut = isSoldOut(product);
  const href = `/produto/${product.slug}`;
  return (
    <div className={styles.item}>
      <Link href={href} className={styles.image}>
        {(soldOut || product.badge) && (
          <div className={styles.labels}>
            {soldOut ? <span className={styles.label}>Esgotado</span> : <Badge text={product.badge!} />}
          </div>
        )}
        {product.images[0] && (
          // Imagens vêm do Storage ou de /placeholders (SVG); next/image não otimiza SVG.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.images[0]} alt={product.name} loading="lazy" />
        )}
      </Link>
      <div className={styles.desc}>
        <div className={styles.name}>{product.name}</div>
        {prices && (
          <PriceBlock retailCents={prices.retailCents} wholesaleCents={prices.wholesaleCents}
            pixPercent={product.pixPercent} installments={product.installments}
            channel={channel} from={prices.hasRange} />
        )}
        <div className={styles.actions}>
          {/* Com variações, "Comprar" leva à escolha na página; sem variações, adiciona 1 unidade. */}
          {!soldOut && (product.optionNames.length > 0 ? (
            <Link className={`${styles.btn} ${styles.primary}`} href={href}>Comprar</Link>
          ) : (
            <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={() => {
              dispatch({ type: 'add', line: toCartLine(product, findVariant(product, [])!, 1) });
              setAdded(true);
            }}>Comprar</button>
          ))}
          <button type="button" className={`${styles.btn} ${styles.secondary}`} onClick={() => setQuick(true)}>
            <svg viewBox="0 0 16 16" fill="#0e1733" aria-hidden="true">
              <path d="M8 3C4 3 1.5 6 .8 8c.7 2 3.2 5 7.2 5s6.5-3 7.2-5C14.5 6 12 3 8 3zm0 8a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
            </svg>
            Espiar
          </button>
        </div>
        <AddedToCart show={added} className={styles.added} />
      </div>
      {quick && <QuickView product={product} onClose={() => setQuick(false)} />}
    </div>
  );
}
