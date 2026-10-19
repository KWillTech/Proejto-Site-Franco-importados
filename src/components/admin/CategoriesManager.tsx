'use client';

import { useEffect, useState, useTransition, type FormEvent } from 'react';
import { deleteCategory, reorderCategories, saveCategory } from '@/app/admin/(painel)/categorias/actions';
import styles from '@/app/admin/admin.module.css';
import { buildTree, moveAmongSiblings } from '@/lib/categories';
import { ImageUploader } from './ImageUploader';
import cs from './CategoriesManager.module.css';

export type CategoryItem = {
  id: string; name: string; parentId: string | null; visible: boolean; homeCard: boolean; homeCardImage: string | null; homeCardTag: string | null;
};

const HOME_LIMIT = 3;
const blank = (parentId: string | null): CategoryItem =>
  ({ id: '', name: '', parentId, visible: true, homeCard: false, homeCardImage: null, homeCardTag: null });

/** Janela de edição/criação. `item.id` vazio = nova; `item.parentId` define se é subcategoria. */
function CategoryDialog({ item, roots, homeUsed, onClose }: {
  item: CategoryItem; roots: CategoryItem[]; homeUsed: number; onClose: () => void;
}) {
  const id = item.id || null;
  const isSub = !!item.parentId;
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [name, setName] = useState(item.name);
  const [parentId, setParentId] = useState(item.parentId ?? '');
  const [visible, setVisible] = useState(item.visible);
  const [homeCard, setHomeCard] = useState(item.homeCard);
  const [image, setImage] = useState(item.homeCardImage ?? '');
  const [tag, setTag] = useState(item.homeCardTag ?? '');
  const homeFull = !item.homeCard && homeUsed >= HOME_LIMIT;
  const parentName = roots.find((r) => r.id === item.parentId)?.name;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !pending) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, pending]);

  function submit(e: FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const r = await saveCategory(id, { name, parentId: isSub ? parentId : '', visible, homeCard, homeCardImage: image, homeCardTag: tag });
        if (r.ok) onClose(); else setErrors(r.errors);
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
        if (r.ok) onClose(); else setErrors(r.errors);
      } catch {
        setErrors({ form: 'Não foi possível excluir. Tente de novo.' });
      }
    });
  }

  const title = id
    ? `Editar ${isSub ? 'subcategoria' : 'categoria'}`
    : isSub ? `Nova subcategoria em ${parentName}` : 'Nova categoria';
  const err = (key: string) => errors[key] && <p className={styles.error} role="alert">{errors[key]}</p>;

  return (
    <div className={cs.backdrop} onMouseDown={(e) => { if (e.target === e.currentTarget && !pending) onClose(); }}>
      <div className={cs.dialog} role="dialog" aria-modal="true" aria-labelledby="cat-dialog-title">
        <div className={cs.dialogHead}>
          <h2 id="cat-dialog-title">{title}</h2>
          <button type="button" className={cs.close} onClick={onClose} disabled={pending} aria-label="Fechar">×</button>
        </div>
        <form className={styles.form} onSubmit={submit} noValidate>
          <label>
            Nome
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder={isSub ? 'Ex.: Celulares' : 'Ex.: Apple'} />
            {err('name')}
          </label>
          {isSub && id && (
            <label>
              Fica dentro de
              <select value={parentId} onChange={(e) => setParentId(e.target.value)}>
                {roots.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {err('parentId')}
            </label>
          )}
          {isSub && !id && err('parentId')}
          <label className={styles.check}>
            <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
            Aparece no menu da loja
          </label>
          {(!isSub || item.homeCard) && (
            <>
              <label className={styles.check}>
                <input type="checkbox" checked={homeCard} disabled={homeFull} onChange={(e) => setHomeCard(e.target.checked)} />
                Mostrar como cartão na página inicial
              </label>
              {homeFull && <p className={styles.hint}>Já há {HOME_LIMIT} cartões na página inicial. Desmarque um deles para usar este.</p>}
              {err('homeCard')}
              {homeCard && (
                <div className={cs.cardFields}>
                  <ImageUploader label="Imagem do cartão" single images={image ? [image] : []} onChange={(l) => setImage(l[0] ?? '')} />
                  {err('homeCardImage')}
                  <label>
                    Texto pequeno do cartão (opcional)
                    <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Ex.: ORIGINAIS · LACRADOS" />
                    <span className={styles.hint}>Não aparece quando a imagem é uma foto pronta (jpg, png ou webp).</span>
                  </label>
                </div>
              )}
            </>
          )}
          {err('form')}
          <div className={cs.dialogActions}>
            {id && <button type="button" className={`${styles.btn} ${styles.danger}`} disabled={pending} onClick={remove}>Excluir</button>}
            <span className={cs.spacer} />
            <button type="button" className={styles.btn} disabled={pending} onClick={onClose}>Cancelar</button>
            <button type="submit" className={`${styles.btn} ${styles.primary}`} disabled={pending}>{pending ? 'Salvando…' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CategoriesManager({ categories }: { categories: CategoryItem[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<CategoryItem | null>(null);

  const tree = buildTree(categories);
  const roots = categories.filter((c) => !c.parentId);
  const homeUsed = categories.filter((c) => c.homeCard).length;

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

  const arrows = (c: CategoryItem) => (
    <span className={cs.arrows}>
      <button type="button" disabled={pending || !moveAmongSiblings(categories, c.id, -1)} onClick={() => move(c.id, -1)} aria-label={`Subir ${c.name}`} title="Subir">▲</button>
      <button type="button" disabled={pending || !moveAmongSiblings(categories, c.id, 1)} onClick={() => move(c.id, 1)} aria-label={`Descer ${c.name}`} title="Descer">▼</button>
    </span>
  );
  const badges = (c: CategoryItem, parentHidden = false) => (
    <>
      {!c.visible && <span className={cs.badge}>Oculta</span>}
      {c.visible && parentHidden && <span className={cs.badge}>Oculta pela categoria</span>}
      {c.homeCard && <span className={`${cs.badge} ${cs.gold}`}>Cartão da home</span>}
    </>
  );

  return (
    <>
      <div className={cs.top}>
        <p className={styles.hint}>A ordem daqui é a ordem do menu da loja. Use as setas para mudar.</p>
        <span className={cs.counter}>Cartões na home: <strong>{homeUsed} de {HOME_LIMIT}</strong></span>
        <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={() => setEditing(blank(null))}>+ Nova categoria</button>
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}

      {tree.length === 0 && <p className={styles.hint}>Nenhuma categoria ainda. Comece por “+ Nova categoria”.</p>}
      <div className={cs.groups}>
        {tree.map((root) => {
          const { children, ...c } = root;
          return (
            <section key={c.id} className={cs.group} aria-label={c.name}>
              <div className={cs.groupHead}>
                {arrows(c)}
                <div className={cs.name}>
                  <strong>{c.name}</strong>
                  <span className={cs.count}>{children.length === 0 ? 'sem subcategorias' : `${children.length} subcategoria${children.length > 1 ? 's' : ''}`}</span>
                  {badges(c)}
                </div>
                <button type="button" className={styles.btn} onClick={() => setEditing(blank(c.id))}>+ Subcategoria</button>
                <button type="button" className={styles.btn} onClick={() => setEditing(c)} aria-label={`Editar ${c.name}`}>Editar</button>
              </div>
              {children.length > 0 && (
                <ul className={cs.subs}>
                  {children.map((s) => (
                    <li key={s.id} className={cs.sub}>
                      {arrows(s)}
                      <div className={cs.name}>
                        <span>{s.name}</span>
                        {badges(s, !c.visible)}
                      </div>
                      <button type="button" className={cs.link} onClick={() => setEditing(s)} aria-label={`Editar ${s.name}`}>Editar</button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      {editing && (
        <CategoryDialog key={editing.id || `new-${editing.parentId}`} item={editing} roots={roots} homeUsed={homeUsed} onClose={() => setEditing(null)} />
      )}
    </>
  );
}
