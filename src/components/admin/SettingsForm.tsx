'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { saveSettings } from '@/app/admin/(painel)/configuracoes/actions';
import styles from '@/app/admin/admin.module.css';
import type { FooterSettings } from '@/lib/types';

const FOOTER_FIELDS: { key: keyof FooterSettings; label: string; hint: string }[] = [
  { key: 'hours', label: 'Horário de atendimento', hint: 'Ex.: Segunda à sexta das 09h00 às 18h00.' },
  { key: 'email', label: 'E-mail de contato', hint: 'Aparece em "Entre em contato", abaixo do WhatsApp.' },
  { key: 'payment', label: 'Meios de pagamento', hint: 'Ex.: Pix · Cartão de crédito.' },
  { key: 'shipping', label: 'Meios de envio', hint: 'Ex.: Correios · Transportadora.' },
  { key: 'copyright', label: 'Linha final (direitos)', hint: 'Texto pequeno no fim da página.' },
];

export function SettingsForm({ whatsappNumber, topbarText, footer }: {
  whatsappNumber: string; topbarText: string; footer: FooterSettings;
}) {
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [number, setNumber] = useState(whatsappNumber);
  const [text, setText] = useState(topbarText);
  const [foot, setFoot] = useState(footer);

  function submit(e: FormEvent) {
    e.preventDefault();
    setSaved(false);
    startTransition(async () => {
      try {
        const r = await saveSettings({ whatsappNumber: number, topbarText: text, footer: foot });
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
        <span className={styles.hint}>Os pedidos chegam neste número. Também aparece no rodapé. Pode digitar com parênteses e traço.</span>
        {err('whatsappNumber')}
      </label>
      <label>
        Texto da faixa do topo
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={80} />
        <span className={styles.hint}>Deixe em branco para esconder a faixa. Até 80 caracteres.</span>
        {err('topbarText')}
      </label>

      <h2 className={styles.subtitle}>Rodapé</h2>
      <p className={styles.hint}>Deixe um campo em branco para esconder esse bloco do rodapé.</p>
      {FOOTER_FIELDS.map((f) => (
        <label key={f.key}>
          {f.label}
          <input value={foot[f.key]} onChange={(e) => setFoot({ ...foot, [f.key]: e.target.value })}
            maxLength={f.key === 'email' ? 120 : 160} inputMode={f.key === 'email' ? 'email' : undefined} />
          <span className={styles.hint}>{f.hint}</span>
          {err(`footer.${f.key}`)}
        </label>
      ))}

      {err('form')}
      {saved && <p className={styles.hint} role="status">Salvo.</p>}
      <div className={styles.actions}>
        <button type="submit" className={`${styles.btn} ${styles.primary}`} disabled={pending}>{pending ? 'Salvando…' : 'Salvar'}</button>
      </div>
    </form>
  );
}
