'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { deleteBanner, reorderBanners, saveBanner } from '@/app/admin/(painel)/banners/actions';
import styles from '@/app/admin/admin.module.css';
import { ImageUploader } from './ImageUploader';

export type BannerItem = { id: string; imageDesktop: string; imageMobile: string; alt: string; link: string | null; active: boolean };

const EMPTY: BannerItem = { id: '', imageDesktop: '', imageMobile: '', alt: '', link: null, active: true };

function BannerForm({ item }: { item: BannerItem }) {
  const id = item.id || null;
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [desktop, setDesktop] = useState(item.imageDesktop);
  const [mobile, setMobile] = useState(item.imageMobile);
  const [alt, setAlt] = useState(item.alt);
  const [link, setLink] = useState(item.link ?? '');
  const [active, setActive] = useState(item.active);

  function submit(e: FormEvent) {
    e.preventDefault();
    setSaved(false);
    startTransition(async () => {
      try {
        const r = await saveBanner(id, { imageDesktop: desktop, imageMobile: mobile, alt, link, active });
        setErrors(r.ok ? {} : r.errors);
        setSaved(r.ok);
        if (r.ok && !id) {
          setDesktop(''); setMobile(''); setAlt(''); setLink(''); setActive(true);
        }
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
        if (!r.ok) setErrors(r.errors);
      } catch {
        setErrors({ form: 'Não foi possível excluir. Tente de novo.' });
      }
    });
  }

  const err = (key: string) => errors[key] && <p className={styles.error} role="alert">{errors[key]}</p>;
  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <ImageUploader label="Imagem para tela larga" single images={desktop ? [desktop] : []} onChange={(l) => setDesktop(l[0] ?? '')} />
      {err('imageDesktop')}
      <ImageUploader label="Imagem para celular" single images={mobile ? [mobile] : []} onChange={(l) => setMobile(l[0] ?? '')} />
      {err('imageMobile')}
      <label>
        Texto alternativo (descreve a imagem para quem não a vê)
        <input value={alt} onChange={(e) => setAlt(e.target.value)} />
      </label>
      <label>
        Link (opcional)
        <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="/categoria/perfumes ou https://…" />
        {err('link')}
      </label>
      <label className={styles.check}>
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Ativo (aparece na home)
      </label>
      {err('form')}
      {saved && <p className={styles.hint} role="status">Salvo.</p>}
      <div className={styles.actions}>
        <button type="submit" className={`${styles.btn} ${styles.primary}`} disabled={pending}>{pending ? 'Salvando…' : 'Salvar'}</button>
        {id && <button type="button" className={`${styles.btn} ${styles.danger}`} disabled={pending} onClick={remove}>Excluir</button>}
      </div>
    </form>
  );
}

export function BannersManager({ banners }: { banners: BannerItem[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function move(i: number, to: number) {
    const ids = banners.map((b) => b.id);
    [ids[i], ids[to]] = [ids[to], ids[i]];
    startTransition(async () => {
      try {
        const r = await reorderBanners(ids);
        setError(r.ok ? null : r.errors.form);
      } catch {
        setError('Não foi possível reordenar. Tente de novo.');
      }
    });
  }

  return (
    <>
      {banners.length > 0 && !banners.some((b) => b.active) && (
        <p className={styles.hint}>Nenhum banner ativo: a home fica sem o slider.</p>
      )}
      {error && <p className={styles.error} role="alert">{error}</p>}
      <ul className={styles.list}>
        {banners.map((b, i) => (
          <li className={styles.panel} key={b.id}>
            <div className={styles.panelHead}>
              {/* eslint-disable-next-line @next/next/no-img-element -- imagens do Storage ou SVG de /placeholders */}
              <img className={styles.thumb} src={b.imageDesktop} alt="" />
              <div className={styles.info}>
                <strong>{b.alt || `Banner ${i + 1}`}</strong>
                <span className={styles.muted}>{b.active ? 'Ativo' : 'Inativo'}</span>
              </div>
              <div className={styles.imgActions}>
                <button type="button" className={styles.btn} disabled={pending || i === 0} onClick={() => move(i, i - 1)} aria-label={`Subir banner ${i + 1}`}>↑</button>
                <button type="button" className={styles.btn} disabled={pending || i === banners.length - 1} onClick={() => move(i, i + 1)} aria-label={`Descer banner ${i + 1}`}>↓</button>
              </div>
            </div>
            <details>
              <summary>Editar</summary>
              <BannerForm item={b} />
            </details>
          </li>
        ))}
      </ul>
      <details className={styles.panel}>
        <summary><strong>Novo banner</strong></summary>
        <BannerForm item={EMPTY} />
      </details>
    </>
  );
}
