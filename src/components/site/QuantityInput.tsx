import { clampQty } from '@/lib/variants';
import styles from './QuantityInput.module.css';

export function QuantityInput({ value, onChange }: { value: number; onChange: (qty: number) => void }) {
  return (
    <div className={styles.qty}>
      <button type="button" aria-label="Diminuir quantidade" onClick={() => onChange(clampQty(value - 1))}>−</button>
      <input type="number" inputMode="numeric" min={1} max={999} aria-label="Quantidade" value={value}
        onChange={(e) => onChange(clampQty(e.target.value))} />
      <button type="button" aria-label="Aumentar quantidade" onClick={() => onChange(clampQty(value + 1))}>+</button>
    </div>
  );
}
