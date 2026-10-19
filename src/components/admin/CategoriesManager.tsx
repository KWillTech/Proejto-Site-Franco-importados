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
  const err = (key: string) => errors[key] && <span className={cs.error} role="alert">{errors[key]}</span>;

  return (
    <div className={cs.backdrop} onMouseDown={(e) => { if (e.target === e.currentTarget && !pending) onClose(); }}>
      <div className={cs.dialog} role="dialog" aria-modal="true" aria-labelledby="cat-dialog-title">
        <div className={cs.dialogHead}>
          <div>
            <h2 id="cat-dialog-title">{title}</h2>
            <p>{isSub ? 'Subcategorias aparecem dentro da categoria no menu da loja.' : 'Categorias principais aparecem no menu da loja, nesta ordem.'}</p>
          </div>
          <button type="button" className={cs.close} onClick={onClose} disabled={pending} aria-label="Fechar">×</button>
        </div>
        <form className={cs.form} onSubmit={submit} noValidate>
          <div className={isSub && id ? cs.fields2 : cs.fields}>
            <label className={cs.field}>
              <span className={cs.label}>Nome</span>
              <input className={cs.input} value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder={isSub ? 'Ex.: Celulares' : 'Ex.: Apple'} />
              {err('name')}
            </label>
            {isSub && id && (
              <label className={cs.field}>
                <span className={cs.label}>Fica dentro de</span>
                <select className={cs.input} value={parentId} onChange={(e) => setParentId(e.target.value)}>
                  {roots.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {err('parentId')}
              </label>
            )}
          </div>
          {isSub && !id && err('parentId')}
          <label className={cs.switchRow}>
            <input type="checkbox" className={cs.switch} checked={visible} onChange={(e) => setVisible(e.target.checked)} />
            <span><strong>Aparece no menu da loja</strong><small>Desligado, a categoria some do menu, mas os produtos continuam salvos.</small></span>
          </label>
          {(!isSub || item.homeCard) && (
            <>
              <label className={`${cs.switchRow} ${homeFull ? cs.disabled : ''}`}>
                <input type="checkbox" className={cs.switch} checked={homeCard} disabled={homeFull} onChange={(e) => setHomeCard(e.target.checked)}
                  aria-label="Mostrar como cartão na página inicial" />
                <span><strong>Mostrar como cartão na página inicial</strong>
                  <small>{homeFull ? `Já há ${HOME_LIMIT} cartões. Desligue um deles para usar este.` : `Até ${HOME_LIMIT} categorias aparecem como cartão.`}</small></span>
              </label>
              {err('homeCard')}
              {homeCard && (
                <div className={cs.cardFields}>
                  <ImageUploader label="Imagem do cartão" single images={image ? [image] : []} onChange={(l) => setImage(l[0] ?? '')} />
                  {err('homeCardImage')}
                  <label className={cs.field}>
                    <span className={cs.label}>Texto pequeno do cartão (opcional)</span>
                    <input className={cs.input} value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Ex.: ORIGINAIS · LACRADOS" />
                    <span className={cs.hint}>Não aparece quando a imagem é uma foto pronta (jpg, png ou webp).</span>
                  </label>
                </div>
              )}
            </>
          )}
          {errors.form && <p className={cs.formError} role="alert">{errors.form}</p>}
          <div className={cs.dialogActions}>
            {id && <button type="button" className={`${styles.btn} ${styles.danger}`} disabled={pending} onClick={remove}>Excluir</button>}
            <span className={cs.spacer} />
            <button type="button" className={styles.btn} disabled={pending} onClick={onClose}>Cancelar</button>
            <button type="submit" className={cs.primary} disabled={pending}>{pending ? 'Salvando…' : 'Salvar'}</button>
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
      {!c.visible && <span className={cs.badge}>Oculta no menu</span>}
      {c.visible && parentHidden && <span className={cs.badge}>Oculta pela categoria</span>}
      {c.homeCard && <span className={`${cs.badge} ${cs.gold}`}>Cartão da home</span>}
    </>
  );

  return (
    <div className={cs.page}>
      <header className={cs.intro}>
        <div>
          <h1>Categorias</h1>
          <p>A ordem daqui é a ordem do menu da loja. Use as setas para mudar.</p>
        </div>
        <div className={cs.introSide}>
          <span className={cs.counter}><i className={homeUsed >= HOME_LIMIT ? cs.dotFull : cs.dotOk} />Cartões na home: <strong>{homeUsed} de {HOME_LIMIT}</strong></span>
          <button type="button" className={cs.primary} onClick={() => setEditing(blank(null))}>+ Nova categoria</button>
        </div>
      </header>
      {error && <p className={cs.formError} role="alert">{error}</p>}

      {tree.length === 0 && (
        <button type="button" className={cs.emptyCard} onClick={() => setEditing(blank(null))}>
          <strong>Nenhuma categoria ainda</strong><span>Clique para criar a primeira.</span>
        </button>
      )}
      <div className={cs.groups}>
        {tree.map((root, gi) => {
          const { children, ...c } = root;
          return (
            <section key={c.id} className={`${cs.group} ${c.visible ? '' : cs.hidden}`} aria-label={c.name}>
              <div className={cs.groupHead}>
                {arrows(c)}
                <span className={cs.pos}>{String(gi + 1).padStart(2, '0')}</span>
                <div className={cs.name}>
                  <strong>{c.name}</strong>
                  <span className={cs.count}>{children.length === 0 ? 'sem subcategorias' : `${children.length} subcategoria${children.length > 1 ? 's' : ''}`}</span>
                  {badges(c)}
                </div>
                <button type="button" className={cs.ghost} onClick={() => setEditing(blank(c.id))}>+ Subcategoria</button>
                <button type="button" className={styles.btn} onClick={() => setEditing(c)} aria-label={`Editar ${c.name}`}>Editar</button>
              </div>
              {children.length > 0 && (
                <ul className={cs.subs}>
                  {children.map((sub) => (
                    <li key={sub.id} className={`${cs.sub} ${sub.visible ? '' : cs.hidden}`}>
                      {arrows(sub)}
                      <span className={cs.bullet} aria-hidden="true" />
                      <div className={cs.name}>
                        <span>{sub.name}</span>
                        {badges(sub, !c.visible)}
                      </div>
                      <button type="button" className={cs.link} onClick={() => setEditing(sub)} aria-label={`Editar ${sub.name}`}>Editar</button>
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
    </div>
  );
}
