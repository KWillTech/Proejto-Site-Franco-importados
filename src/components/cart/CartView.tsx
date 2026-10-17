'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { refreshCart } from '@/app/(site)/carrinho/actions';
import card from '@/components/site/ProductCard.module.css';
import { QuantityInput } from '@/components/site/QuantityInput';
import { reconcileCart, UUID } from '@/lib/cart';
import { formatBRL, maxInstallments } from '@/lib/pricing';
import { buildOrderMessage, normalizePhone, whatsappUrl, type Customer } from '@/lib/whatsapp';
import { readCart, useCart } from './CartProvider';
import styles from './CartView.module.css';
import { CustomerForm } from './CustomerForm';

const CUSTOMER_KEY = 'franco.customer.v1';
// shortcut: confere no máximo 100 linhas novas por vez (limite da server action); as demais só quando o carrinho mudar de novo, paginar se carrinhos assim aparecerem.
const MAX_CHECK = 100;

// Só é exibido depois de ready (sem HTML do servidor), então ler o localStorage aqui não causa diferença de hidratação.
// Campos ausentes (dados salvos antes do pagamento existir) ou inválidos viram "sem escolha".
function loadCustomer(): Customer {
  try {
    const c = JSON.parse(localStorage.getItem(CUSTOMER_KEY) ?? '{}');
    return {
      name: typeof c.name === 'string' ? c.name : '',
      city: typeof c.city === 'string' ? c.city : '',
      payment: ['Pix', 'Crédito', 'Débito', 'Boleto'].includes(c.payment) ? c.payment : '',
      installments: Number.isInteger(c.installments) && c.installments >= 1 ? c.installments : 1,
    };
  } catch {
    return { name: '', city: '', payment: '', installments: 1 };
  }
}

function wholesaleNote(missing: number): string {
  if (missing === 0) return 'Preço de atacado aplicado';
  return missing === 1 ? 'Falta 1 peça para o preço de atacado' : `Faltam ${missing} peças para o preço de atacado`;
}

