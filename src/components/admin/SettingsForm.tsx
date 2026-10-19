'use client';

import { useState, useTransition, type FormEvent, type ReactNode } from 'react';
import { saveSettings } from '@/app/admin/(painel)/configuracoes/actions';
import type { FooterSettings } from '@/lib/types';
import { displayPhone, normalizePhone } from '@/lib/whatsapp';
import s from './SettingsForm.module.css';

const I = {
  phone: <path d="M4 20l1.5-5A8 8 0 1 1 9 18.5z" />,
  bar: <><rect x="3" y="5" width="18" height="5" rx="1.5" /><path d="M3 14h18M3 18h12" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  mail: <><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="M3.5 7l8.5 6.5L20.5 7" /></>,
  card: <><rect x="2.5" y="5.5" width="19" height="13" rx="2" /><path d="M2.5 10h19M6 15h4" /></>,
  truck: <><path d="M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3v3h-7" /><circle cx="7" cy="17" r="1.8" /><circle cx="17" cy="17" r="1.8" /></>,
  copy: <><circle cx="12" cy="12" r="8.5" /><path d="M14.5 9.5a3.5 3.5 0 1 0 0 5" /></>,
};
const Icon = ({ d }: { d: ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);

function Field({ label, hint, icon, error, count, children }: {
  label: string; hint?: string; icon: ReactNode; error?: string; count?: string; children: ReactNode;
}) {
  return (
    <label className={s.field}>
      <span className={s.label}>{label}{count && <span className={s.count}>{count}</span>}</span>
      <span className={`${s.control} ${error ? s.invalid : ''}`}>
        <Icon d={icon} />
        {children}
      </span>
      {error ? <span className={s.error} role="alert">{error}</span> : hint && <span className={s.hint}>{hint}</span>}
    </label>
  );
}

export function SettingsForm({ whatsappNumber, topbarText, footer }: {
  whatsappNumber: string; topbarText: string; footer: FooterSettings;
}) {
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [number, setNumber] = useState(whatsappNumber);
  const [text, setText] = useState(topbarText);
  const [foot, setFoot] = useState(footer);
  const [saved, setSaved] = useState({ number: whatsappNumber, text: topbarText, foot: footer });
  const [justSaved, setJustSaved] = useState(false);

  const dirty = number !== saved.number || text !== saved.text || JSON.stringify(foot) !== JSON.stringify(saved.foot);

  function submit(e: FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const r = await saveSettings({ whatsappNumber: number, topbarText: text, footer: foot });
        setErrors(r.ok ? {} : r.errors);
        if (r.ok) { setSaved({ number, text, foot }); setJustSaved(true); }
      } catch {
        setErrors({ form: 'Não foi possível salvar. Tente de novo.' });
      }
    });
  }

  const setF = (k: keyof FooterSettings) => (e: React.ChangeEvent<HTMLInputElement>) => setFoot({ ...foot, [k]: e.target.value });
  const phone = normalizePhone(number);

  return (
    <form className={s.page} onSubmit={submit} noValidate>
      <header className={s.intro}>
        <h1>Configurações</h1>
        <p>Dados da loja que aparecem no site. As mudanças entram no ar assim que você salva.</p>
      </header>

      <section className={s.card}>
        <div className={s.cardHead}>
          <span className={s.step}>01</span>
          <div><h2>Contato e faixa do topo</h2><p>Onde os pedidos chegam e o aviso que aparece no alto de todas as páginas.</p></div>
        </div>
        <div className={s.grid}>
          <Field label="WhatsApp da loja" icon={I.phone} error={errors.whatsappNumber}
            hint={phone ? `Os pedidos chegam em ${displayPhone(phone)}.` : 'Com DDD. Pode digitar com parênteses e traço.'}>
            <input value={number} onChange={(e) => setNumber(e.target.value)} inputMode="tel" placeholder="(62) 99999-0000" />
          </Field>
          <Field label="Texto da faixa do topo" icon={I.bar} error={errors.topbarText} count={`${text.length}/80`}
            hint="Deixe em branco para esconder a faixa.">
            <input value={text} onChange={(e) => setText(e.target.value)} maxLength={80} placeholder="Ex.: 10% OFF no Pix em todo o site" />
          </Field>
        </div>
        <div className={s.preview}>
          <span className={s.previewLabel}>Prévia</span>
          {text.trim() ? <div className={s.topbar}>{text}</div> : <div className={s.empty}>Faixa escondida</div>}
        </div>
      </section>

      <section className={s.card}>
        <div className={s.cardHead}>
          <span className={s.step}>02</span>
          <div><h2>Rodapé</h2><p>Informações no fim de todas as páginas. Campo em branco esconde o bloco.</p></div>
        </div>
        <div className={s.grid}>
          <div className={s.wide}>
            <Field label="Horário de atendimento" icon={I.clock} error={errors['footer.hours']}>
              <input value={foot.hours} onChange={setF('hours')} maxLength={160} placeholder="Segunda à sexta das 09h00 às 18h00" />
            </Field>
          </div>
          <Field label="E-mail de contato" icon={I.mail} error={errors['footer.email']}>
            <input value={foot.email} onChange={setF('email')} maxLength={120} inputMode="email" placeholder="contato@francoimportado.com.br" />
          </Field>
          <Field label="Meios de pagamento" icon={I.card} error={errors['footer.payment']}>
            <input value={foot.payment} onChange={setF('payment')} maxLength={160} placeholder="Pix · Cartão de crédito" />
          </Field>
          <Field label="Meios de envio" icon={I.truck} error={errors['footer.shipping']}>
            <input value={foot.shipping} onChange={setF('shipping')} maxLength={160} placeholder="Correios · Transportadora" />
          </Field>
          <div>
            <Field label="Linha final" icon={I.copy} error={errors['footer.copyright']} hint="Texto pequeno no fim da página.">
              <input value={foot.copyright} onChange={setF('copyright')} maxLength={160} />
            </Field>
          </div>
        </div>
        <div className={s.preview}>
          <span className={s.previewLabel}>Prévia</span>
          <div className={s.footer}>
            <div className={s.footCols}>
              {foot.hours.trim() && <div><h4>Horário de atendimento</h4><p>{foot.hours}</p></div>}
              {(phone || foot.email.trim()) && (
                <div><h4>Entre em contato</h4>{phone && <p>{displayPhone(phone)}</p>}{foot.email.trim() && <p>{foot.email}</p>}</div>
              )}
              {foot.payment.trim() && <div><h4>Meios de pagamento</h4><p>{foot.payment}</p></div>}
              {foot.shipping.trim() && <div><h4>Meios de envio</h4><p>{foot.shipping}</p></div>}
            </div>
            {foot.copyright.trim() && <small>{foot.copyright}</small>}
          </div>
        </div>
      </section>

      <div className={s.bar}>
        <span className={s.status} role="status">
          {errors.form ? <span className={s.error}>{errors.form}</span>
            : Object.keys(errors).length ? <span className={s.error}>Confira os campos marcados.</span>
            : dirty ? <><i className={s.dotWarn} />Alterações não salvas</>
            : justSaved ? <><i className={s.dotOk} />Tudo salvo</> : 'Nenhuma alteração'}
        </span>
        <button type="submit" className={s.save} disabled={pending || !dirty}>{pending ? 'Salvando…' : 'Salvar alterações'}</button>
      </div>
    </form>
  );
}
