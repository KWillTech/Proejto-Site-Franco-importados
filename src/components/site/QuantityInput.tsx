import { useState } from 'react';
import { clampQty } from '@/lib/variants';
import styles from './QuantityInput.module.css';

// Texto digitado fica local para o usuário apagar o campo sem o valor voltar.
export function QuantityInput({ value, onChange }: { value: number; onChange: (qty: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <div className={styles.qty}>
      <button type="button" aria-label="Diminuir quantidade" onClick={() => onChange(clampQty(value - 1))}>−</button>
      <input type="number" inputMode="numeric" min={1} max={999} aria-label="Quantidade" value={draft ?? value}
        onChange={(e) => {
          const text = e.target.value;
          setDraft(text);
          if (text !== '' && !Number.isNaN(Number(text))) onChange(clampQty(text));
        }}
        onBlur={() => setDraft(null)} />
      <button type="button" aria-label="Aumentar quantidade" onClick={() => onChange(clampQty(value + 1))}>+</button>
    </div>
  );
}
