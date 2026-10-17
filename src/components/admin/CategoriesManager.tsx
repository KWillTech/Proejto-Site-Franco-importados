'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { deleteCategory, reorderCategories, saveCategory } from '@/app/admin/(painel)/categorias/actions';
import styles from '@/app/admin/admin.module.css';
import { buildTree, moveAmongSiblings } from '@/lib/categories';
import { ImageUploader } from './ImageUploader';

export type CategoryItem = {
  id: string; name: string; parentId: string | null; visible: boolean; homeCard: boolean; homeCardImage: string | null; homeCardTag: string | null;
};

const EMPTY: CategoryItem = { id: '', name: '', parentId: null, visible: true, homeCard: false, homeCardImage: null, homeCardTag: null };

function CategoryForm({ item, all, sub }: { item: CategoryItem; all: CategoryItem[]; sub: boolean }) {
  const id = item.id || null;
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState(item.name);
  const [parentId, setParentId] = useState(item.parentId ?? '');
  const [visible, setVisible] = useState(item.visible);
  const [homeCard, setHomeCard] = useState(item.homeCard);
  const [image, setImage] = useState(item.homeCardImage ?? '');
  const [tag, setTag] = useState(item.homeCardTag ?? '');

  function submit(e: FormEvent) {
    e.preventDefault();
    setSaved(false);
    if (sub && !parentId) { setErrors({ parentId: 'Escolha a categoria.' }); return; }
    startTransition(async () => {
      try {
        const r = await saveCategory(id, { name, parentId, visible, homeCard, homeCardImage: image, homeCardTag: tag });
        setErrors(r.ok ? {} : r.errors);
        setSaved(r.ok);
        if (r.ok && !id) {
          setName(''); setParentId(''); setVisible(true); setHomeCard(false); setImage(''); setTag('');
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
      {sub && (
        <label>
          Categoria
          <select value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">Escolha…</option>
            {all.filter((c) => !c.parentId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {err('parentId')}
        </label>
      )}
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

  function move(id: string, dir: -1 | 1) {
    const ids = moveAmongSiblings(categories, id, dir);
    if (!ids) return;
    startTransition(async () => {
      try {
        const r = await reorderCategories(ids);
        setError(r.ok ? null : r.errors.form);
      } catch {
        setError('Não foi possível reordenar. Tente de novo.');
      }
    });
  }

  const rows = buildTree(categories).flatMap((c) => [c, ...c.children.map((k) => ({ ...k, child: true as const, parentHidden: !c.visible }))]);

  return (
    <>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <ul className={styles.list}>
        {rows.map((c) => (
          <li className={styles.panel} key={c.id} style={'child' in c ? { marginLeft: 24 } : undefined}>
            <div className={styles.panelHead}>
              <div className={styles.info}>
                <strong>{c.name}</strong>
                <span className={styles.muted}>
                  {c.visible ? 'No menu' : 'Oculta'}{'parentHidden' in c && c.parentHidden && ' · oculta pela categoria mãe'}{c.homeCard && ' · Cartão da home'}
                </span>
              </div>
              <div className={styles.imgActions}>
                <button type="button" className={styles.btn} disabled={pending || !moveAmongSiblings(categories, c.id, -1)} onClick={() => move(c.id, -1)} aria-label={`Subir ${c.name}`}>↑</button>
                <button type="button" className={styles.btn} disabled={pending || !moveAmongSiblings(categories, c.id, 1)} onClick={() => move(c.id, 1)} aria-label={`Descer ${c.name}`}>↓</button>
              </div>
            </div>
            <details>
              <summary>Editar</summary>
              <CategoryForm item={c} all={categories} sub={!!c.parentId} />
            </details>
          </li>
        ))}
      </ul>
      <details className={styles.panel}>
        <summary><strong>Nova categoria</strong></summary>
        <CategoryForm item={EMPTY} all={categories} sub={false} />
      </details>
      <details className={styles.panel}>
        <summary><strong>Nova subcategoria</strong></summary>
        <CategoryForm item={EMPTY} all={categories} sub />
      </details>
    </>
  );
}
