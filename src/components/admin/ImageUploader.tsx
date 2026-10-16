'use client';

import { useState } from 'react';
import styles from '@/app/admin/admin.module.css';
import { createClient } from '@/lib/supabase/browser';
import { validateImageFile } from '@/lib/validation';

const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

// shortcut: o bucket media não limita tipo nem tamanho no servidor (0001_init.sql não define allowed_mime_types nem file_size_limit), só esta checagem no navegador; definir os limites no bucket se mais gente além das duas contas do painel puder enviar.
// `single`: campo de uma imagem só (cartão, banner); enviar outra troca a atual.
export function ImageUploader({ images, onChange, label = 'Fotos', single = false }: {
  images: string[]; onChange: (images: string[]) => void; label?: string; single?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function upload(files: File[]) {
    setError(null);
    const invalid = files.map(validateImageFile).find(Boolean);
    if (invalid) return setError(invalid);
    setBusy(true);
    const storage = createClient().storage.from('media');
    const urls: string[] = [];
    for (const f of files) {
      const path = `produtos/${crypto.randomUUID()}.${EXT[f.type]}`;
      const { error: upError } = await storage.upload(path, f, { contentType: f.type });
      if (upError) {
        setError('Não foi possível enviar a foto. Tente de novo.');
        break;
      }
      urls.push(storage.getPublicUrl(path).data.publicUrl);
    }
    // Reordenar e remover ficam travados durante o envio, então `images` ainda é a lista atual.
    onChange(single ? (urls.length ? urls.slice(-1) : images) : [...images, ...urls]);
    setBusy(false);
  }

  function move(i: number, to: number) {
    const next = [...images];
    [next[i], next[to]] = [next[to], next[i]];
    onChange(next);
  }

  return (
    <fieldset className={styles.box}>
      <legend>{label}</legend>
      <p className={styles.hint}>JPG, PNG ou WebP até 5MB.{!single && ' A primeira foto aparece nos cartões da loja.'}</p>
      {images.length > 0 && (
        <ul className={styles.imgs}>
          {images.map((url, i) => (
            <li key={url}>
              {/* eslint-disable-next-line @next/next/no-img-element -- fotos do Storage ou SVG de /placeholders */}
              <img src={url} alt={`Foto ${i + 1}`} />
              <div className={styles.imgActions}>
                {!single && (
                  <>
                    <button type="button" className={styles.btn} disabled={busy || i === 0} onClick={() => move(i, i - 1)} aria-label={`Mover foto ${i + 1} para antes`}>↑</button>
                    <button type="button" className={styles.btn} disabled={busy || i === images.length - 1} onClick={() => move(i, i + 1)} aria-label={`Mover foto ${i + 1} para depois`}>↓</button>
                  </>
                )}
                {/* shortcut: remover só tira da lista, o arquivo continua no bucket; limpar órfãos se o espaço apertar. */}
                <button type="button" className={styles.btn} disabled={busy} onClick={() => onChange(images.filter((_, j) => j !== i))} aria-label={`Remover foto ${i + 1}`}>✕</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <label>
        {busy ? 'Enviando…' : single ? (images.length ? 'Trocar imagem' : 'Escolher imagem') : 'Adicionar fotos'}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple={!single}
          disabled={busy}
          onChange={(e) => {
            const files = [...(e.target.files ?? [])];
            e.target.value = '';
            if (files.length) void upload(files);
          }}
        />
      </label>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </fieldset>
  );
}