export function CartView({ whatsappNumber }: { whatsappNumber: string }) {
  const { lines, summary, ready, dispatch } = useCart();
  const [saved, setCustomer] = useState<Customer>(loadCustomer);
  const [notices, setNotices] = useState<string[]>([]);
  const [missingCustomer, setMissingCustomer] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  // Linhas já conferidas com sucesso: o pedido só sai com os preços do banco.
  const [verified, setVerified] = useState<ReadonlySet<string>>(() => new Set());

  // Confere no banco cada linha uma vez (inclusive as que chegam depois, com a rota escondida e reexibida).
  const checked = useRef(new Set<string>());
  useEffect(() => {
    if (!ready) return;
    const asking = lines.map((l) => l.variantId).filter((id) => !checked.current.has(id));
    // Ids fora do formato vão para a reconciliação sem consulta: não voltam do banco e saem com aviso.
    const valid = asking.filter((id) => UUID.test(id)).slice(0, MAX_CHECK);
    const ids = new Set([...asking.filter((id) => !UUID.test(id)), ...valid]);
    if (ids.size === 0) return;
    ids.forEach((id) => checked.current.add(id));
    (valid.length ? refreshCart(valid) : Promise.resolve([])).then((fresh) => {
      const current = readCart();
      const r = reconcileCart(current.filter((l) => ids.has(l.variantId)), fresh);
      const updated = new Map(r.lines.map((l) => [l.variantId, l]));
      const next: string[] = [];
      if (r.removed.length) next.push(`Removemos do carrinho por indisponibilidade: ${r.removed.join(', ')}.`);
      if (r.priceChanged) next.push('Alguns preços foram atualizados.');
      if (next.length) setNotices(next);
      setVerified((v) => new Set([...v, ...ids]));
      dispatch({ type: 'replace', lines: current.flatMap((l) => (ids.has(l.variantId) ? updated.get(l.variantId) ?? [] : [l])) });
    }, () => {
      ids.forEach((id) => checked.current.delete(id));
      setNotices(['Não foi possível conferir os preços agora.']);
    });
  }, [ready, lines, dispatch]);

  if (!ready) return <p className="center">Carregando seu carrinho…</p>;

  const phone = normalizePhone(whatsappNumber);
  const limit = maxInstallments(lines);
  // A parcela salva pode passar do limite do carrinho atual (ele mudou): vale o máximo permitido.
  const customer = { ...saved, installments: Math.min(saved.installments, limit) };
  const hasCustomer = customer.name.trim() !== '' && customer.city.trim() !== '';
  const message = buildOrderMessage(summary, customer);
  const canOrder = lines.every((l) => verified.has(l.variantId)) && customer.payment !== '';

  function changeCustomer(c: Customer) {
    setCustomer(c);
    try {
      localStorage.setItem(CUSTOMER_KEY, JSON.stringify(c));
    } catch {}
  }

  async function copy() {
    if (!hasCustomer) return setMissingCustomer(true);
    try {
      await navigator.clipboard.writeText(message);
      setCopyStatus('Pedido copiado.');
    } catch {
      setCopyStatus('Não foi possível copiar o pedido. Use "Enviar pedido" ou tente outro navegador.');
    }
  }

  return (
    <>
      <div role="status">
        {notices.map((n) => <p key={n} className={styles.notice}>{n}</p>)}
      </div>
      {lines.length === 0 ? (
        <div className="center">
          <p>Seu carrinho está vazio.</p>
          <Link className={`${card.btn} ${card.primary}`} href="/">Ver produtos</Link>
        </div>
      ) : (
        <div className={styles.cart}>
          <ul className={styles.lines}>
            {summary.lines.map((l) => (
              <li key={l.variantId} className={styles.line}>
                {l.image ? (
                  // Imagens vêm do Storage ou de /placeholders (SVG); next/image não otimiza SVG.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.image} alt="" />
                ) : <span />}
                <div className={styles.info}>
                  <Link className={styles.name} href={`/produto/${l.slug}`}>{l.name}</Link>
                  {l.optionLabel && <div>{l.optionLabel}</div>}
                  <div>{formatBRL(l.unitCents)} cada</div>
                </div>
                <QuantityInput value={l.qty} onChange={(qty) => dispatch({ type: 'setQty', variantId: l.variantId, qty })} />
                <div className={styles.subtotal}>{formatBRL(l.subtotalCents)}</div>
                <button type="button" className={styles.remove} aria-label={`Remover ${l.name}`}
                  onClick={() => dispatch({ type: 'remove', variantId: l.variantId })}>Remover</button>
              </li>
            ))}
          </ul>
          <aside className={styles.summary}>
            <p className={styles.note}>{wholesaleNote(summary.missingForWholesale)}</p>
            <dl>
              <dt>Tipo</dt><dd>{summary.channel === 'atacado' ? 'Atacado' : 'Varejo'}</dd>
              <dt>Peças</dt><dd>{summary.pieces}</dd>
              <dt>Total</dt><dd className={styles.total}>{formatBRL(summary.totalCents)}</dd>
              {summary.totalPixCents !== summary.totalCents && (
                <><dt>Total no Pix</dt><dd className={styles.total}>{formatBRL(summary.totalPixCents)}</dd></>
              )}
            </dl>
            <CustomerForm value={customer} onChange={changeCustomer} maxInstallments={limit} />
            {missingCustomer && !hasCustomer && <p role="alert" className={styles.error}>Informe seu nome e sua cidade.</p>}
            {!customer.payment && <p role="status" className={styles.hint}>Escolha a forma de pagamento.</p>}
            <div className={styles.actions}>
              {phone && canOrder ? (
                <a className={`${card.btn} ${card.primary}`} href={whatsappUrl(phone, message)} target="_blank" rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!hasCustomer) {
                      e.preventDefault();
                      setMissingCustomer(true);
                    }
                  }}>
                  Enviar pedido
                </a>
              ) : (
                <button type="button" className={`${card.btn} ${card.primary}`} disabled>Enviar pedido</button>
              )}
              <button type="button" className={`${card.btn} ${card.secondary}`} onClick={copy} disabled={!canOrder}>Copiar pedido</button>
              <button type="button" className={`${card.btn} ${card.secondary}`}
                onClick={() => window.confirm('Esvaziar o carrinho?') && dispatch({ type: 'clear' })}>
                Esvaziar carrinho
              </button>
            </div>
            {!phone && <p className={styles.error}>Pedidos pelo WhatsApp estão indisponíveis no momento.</p>}
            <p role="status">{copyStatus}</p>
          </aside>
        </div>
      )}
    </>
  );
}
