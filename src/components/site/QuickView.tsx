'use client';

import { useEffect, useRef } from 'react';
import type { Product } from '@/lib/types';
import { ProductDetail } from './ProductDetail';
import styles from './QuickView.module.css';

// Montado só quando aberto. O <dialog> nativo dá Esc, foco preso e devolve o foco ao botão que abriu.
export function QuickView({ product, onClose }: { product: Product; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog?.open) dialog?.showModal();
    // Ao navegar, o Next esconde esta rota (Activity) sem desmontar; o modal aberto deixaria a página nova inerte.
    return () => dialog?.close();
  }, []);
  return (
    <dialog ref={ref} className={styles.dialog} aria-labelledby={`produto-${product.id}`}
      // No StrictMode o efeito roda, limpa e roda de novo: o close daquele fechamento chega com o diálogo já reaberto.
      onClose={() => !ref.current?.open && onClose()}
      onClick={(e) => e.target === ref.current && ref.current.close()}>
      <div className={styles.body}>
        <button type="button" className={styles.close} aria-label="Fechar" onClick={() => ref.current?.close()}>×</button>
        <ProductDetail product={product} />
      </div>
    </dialog>
  );
}
