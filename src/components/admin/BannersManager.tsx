'use client';

import { useEffect, useState, useTransition, type FormEvent } from 'react';
import { deleteBanner, reorderBanners, saveBanner } from '@/app/admin/(painel)/banners/actions';
import styles from '@/app/admin/admin.module.css';
import { ImageUploader } from './ImageUploader';
import b from './BannersManager.module.css';

export type BannerItem = { id: string; imageDesktop: string; imageMobile: string; alt: string; link: string | null; active: boolean };

const EMPTY: BannerItem = { id: '', imageDesktop: '', imageMobile: '', alt: '', link: null, active: true };
const toInput = (x: BannerItem) => ({ imageDesktop: x.imageDesktop, imageMobile: x.imageMobile, alt: x.alt, link: x.link ?? '', active: x.active });

function BannerDialog({ item, onClose }: { item: BannerItem; onClose: () => void }) {
  const id = item.id || null;
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [desktop, setDesktop] = useState(item.imageDesktop);
  const [mobile, setMobile] = useState(item.imageMobile);
  const [alt, setAlt] = useState(item.alt);
  const [link, setLink] = useState(item.link ?? '');
  const [active, setActive] = useState(item.active);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !pending) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, pending]);

  function submit(e: FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const r = await saveBanner(id, { imageDesktop: desktop, imageMobile: mobile, alt, link, active });
        if (r.ok) onClose(); else setErrors(r.errors);
      } catch {
        setErrors({ form: 'Não foi possível salvar. Tente de novo.' });
      }
    });
  }

  function remove() {
    if (!id || !window.confirm('Excluir este banner? Esta ação não pode ser desfeita.')) return;
    startTransition(async () => {
      try {
        const r = await deleteBanner(id);
        if (r.ok) onClose(); else setErrors(r.errors);
      } catch {
        setErrors({ form: 'Não foi possível excluir. Tente de novo.' });
      }
    });
  }

  const err = (key: string) => errors[key] && <span className={b.error} role="alert">{errors[key]}</span>;
  return (
    <div className={b.backdrop} onMouseDown={(e) => { if (e.target === e.currentTarget && !pending) onClose(); }}>
      <div className={b.dialog} role="dialog" aria-modal="true" aria-labelledby="banner-dialog-title">
        <div className={b.dialogHead}>
          <div>
            <h2 id="banner-dialog-title">{id ? 'Editar banner' : 'Novo banner'}</h2>
            <p>Computador: 1425 × 540 px. Celular: quadrada (800 × 800 px).</p>
          </div>
          <button type="button" className={b.close} onClick={onClose} disabled={pending} aria-label="Fechar">×</button>
        </div>
        <form onSubmit={submit} noValidate>
          <div className={b.uploads}>
            <div className={b.upload}>
              <ImageUploader label="Imagem para computador" single images={desktop ? [desktop] : []} onChange={(l) => setDesktop(l[0] ?? '')} />
              {err('imageDesktop')}
            </div>
            <div className={b.upload}>
              <ImageUploader label="Imagem para celular" single images={mobile ? [mobile] : []} onChange={(l) => setMobile(l[0] ?? '')} />
              {err('imageMobile')}
            </div>
          </div>
          <div className={b.fields}>
            <label className={b.field}>
              <span className={b.label}>Nome do banner</span>
              <input className={b.input} value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Ex.: iPhone 18" />
              <span className={b.hint}>Aparece nesta lista e descreve a imagem para leitores de tela.</span>
            </label>
            <label className={b.field}>
              <span className={b.label}>Link ao clicar (opcional)</span>
              <input className={b.input} value={link} onChange={(e) => setLink(e.target.value)} placeholder="/categoria/apple ou https://…" />
              {errors.link ? err('link') : <span className={b.hint}>Para onde o cliente vai ao clicar no banner.</span>}
            </label>
          </div>
          <label className={b.switchRow}>
            <input type="checkbox" className={b.switch} checked={active} onChange={(e) => setActive(e.target.checked)} />
            <span><strong>Ativo</strong> — aparece no topo da página inicial</span>
          </label>
          {errors.form && <p className={b.formError} role="alert">{errors.form}</p>}
          <div className={b.dialogActions}>
            {id && <button type="button" className={`${styles.btn} ${styles.danger}`} disabled={pending} onClick={remove}>Excluir</button>}
            <span className={b.spacer} />
            <button type="button" className={styles.btn} disabled={pending} onClick={onClose}>Cancelar</button>
            <button type="submit" className={b.save} disabled={pending}>{pending ? 'Salvando…' : 'Salvar banner'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function BannersManager({ banners }: { banners: BannerItem[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<BannerItem | null>(null);
  const activeCount = banners.filter((x) => x.active).length;

  const run = (fn: () => Promise<{ ok: boolean; errors?: Record<string, string> }>, fallback: string) =>
    startTransition(async () => {
      try {
        const r = await fn();
        setError(r.ok ? null : (r.errors?.form ?? Object.values(r.errors ?? {})[0] ?? fallback));
      } catch {
        setError(fallback);
      }
    });

  function move(i: number, to: number) {
    const ids = banners.map((x) => x.id);
    [ids[i], ids[to]] = [ids[to], ids[i]];
    run(() => reorderBanners(ids), 'Não foi possível reordenar. Tente de novo.');
  }
  const toggle = (x: BannerItem) =>
    run(() => saveBanner(x.id, { ...toInput(x), active: !x.active }), 'Não foi possível salvar. Tente de novo.');

  return (
    <div className={b.page}>
      <header className={b.intro}>
        <div>
          <h1>Banners</h1>
          <p>Os banners ativos passam em sequência no topo da página inicial, nesta ordem.</p>
        </div>
        <div className={b.introSide}>
          <span className={b.counter}><i className={activeCount ? b.dotOk : b.dotOff} />{activeCount} de {banners.length} ativos</span>
          <button type="button" className={b.save} onClick={() => setEditing(EMPTY)}>+ Novo banner</button>
        </div>
      </header>

      {banners.length > 0 && activeCount === 0 && (
        <p className={b.warn}>Nenhum banner ativo: a página inicial fica sem o carrossel.</p>
      )}
      {error && <p className={b.formError} role="alert">{error}</p>}

      {banners.length === 0 ? (
        <button type="button" className={b.emptyCard} onClick={() => setEditing(EMPTY)}>
          <strong>Nenhum banner ainda</strong>
          <span>Clique para criar o primeiro.</span>
        </button>
      ) : (
        <ol className={b.list}>
          {banners.map((x, i) => {
            const name = x.alt || `Banner ${i + 1}`;
            return (
              <li key={x.id} className={`${b.card} ${x.active ? '' : b.inactive}`}>
                <span className={b.pos}>{String(i + 1).padStart(2, '0')}</span>
                <div className={b.previews}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- imagens do Storage ou SVG de /placeholders */}
                  <img className={b.desk} src={x.imageDesktop} alt="" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className={b.mob} src={x.imageMobile} alt="" />
                </div>
                <div className={b.info}>
                  <strong>{name}</strong>
                  <span className={x.active ? b.pillOn : b.pillOff}>{x.active ? 'Ativo' : 'Inativo'}</span>
                  <span className={b.link}>{x.link ? <>Leva para <code>{x.link}</code></> : 'Sem link'}</span>
                </div>
                <div className={b.actions}>
                  <label className={b.quick} title={x.active ? 'Desativar' : 'Ativar'}>
                    <input type="checkbox" className={b.switch} checked={x.active} disabled={pending} onChange={() => toggle(x)}
                      aria-label={`${x.active ? 'Desativar' : 'Ativar'} ${name}`} />
                  </label>
                  <span className={b.arrows}>
                    <button type="button" disabled={pending || i === 0} onClick={() => move(i, i - 1)} aria-label={`Subir banner ${i + 1}`} title="Subir">▲</button>
                    <button type="button" disabled={pending || i === banners.length - 1} onClick={() => move(i, i + 1)} aria-label={`Descer banner ${i + 1}`} title="Descer">▼</button>
                  </span>
                  <button type="button" className={styles.btn} onClick={() => setEditing(x)} aria-label={`Editar ${name}`}>Editar</button>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {editing && <BannerDialog key={editing.id || 'new'} item={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
