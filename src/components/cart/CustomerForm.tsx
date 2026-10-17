import type { Customer, Payment } from '@/lib/whatsapp';
import styles from './CartView.module.css';

const PAYMENTS: Payment[] = ['Pix', 'Crédito', 'Débito', 'Boleto'];

// maxInstallments: limite de parcelas do carrinho; value.installments já chega limitado a ele.
export function CustomerForm({ value, onChange, maxInstallments }:
  { value: Customer; onChange: (c: Customer) => void; maxInstallments: number }) {
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
      <fieldset>
        <legend>Forma de pagamento</legend>
        {PAYMENTS.map((p) => (
          <label key={p}>
            <input type="radio" name="payment" value={p} checked={value.payment === p} required
              onChange={() => onChange({ ...value, payment: p })} />
            {p}
          </label>
        ))}
      </fieldset>
      {(value.payment === 'Crédito' || value.payment === 'Boleto') && (
        <>
          <label>
            Parcelas
            <select value={value.installments} onChange={(e) => onChange({ ...value, installments: Number(e.target.value) })}>
              {Array.from({ length: maxInstallments }, (_, i) => <option key={i} value={i + 1}>{i + 1}x</option>)}
            </select>
          </label>
          {maxInstallments > 1 && <p className={styles.hint}>Juros do parcelamento: consulte o vendedor.</p>}
        </>
      )}
    </div>
  );
}
