'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { deleteProduct, saveProduct } from '@/app/admin/(painel)/produtos/actions';
import styles from '@/app/admin/admin.module.css';
import { parseMoney, type ProductInput } from '@/lib/validation';
import { ImageUploader } from './ImageUploader';
import { VariantsEditor, firstError, newRow, type VariantRow } from './VariantsEditor';

type Props = { id: string | null; categories: Array<{ id: string; name: string }>; initial: ProductInput | null };

const toMoney = (cents: number) => (cents / 100).toFixed(2).replace('.', ',');
// Vazio vira null (campo opcional); texto inválido vira NaN e o productSchema recusa com mensagem.
const toNumber = (s: string) => (s.trim() === '' ? null : Number(s.replace(',', '.')));

export function ProductForm({ id, categories, initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [name, setName] = useState(initial?.name ?? '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [badge, setBadge] = useState(initial?.badge ?? '');
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [available, setAvailable] = useState(initial?.available ?? true);
  const [pix, setPix] = useState(initial?.pixPercent?.toString().replace('.', ',') ?? '');
  const [installments, setInstallments] = useState(initial?.installments?.toString() ?? '');
  const [optionNames, setOptionNames] = useState(initial?.optionNames ?? []);
  const [rows, setRows] = useState<VariantRow[]>(() =>
    initial?.variants.map((v) => ({
      key: v.id ?? crypto.randomUUID(), id: v.id, optionValues: v.optionValues,
      retail: toMoney(v.retailCents), wholesale: toMoney(v.wholesaleCents), available: v.available,
    })) ?? [newRow(0)],
  );
  const [images, setImages] = useState(initial?.images ?? []);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = {
      name, categoryId, description, badge: badge || null, featured, available,
      pixPercent: toNumber(pix), installments: toNumber(installments), optionNames, images,
      variants: rows.map((r) => ({
        id: r.id, optionValues: r.optionValues, available: r.available,
        retailCents: parseMoney(r.retail), wholesaleCents: parseMoney(r.wholesale),
      })),
    };
    startTransition(async () => {
      try {
        const result = await saveProduct(id, input);
        if (result.ok) router.push('/admin/produtos');
        else setErrors(result.errors);
      } catch {
        setErrors({ form: 'Não foi possível salvar. Tente de novo.' });
      }
    });
  }

  function remove() {
    if (!id || !window.confirm(`Excluir "${initial?.name}"? Esta ação não pode ser desfeita.`)) return;
    startTransition(async () => {
      try {
        await deleteProduct(id);
        router.push('/admin/produtos');
      } catch {
        setErrors({ form: 'Não foi possível excluir. Tente de novo.' });
      }
    });
  }

  const fieldError = (key: string) => errors[key] && <p className={styles.error} role="alert">{errors[key]}</p>;
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <label>
        Nome
        <input value={name} onChange={(e) => setName(e.target.value)} />
        {fieldError('name')}
      </label>
      <label>
        Categoria
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Escolha…</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {fieldError('categoryId')}
      </label>
      <label>
        Descrição
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        {fieldError('description')}
      </label>
      <div className={styles.row}>
        <label>
          Selo (opcional)
          <input value={badge} placeholder="Ex.: FRETE GRÁTIS" onChange={(e) => setBadge(e.target.value)} />
          {fieldError('badge')}
        </label>
        <label>
          Desconto no Pix (%)
          <input inputMode="decimal" placeholder="Sem desconto" value={pix} onChange={(e) => setPix(e.target.value)} />
          {fieldError('pixPercent')}
        </label>
        <label>
          Parcelas no cartão
          <input inputMode="numeric" placeholder="Sem parcelamento" value={installments} onChange={(e) => setInstallments(e.target.value)} />
          {fieldError('installments')}
        </label>
      </div>
      <div className={styles.toggles}>
        <label className={styles.check}>
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
          Destaque (aparece em Lançamentos)
        </label>
        <label className={styles.check}>
          <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} />
          Disponível
        </label>
      </div>
      <VariantsEditor
        optionNames={optionNames}
        rows={rows}
        errors={errors}
        onChange={(names, next) => { setOptionNames(names); setRows(next); }}
      />
      <ImageUploader images={images} onChange={setImages} />
      {firstError(errors, 'images') && <p className={styles.error} role="alert">{firstError(errors, 'images')}</p>}
      {hasErrors && (
        <p className={styles.error} role="alert">{errors.form ?? 'Revise os campos destacados.'}</p>
      )}
      <div className={styles.actions}>
        <button className={styles.submit} type="submit" disabled={pending}>
          {pending ? 'Salvando…' : 'Salvar produto'}
        </button>
        {id && (
          <button type="button" className={`${styles.btn} ${styles.danger}`} disabled={pending} onClick={remove}>
            Excluir produto
          </button>
        )}
      </div>
    </form>
  );
}
