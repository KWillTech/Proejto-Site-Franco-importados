'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { saveCosts } from '@/app/admin/(painel)/calculo/actions';
import { priceCents } from '@/lib/dolar';
import { formatBRL } from '@/lib/pricing';
import { parseMoney } from '@/lib/validation';
import c from './CalculoTable.module.css';

export type CostRow = {
  variantId: string; productName: string; variantLabel: string;
  costUsdCents: number | null; marginCents: number | null; retailCents: number;
};

type Entry = { cost: string; margin: string };
// Variação criada depois do primeiro render (revalidatePath) ainda não tem entrada no estado.
const EMPTY: Entry = { cost: '', margin: '' };

const toMoney = (cents: number | null) => (cents === null ? '' : (cents / 100).toFixed(2).replace('.', ','));
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
/** Vazio = null (não preenchido); texto que não é dinheiro = undefined (inválido). */
const read = (s: string) => (s.trim() === '' ? null : parseMoney(s) ?? undefined);
type Filter = 'all' | 'on' | 'off';
const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' });

export function CalculoTable({ rows, rate, rateAt }: { rows: CostRow[]; rate: number | null; rateAt: string | null }) {
  const initial = () => Object.fromEntries(rows.map((r) => [r.variantId, { cost: toMoney(r.costUsdCents), margin: toMoney(r.marginCents) }]));
  const [saved, setSaved] = useState<Record<string, Entry>>(initial);
  const [values, setValues] = useState<Record<string, Entry>>(initial);
  const [query, setQuery] = useState('');
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ok, setOk] = useState(false);

  const [filter, setFilter] = useState<Filter>('all');

  const isDirty = (id: string) => {
    const v = values[id] ?? EMPTY, sv = saved[id] ?? EMPTY;
    return v.cost !== sv.cost || v.margin !== sv.margin;
  };
  const priceOf = (id: string) => {
    const v = values[id] ?? EMPTY;
    const cost = read(v.cost), margin = read(v.margin);
    const price = cost != null && margin != null && rate !== null ? priceCents(cost, rate, margin) : 0;
    return { v, cost, margin, price, priced: price > 0 }; // priced: mesma regra da recalc_prices (0005)
  };
  const onCount = rows.filter((r) => priceOf(r.variantId).priced).length;
  const pendingCount = rows.filter((r) => isDirty(r.variantId)).length;
  const invalidCount = rows.filter((r) => { const p = priceOf(r.variantId); return p.cost === undefined || p.margin === undefined; }).length;

  const q = fold(query.trim());
  const visible = rows.filter((r) => {
    if (q && !fold(r.productName).includes(q)) return false;
    if (filter === 'all') return true;
    return priceOf(r.variantId).priced === (filter === 'on');
  });
  const set = (id: string, key: keyof Entry, v: string) => setValues((s) => ({ ...s, [id]: { ...(s[id] ?? EMPTY), [key]: v } }));

  function submit(e: FormEvent) {
    e.preventDefault();
    setOk(false);
    const changed = rows.filter((r) => {
      const v = values[r.variantId] ?? EMPTY;
      const s = saved[r.variantId] ?? EMPTY;
      return v.cost !== s.cost || v.margin !== s.margin;
    });
    const payload = changed.map((r) => {
      const v = values[r.variantId] ?? EMPTY;
      return { variantId: r.variantId, costUsdCents: read(v.cost), marginCents: read(v.margin) };
    });
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

  const errorMsg = errors.form ?? Object.values(errors)[0];
  const rateText = rate === null ? null : `R$ ${rate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const chips: [Filter, string, number][] = [['all', 'Todos', rows.length], ['on', 'Na vitrine', onCount], ['off', 'Fora da vitrine', rows.length - onCount]];

  return (
    <form className={c.page} onSubmit={submit} noValidate>
      <header className={c.intro}>
        <h1>Cálculo</h1>
        <p>Custo em dólar × cotação + margem = preço de venda. Sem custo ou margem, o produto fica fora da vitrine.</p>
      </header>

      <div className={c.stats}>
        <div className={c.rateCard}>
          <span className={c.rateLabel}>Dólar comercial (venda)</span>
          {rateText === null ? <strong className={c.rateMissing}>Cotação ainda não carregada</strong> : <strong className={c.rate}>{rateText}</strong>}
          {rateAt && <span className={c.rateAt}>Atualizado em {dateTime.format(new Date(rateAt))}</span>}
        </div>
        <div className={c.stat}><span>Na vitrine</span><strong>{onCount}</strong><i className={c.barOn} style={{ width: `${rows.length ? (onCount / rows.length) * 100 : 0}%` }} /></div>
        <div className={c.stat}><span>Fora da vitrine</span><strong>{rows.length - onCount}</strong></div>
        <div className={c.stat}><span>Alterações pendentes</span><strong className={pendingCount ? c.gold : undefined}>{pendingCount}</strong></div>
      </div>

      <section className={c.card}>
        <div className={c.tools}>
          <label className={c.search}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar produto..." aria-label="Buscar produto" />
          </label>
          <div className={c.chips} role="group" aria-label="Filtrar">
            {chips.map(([k, label, n]) => (
              <button key={k} type="button" className={filter === k ? c.chipOn : c.chip} aria-pressed={filter === k} onClick={() => setFilter(k)}>
                {label} <span>{n}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={c.tableWrap}>
          <table className={c.table}>
            <thead>
              <tr><th>Produto</th><th>Variação</th><th>Custo (US$)</th><th>Custo (R$)</th><th>Margem (R$)</th><th className={c.right}>Preço de venda (R$)</th></tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const { v, cost, margin, price, priced } = priceOf(r.variantId);
                const costBrl = cost && rate !== null ? formatBRL(priceCents(cost, rate, 0)) : '—';
                const name = `${r.productName} (${r.variantLabel})`;
                return (
                  <tr key={r.variantId} className={isDirty(r.variantId) ? c.changed : undefined}>
                    <td className={c.product}>{r.productName}</td>
                    <td><span className={c.variant}>{r.variantLabel}</span></td>
                    <td>
                      <span className={`${c.money} ${cost === undefined ? c.invalid : ''}`}>
                        <em>US$</em>
                        <input value={v.cost} onChange={(e) => set(r.variantId, 'cost', e.target.value)} inputMode="decimal"
                          placeholder="sem custo" aria-label={`Custo em dólar de ${name}`} aria-invalid={cost === undefined} />
                      </span>
                    </td>
                    <td>{costBrl}</td>
                    <td>
                      <span className={`${c.money} ${margin === undefined ? c.invalid : ''}`}>
                        <em>R$</em>
                        <input value={v.margin} onChange={(e) => set(r.variantId, 'margin', e.target.value)} inputMode="decimal"
                          placeholder="sem margem" aria-label={`Margem em reais de ${name}`} aria-invalid={margin === undefined} />
                      </span>
                    </td>
                    <td className={c.right}>{priced ? <b className={c.price}>{formatBRL(price)}</b> : <span className={c.offPill}>fora da vitrine</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visible.length === 0 && <p className={c.empty}>Nenhum produto encontrado.</p>}
        </div>
      </section>

      <div className={c.bar}>
        <span className={c.status} role="status">
          {errorMsg ? <span className={c.error} role="alert">{errorMsg}</span>
            : invalidCount ? <span className={c.error}>Valor inválido em {invalidCount} campo{invalidCount > 1 ? 's' : ''}. Use o formato 1.234,56.</span>
            : pendingCount ? <><i className={c.dotWarn} />{pendingCount} alteraç{pendingCount > 1 ? 'ões' : 'ão'} não salva{pendingCount > 1 ? 's' : ''}</>
            : ok ? <><i className={c.dotOk} />Tudo salvo</> : 'Nenhuma alteração'}
        </span>
        <button type="submit" className={c.save} disabled={pending}>{pending ? 'Salvando…' : 'Salvar alterações'}</button>
      </div>
    </form>
  );
}
