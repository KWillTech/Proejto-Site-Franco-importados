'use client';

import { useState } from 'react';
import styles from './Gallery.module.css';

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [current, setCurrent] = useState(0);
  if (images.length === 0) return <div className={styles.main} />;
  return (
    <div>
      <div className={styles.main}>
        {/* Imagens vêm do Storage ou de /placeholders (SVG); next/image não otimiza SVG. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[current]} alt={alt} />
      </div>
      {images.length > 1 && (
        <div className={styles.thumbs}>
          {images.map((src, i) => (
            <button key={src} type="button" aria-label={`Foto ${i + 1} de ${images.length}`}
              aria-pressed={i === current} className={i === current ? styles.on : undefined}
              onClick={() => setCurrent(i)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
