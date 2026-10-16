'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { deleteCategory, reorderCategories, saveCategory } from '@/app/admin/(painel)/categorias/actions';
import styles from '@/app/admin/admin.module.css';
import { ImageUploader } from './ImageUploader';

export type CategoryItem = {
  id: string; name: string; visible: boolean; homeCard: boolean; homeCardImage: string | null; homeCardTag: string | null;
};

const EMPTY: CategoryItem = { id: '', name: '', visible: true, homeCard: false, homeCardImage: null, homeCardTag: null };

function CategoryForm({ item }: { item: CategoryItem }) {
  const id = item.id || null;
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState(item.name);
  const [visible, setVisible] = useState(item.visible);
  const [homeCard, setHomeCard] = useState(item.homeCard);
  const [image, setImage] = useState(item.homeCardImage ?? '');
  const [tag, setTag] = useState(item.homeCardTag ?? '');

  function submit(e: FormEvent) {
    e.preventDefault();
    setSaved(false);
    startTransition(async () => {
      try {
        const r = await saveCategory(id, { name, visible, homeCard, homeCardImage: image, homeCardTag: tag });
        setErrors(r.ok ? {} : r.errors);
        setSaved(r.ok);
        if (r.ok && !id) {
          setName(''); setVisible(true); setHomeCard(false); setImage(''); setTag('');
        }
      } catch {
        setErrors({ form: 'Não foi possível salvar. Tente de novo.' });
      }
    });
  }

  function remove() {
    if (!id || !window.confirm(`Excluir "${item.name}"? Esta ação não pode ser desfeita.`)) return;
    startTransition(async () => {
      try {
        const r = await deleteCategory(id);
        if (!r.ok) setErrors(r.errors);
      } catch {
        setErrors({ form: 'Não foi possível excluir. Tente de novo.' });
      }
    });
  }

  const err = (key: string) => errors[key] && <p className={styles.error} role="alert">{errors[key]}</p>;
  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <label>
        Nome
        <input value={name} onChange={(e) => setName(e.target.value)} />
        {err('name')}
      </label>
      <label className={styles.check}>
        <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
        Mostrar no menu
      </label>
      <label className={styles.check}>
        <input type="checkbox" checked={homeCard} onChange={(e) => setHomeCard(e.target.checked)} />
        Mostrar como cartão na home
      </label>
      {err('homeCard')}
      {homeCard && (
        <>
          <ImageUploader label="Imagem do cartão" single images={image ? [image] : []} onChange={(l) => setImage(l[0] ?? '')} />
          {err('homeCardImage')}
          <label>
            Tag do cartão (opcional)
            <input value={tag} onChange={(e) => setTag(e.target.value)} />
          </label>
        </>
      )}
      {err('form')}
      {saved && <p className={styles.hint} role="status">Salvo.</p>}
      <div className={styles.actions}>
        <button type="submit" className={`${styles.btn} ${styles.primary}`} disabled={pending}>{pending ? 'Salvando…' : 'Salvar'}</button>
        {id && <button type="button" className={`${styles.btn} ${styles.danger}`} disabled={pending} onClick={remove}>Excluir</button>}
      </div>
    </form>
  );
}

export function CategoriesManager({ categories }: { categories: CategoryItem[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function move(i: number, to: number) {
    const ids = categories.map((c) => c.id);
    [ids[i], ids[to]] = [ids[to], ids[i]];
    startTransition(async () => {
      try {
        const r = await reorderCategories(ids);
        setError(r.ok ? null : r.errors.form);
      } catch {
        setError('Não foi possível reordenar. Tente de novo.');
      }
    });
  }

  return (
    <>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <ul className={styles.list}>
        {categories.map((c, i) => (
          <li className={styles.panel} key={c.id}>
            <div className={styles.panelHead}>
              <div className={styles.info}>
                <strong>{c.name}</strong>
                <span className={styles.muted}>
                  {c.visible ? 'No menu' : 'Oculta'}{c.homeCard && ' · Cartão da home'}
                </span>
              </div>
              <div className={styles.imgActions}>
                <button type="button" className={styles.btn} disabled={pending || i === 0} onClick={() => move(i, i - 1)} aria-label={`Subir ${c.name}`}>↑</button>
                <button type="button" className={styles.btn} disabled={pending || i === categories.length - 1} onClick={() => move(i, i + 1)} aria-label={`Descer ${c.name}`}>↓</button>
              </div>
            </div>
            <details>
              <summary>Editar</summary>
              <CategoryForm item={c} />
            </details>
          </li>
        ))}
      </ul>
      <details className={styles.panel}>
        <summary><strong>Nova categoria</strong></summary>
        <CategoryForm item={EMPTY} />
      </details>
    </>
  );
}
