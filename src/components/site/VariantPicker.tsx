import type { Product } from '@/lib/types';
import { isValueAvailable, optionValues } from '@/lib/variants';
import styles from './VariantPicker.module.css';

type Props = { product: Product; selected: (string | null)[]; onSelect: (index: number, value: string) => void };

export function VariantPicker({ product, selected, onSelect }: Props) {
  return (
    <>
      {product.optionNames.map((name, i) => (
        <fieldset key={name} className={styles.group}>
          <legend>{name}</legend>
          {optionValues(product, i).map((value) => {
            const ok = isValueAvailable(product, selected, i, value);
            return (
              <button key={value} type="button" disabled={!ok} aria-pressed={selected[i] === value}
                className={`${styles.opt} ${selected[i] === value ? styles.on : ''} ${ok ? '' : styles.off}`}
                onClick={() => onSelect(i, value)}>
                {value}
              </button>
            );
          })}
        </fieldset>
      ))}
    </>
  );
}
