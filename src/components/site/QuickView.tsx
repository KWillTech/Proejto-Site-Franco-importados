'use client';

import { useEffect, useRef } from 'react';
import type { Product } from '@/lib/types';
import { ProductDetail } from './ProductDetail';
import styles from './QuickView.module.css';

// Montado só quando aberto. O <dialog> nativo dá Esc, foco preso e devolve o foco ao botão que abriu.
export function QuickView({ product, onClose }: { product: Product; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!ref.current?.open) ref.current?.showModal();
  }, []);
  return (
    <dialog ref={ref} className={styles.dialog} aria-labelledby={`produto-${product.id}`}
      onClose={onClose} onClick={(e) => e.target === ref.current && ref.current.close()}>
      <div className={styles.body}>
        <button type="button" className={styles.close} aria-label="Fechar" onClick={() => ref.current?.close()}>×</button>
        <ProductDetail product={product} />
      </div>
    </dialog>
  );
}
