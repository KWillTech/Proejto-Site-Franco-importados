'use client';

import { useEffect, useState } from 'react';
import type { Banner } from '@/lib/types';
import styles from './HeroSlider.module.css';

export function HeroSlider({ banners }: { banners: Banner[] }) {
  const [cur, setCur] = useState(0);
  const n = banners.length;
  const go = (i: number) => setCur((i + n) % n);

  // Reinicia o tempo a cada troca, para a seta não ser atropelada pelo automático.
  useEffect(() => {
    if (n < 2) return;
    const t = setTimeout(() => setCur((c) => (c + 1) % n), 6000);
    return () => clearTimeout(t);
  }, [cur, n]);

  if (n === 0) return null;
  return (
    <section className={styles.slider} aria-roledescription="carrossel" aria-label="Destaques">
      {banners.map((b, i) => {
        const pic = (
          <picture>
            <source media="(max-width: 767px)" srcSet={b.imageMobile} />
            <img src={b.imageDesktop} alt={b.alt} loading={i === 0 ? 'eager' : 'lazy'} />
          </picture>
        );
        return (
          <div key={b.id} className={`${styles.slide} ${i === cur ? styles.on : ''}`} aria-hidden={i !== cur}>
            {b.link ? <a href={b.link} tabIndex={i === cur ? 0 : -1}>{pic}</a> : pic}
          </div>
        );
      })}
      {n > 1 && (
        <>
          <button type="button" className={`${styles.arrow} ${styles.prev}`} aria-label="Anterior" onClick={() => go(cur - 1)}>
            <svg viewBox="0 0 16 16" fill="none" stroke="#0e1733" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10 2L4 8l6 6" />
            </svg>
          </button>
          <button type="button" className={`${styles.arrow} ${styles.next}`} aria-label="Próximo" onClick={() => go(cur + 1)}>
            <svg viewBox="0 0 16 16" fill="none" stroke="#0e1733" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 2l6 6-6 6" />
            </svg>
          </button>
          <div className={styles.bullets}>
            {banners.map((b, i) => (
              <button key={b.id} type="button" className={i === cur ? styles.on : undefined}
                aria-label={`Banner ${i + 1}`} aria-current={i === cur} onClick={() => go(i)} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
