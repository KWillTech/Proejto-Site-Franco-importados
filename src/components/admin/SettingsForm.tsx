'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { saveSettings } from '@/app/admin/(painel)/configuracoes/actions';
import styles from '@/app/admin/admin.module.css';

export function SettingsForm({ whatsappNumber, topbarText }: { whatsappNumber: string; topbarText: string }) {
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [number, setNumber] = useState(whatsappNumber);
  const [text, setText] = useState(topbarText);

  function submit(e: FormEvent) {
    e.preventDefault();
    setSaved(false);
    startTransition(async () => {
      try {
        const r = await saveSettings({ whatsappNumber: number, topbarText: text });
        setErrors(r.ok ? {} : r.errors);
        setSaved(r.ok);
      } catch {
        setErrors({ form: 'Não foi possível salvar. Tente de novo.' });
      }
    });
  }

  const err = (key: string) => errors[key] && <p className={styles.error} role="alert">{errors[key]}</p>;
  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <label>
        Número do WhatsApp da loja
        <input value={number} onChange={(e) => setNumber(e.target.value)} inputMode="tel" placeholder="(62) 99999-0000" />
        <span className={styles.hint}>Os pedidos chegam neste número. Pode digitar com parênteses e traço.</span>
        {err('whatsappNumber')}
      </label>
      <label>
        Texto da faixa do topo
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={80} />
        <span className={styles.hint}>Deixe em branco para esconder a faixa. Até 80 caracteres.</span>
        {err('topbarText')}
      </label>
      {err('form')}
      {saved && <p className={styles.hint} role="status">Salvo.</p>}
      <div className={styles.actions}>
        <button type="submit" className={`${styles.btn} ${styles.primary}`} disabled={pending}>{pending ? 'Salvando…' : 'Salvar'}</button>
      </div>
    </form>
  );
}
