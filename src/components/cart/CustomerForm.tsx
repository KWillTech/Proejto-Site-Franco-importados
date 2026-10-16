import type { Customer } from '@/lib/whatsapp';
import styles from './CartView.module.css';

export function CustomerForm({ value, onChange }: { value: Customer; onChange: (c: Customer) => void }) {
  return (
    <div className={styles.customer}>
      <label>
        Nome
        <input value={value.name} maxLength={80} autoComplete="name"
          onChange={(e) => onChange({ ...value, name: e.target.value })} />
      </label>
      <label>
        Cidade
        <input value={value.city} maxLength={80} autoComplete="address-level2"
          onChange={(e) => onChange({ ...value, city: e.target.value })} />
      </label>
    </div>
  );
}
