'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { deleteProduct, saveProduct } from '@/app/admin/(painel)/produtos/actions';
import { splitCategory } from '@/lib/categories';
import type { ProductInput } from '@/lib/validation';
import { ImageUploader } from './ImageUploader';
import f from './ProductForm.module.css';
import { VariantsEditor, firstError, newRow, type VariantRow } from './VariantsEditor';

type Props = { id: string | null; categories: Array<{ id: string; name: string; parentId: string | null }>; initial: ProductInput | null };

// Vazio vira null (campo opcional); texto inválido vira NaN e o productSchema recusa com mensagem.
const toNumber = (s: string) => (s.trim() === '' ? null : Number(s.replace(',', '.')));

export function ProductForm({ id, categories, initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [name, setName] = useState(initial?.name ?? '');
  const start = splitCategory(categories, initial?.categoryId ?? '');
  const [categoryId, setCategoryId] = useState(start.categoryId);
  const [subId, setSubId] = useState(start.subId);
  const [description, setDescription] = useState(initial?.description ?? '');
  const [badge, setBadge] = useState(initial?.badge ?? '');
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [available, setAvailable] = useState(initial?.available ?? true);
  const [pix, setPix] = useState(initial?.pixPercent?.toString().replace('.', ',') ?? '');
  const [installments, setInstallments] = useState(initial?.installments?.toString() ?? '');
  const [optionNames, setOptionNames] = useState(initial?.optionNames ?? []);
  const [rows, setRows] = useState<VariantRow[]>(() =>
    initial?.variants.map((v) => ({
      key: v.id ?? crypto.randomUUID(), id: v.id, optionValues: v.optionValues, available: v.available,
    })) ?? [newRow(0)],
  );
  const [images, setImages] = useState(initial?.images ?? []);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = {
      name, categoryId: subId || categoryId, description, badge: badge || null, featured, available,
      pixPercent: toNumber(pix), installments: toNumber(installments), optionNames, images,
      variants: rows.map((r) => ({ id: r.id, optionValues: r.optionValues, available: r.available })),
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

  const fieldError = (key: string) => errors[key] && <span className={f.error} role="alert">{errors[key]}</span>;
  const subs = categories.filter((c) => c.parentId === categoryId);
  const hasErrors = Object.keys(errors).length > 0;
  const catName = categories.find((c) => c.id === (subId || categoryId))?.name;
  const parentName = subId ? categories.find((c) => c.id === categoryId)?.name : null;

  return (
    <form className={f.page} onSubmit={submit} noValidate>
      <header className={f.intro}>
        <Link className={f.back} href="/admin/produtos">← Produtos</Link>
        <h1>{id ? 'Editar produto' : 'Novo produto'}</h1>
        <p>{id ? 'Altere os dados e salve. O preço de venda é calculado na aba Cálculo.' : 'Preencha os dados do produto. Depois defina custo e margem na aba Cálculo.'}</p>
      </header>

      <div className={f.layout}>
        <div className={f.main}>
          <section className={f.card}>
            <div className={f.cardHead}>
              <span className={f.step}>01</span>
              <div><h2>Informações</h2><p>Nome, onde o produto aparece na loja e a descrição.</p></div>
            </div>
            <div className={f.grid}>
              <label className={`${f.field} ${f.wide}`}>
                <span className={f.label}>Nome</span>
                <input className={`${f.input} ${errors.name ? f.invalid : ''}`} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Afnan 9PM Eau de Parfum 100ml" />
                {fieldError('name')}
              </label>
              <label className={f.field}>
                <span className={f.label}>Categoria</span>
                <select className={`${f.input} ${errors.categoryId ? f.invalid : ''}`} value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setSubId(''); }}>
                  <option value="">Escolha…</option>
                  {categories.filter((c) => !c.parentId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {fieldError('categoryId')}
              </label>
              <label className={f.field}>
                <span className={f.label}>Subcategoria</span>
                <select className={f.input} value={subId} onChange={(e) => setSubId(e.target.value)} disabled={subs.length === 0}>
                  <option value="">{subs.length === 0 ? '— esta categoria não tem' : '— nenhuma'}</option>
                  {subs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className={`${f.field} ${f.wide}`}>
                <span className={f.label}>Descrição</span>
                <textarea className={`${f.input} ${f.textarea} ${errors.description ? f.invalid : ''}`} value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Conte como é o produto: notas, uso, diferenciais…" />
                {fieldError('description')}
              </label>
            </div>
          </section>

          <section className={f.card}>
            <div className={f.cardHead}>
              <span className={f.step}>02</span>
              <div><h2>Variações</h2><p>Opções como Cor ou Armazenamento (até 3), uma linha por combinação. Sem opções, o produto tem uma única variação.</p></div>
            </div>
            <VariantsEditor
              optionNames={optionNames}
              rows={rows}
              errors={errors}
              onChange={(names, next) => { setOptionNames(names); setRows(next); }}
            />
          </section>

          <section className={f.card}>
            <div className={f.cardHead}>
              <span className={f.step}>03</span>
              <div><h2>Fotos</h2><p>A primeira foto é a capa na vitrine.</p></div>
            </div>
            <div className={f.uploader}>
              <ImageUploader images={images} onChange={setImages} />
            </div>
            {firstError(errors, 'images') && <span className={f.error} role="alert">{firstError(errors, 'images')}</span>}
          </section>
        </div>

        <aside className={f.side}>
          <section className={`${f.card} ${f.previewCard}`}>
            <div className={f.previewImg}>
              {images[0]
                // eslint-disable-next-line @next/next/no-img-element -- fotos do Storage ou SVG de /placeholders
                ? <img src={images[0]} alt="" />
                : <span>sem foto</span>}
              {badge.trim() && <em className={f.previewBadge}>{badge}</em>}
            </div>
            <strong className={f.previewName}>{name.trim() || 'Nome do produto'}</strong>
            <span className={f.previewCat}>{catName ? (parentName ? `${parentName} › ${catName}` : catName) : 'Sem categoria'}</span>
          </section>

          <section className={f.card}>
            <h3 className={f.sideTitle}>Publicação</h3>
            <label className={f.switchRow}>
              <input type="checkbox" className={f.switch} checked={available} onChange={(e) => setAvailable(e.target.checked)} aria-label="Disponível" />
              <span><strong>Disponível</strong><small>Aparece na loja e pode ser pedido.</small></span>
            </label>
            <label className={f.switchRow}>
              <input type="checkbox" className={f.switch} checked={featured} onChange={(e) => setFeatured(e.target.checked)} aria-label="Destaque (aparece em Lançamentos)" />
              <span><strong>Destaque</strong><small>Aparece em Lançamentos na página inicial.</small></span>
            </label>
          </section>

          <section className={f.card}>
            <h3 className={f.sideTitle}>Venda</h3>
            <div className={f.stack}>
              <label className={f.field}>
                <span className={f.label}>Selo (opcional)</span>
                <input className={`${f.input} ${errors.badge ? f.invalid : ''}`} value={badge} placeholder="Ex.: FRETE GRÁTIS" onChange={(e) => setBadge(e.target.value)} />
                {fieldError('badge')}
              </label>
              <label className={f.field}>
                <span className={f.label}>Desconto no Pix</span>
                <span className={`${f.affix} ${errors.pixPercent ? f.invalid : ''}`}>
                  <input inputMode="decimal" placeholder="Sem desconto" value={pix} onChange={(e) => setPix(e.target.value)} aria-label="Desconto no Pix (%)" />
                  <em>%</em>
                </span>
                {fieldError('pixPercent')}
              </label>
              <label className={f.field}>
                <span className={f.label}>Parcelas no cartão</span>
                <span className={`${f.affix} ${errors.installments ? f.invalid : ''}`}>
                  <input inputMode="numeric" placeholder="Sem parcelamento" value={installments} onChange={(e) => setInstallments(e.target.value)} aria-label="Parcelas no cartão" />
                  <em>×</em>
                </span>
                {fieldError('installments')}
              </label>
            </div>
          </section>
        </aside>
      </div>

      <div className={f.bar}>
        <span className={f.status} role={hasErrors ? 'alert' : 'status'}>
          {hasErrors ? <span className={f.barError}>{errors.form ?? 'Revise os campos destacados.'}</span> : id ? 'Editando produto' : 'Novo produto'}
        </span>
        <div className={f.barActions}>
          {id && (
            <button type="button" className={f.danger} disabled={pending} onClick={remove}>Excluir produto</button>
          )}
          <button className={f.save} type="submit" disabled={pending}>{pending ? 'Salvando…' : 'Salvar produto'}</button>
        </div>
      </div>
    </form>
  );
}
