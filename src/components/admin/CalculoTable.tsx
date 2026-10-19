'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { saveCosts } from '@/app/admin/(painel)/calculo/actions';
import styles from '@/app/admin/admin.module.css';
import { priceCents } from '@/lib/dolar';
import { formatBRL } from '@/lib/pricing';
import { parseMoney } from '@/lib/validation';

export type CostRow = {
  variantId: string; productName: string; variantLabel: string;
  costUsdCents: number | null; marginCents: number | null; retailCents: number;
};

type Entry = { cost: string; margin: string };

const toMoney = (cents: number | null) => (cents === null ? '' : (cents / 100).toFixed(2).replace('.', ','));
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
/** Vazio = null (não preenchido); texto que não é dinheiro = undefined (inválido). */
const read = (s: string) => (s.trim() === '' ? null : parseMoney(s) ?? undefined);
const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' });

export function CalculoTable({ rows, rate, rateAt }: { rows: CostRow[]; rate: number | null; rateAt: string | null }) {
  const initial = () => Object.fromEntries(rows.map((r) => [r.variantId, { cost: toMoney(r.costUsdCents), margin: toMoney(r.marginCents) }]));
  const [saved, setSaved] = useState<Record<string, Entry>>(initial);
  const [values, setValues] = useState<Record<string, Entry>>(initial);
  const [query, setQuery] = useState('');
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ok, setOk] = useState(false);

  const q = fold(query.trim());
  const visible = q ? rows.filter((r) => fold(r.productName).includes(q)) : rows;
  const set = (id: string, key: keyof Entry, v: string) => setValues((s) => ({ ...s, [id]: { ...s[id], [key]: v } }));

  function submit(e: FormEvent) {
    e.preventDefault();
    setOk(false);
    const changed = rows.filter((r) => values[r.variantId].cost !== saved[r.variantId].cost
      || values[r.variantId].margin !== saved[r.variantId].margin);
    const payload = changed.map((r) => ({
      variantId: r.variantId, costUsdCents: read(values[r.variantId].cost), marginCents: read(values[r.variantId].margin),
    }));
    if (payload.some((p) => p.costUsdCents === undefined || p.marginCents === undefined)) {
      setErrors({ form: 'Corrija os valores inválidos. Use o formato 1.234,56.' });
      return;
    }
    if (payload.length === 0) {
      setErrors({});
      setOk(true);
      return;
    }
    const sent = { ...values };
    startTransition(async () => {
      try {
        const r = await saveCosts(payload);
        setErrors(r.ok ? {} : r.errors);
        if (r.ok) setSaved(sent);
        setOk(r.ok);
      } catch {
        setErrors({ form: 'Não foi possível salvar. Tente de novo.' });
      }
    });
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <div className={styles.rateBox}>
        <span className={styles.hint}>Dólar comercial (venda)</span>
        {rate === null ? (
          <strong>Cotação ainda não carregada</strong>
        ) : (
          <>
            <strong className={styles.rate}>R$ {rate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</strong>
            {rateAt && <span className={styles.hint}>Atualizado em {dateTime.format(new Date(rateAt))}</span>}
          </>
        )}
      </div>
      <div className={styles.search}>
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar produto..." aria-label="Buscar produto" />
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr><th>Produto</th><th>Variação</th><th>Custo (US$)</th><th>Margem (R$)</th><th>Preço de venda (R$)</th></tr>
          </thead>
          <tbody>
            {visible.map((r) => {
              const v = values[r.variantId];
              const cost = read(v.cost);
              const margin = read(v.margin);
              const priced = cost != null && margin != null && rate !== null;
              const name = `${r.productName} (${r.variantLabel})`;
              return (
                <tr key={r.variantId} className={priced ? undefined : styles.off}>
                  <td>{r.productName}</td>
                  <td>{r.variantLabel}</td>
                  <td>
                    <input value={v.cost} onChange={(e) => set(r.variantId, 'cost', e.target.value)} inputMode="decimal"
                      placeholder="sem custo" aria-label={`Custo em dólar de ${name}`} aria-invalid={cost === undefined} />
                  </td>
                  <td>
                    <input value={v.margin} onChange={(e) => set(r.variantId, 'margin', e.target.value)} inputMode="decimal"
                      placeholder="sem margem" aria-label={`Margem em reais de ${name}`} aria-invalid={margin === undefined} />
                  </td>
                  <td>{priced ? <b>{formatBRL(priceCents(cost, rate, margin))}</b> : 'fora da vitrine'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {visible.length === 0 && <p className={styles.hint}>Nenhum produto encontrado.</p>}
      {(errors.form ?? Object.values(errors)[0]) && <p className={styles.error} role="alert">{errors.form ?? Object.values(errors)[0]}</p>}
      {ok && <p className={styles.hint} role="status">Salvo.</p>}
      <div className={styles.actions}>
        <button type="submit" className={`${styles.btn} ${styles.primary}`} disabled={pending}>{pending ? 'Salvando…' : 'Salvar alterações'}</button>
      </div>
    </form>
  );
}
