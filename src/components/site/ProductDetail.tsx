'use client';

import { useState } from 'react';
import { fromPrices, isSoldOut } from '@/lib/data';
import type { CartLine, Product } from '@/lib/types';
import { clampQty, findVariant, toCartLine } from '@/lib/variants';
import { useChannel } from './ChannelProvider';
import { Gallery } from './Gallery';
import { PriceBlock } from './PriceBlock';
import styles from './ProductDetail.module.css';
import { QuantityInput } from './QuantityInput';
import { VariantPicker } from './VariantPicker';

// shortcut: sem onAdd o botão fica desabilitado ("Carrinho em breve"), a Task 9 passa o onAdd do carrinho.
export function ProductDetail({ product, onAdd }: { product: Product; onAdd?: (line: CartLine) => void }) {
  const { channel } = useChannel();
  const [selected, setSelected] = useState<(string | null)[]>(() => product.optionNames.map(() => null));
  const [qty, setQty] = useState(1);
  const soldOut = isSoldOut(product);
  // Sem opções (optionNames vazio) findVariant já devolve a variante única.
  const variant = findVariant(product, selected);
  const range = fromPrices(product);
  const prices = variant ?? range;
  const from = !variant && !!range?.hasRange;

  let label = 'Adicionar ao carrinho';
  if (!variant) label = 'Escolha as opções';
  else if (!onAdd) label = 'Carrinho em breve';

  return (
    <div className={styles.detail}>
      <Gallery images={product.images} alt={product.name} />
      <div>
        <h1 className={styles.name} id={`produto-${product.id}`}>{product.name}</h1>
        {prices && (
          <div className={styles.prices}>
            {(['varejo', 'atacado'] as const).map((c) => (
              <div key={c} className={`${styles.price} ${channel === c ? styles.current : ''}`}>
                <div className={styles.tag}>{c === 'varejo' ? 'Varejo' : 'Atacado'}</div>
                <PriceBlock retailCents={prices.retailCents} wholesaleCents={prices.wholesaleCents}
                  pixPercent={product.pixPercent} installments={product.installments} channel={c} from={from} />
              </div>
            ))}
          </div>
        )}
        {soldOut ? (
          <p className={styles.soldout}>Esgotado</p>
        ) : (
          <>
            <VariantPicker product={product} selected={selected}
              onSelect={(i, value) => setSelected((s) => s.map((x, j) => (j === i ? value : x)))} />
            <div className={styles.buy}>
              <QuantityInput value={qty} onChange={setQty} />
              <button type="button" className={styles.add} disabled={!variant || !variant.available || !onAdd}
                onClick={() => variant && onAdd?.(toCartLine(product, variant, clampQty(qty)))}>
                {label}
              </button>
            </div>
          </>
        )}
        {product.description && <p className={styles.description}>{product.description}</p>}
      </div>
    </div>
  );
}
