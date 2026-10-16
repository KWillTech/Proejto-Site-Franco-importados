'use client';

import Link from 'next/link';
import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';
import { cartReducer, parseCart, type CartAction } from '@/lib/cart';
import { summarize } from '@/lib/pricing';
import type { CartLine, CartSummary } from '@/lib/types';

const KEY = 'franco.cart.v1';
const EMPTY: CartLine[] = [];
const listeners = new Set<() => void>();
// Memória de fallback quando o localStorage está bloqueado ou cheio.
let mem: CartLine[] = EMPTY;
let broken = false;
// Cache por texto gravado: useSyncExternalStore precisa da mesma referência enquanto nada muda.
let lastRaw: string | null = null;
let lastLines: CartLine[] = EMPTY;

function read(): CartLine[] {
  if (broken) return mem;
  let raw: string | null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return mem;
  }
  if (raw !== lastRaw) {
    lastRaw = raw;
    lastLines = parseCart(raw);
  }
  return lastLines;
}

function dispatch(action: CartAction) {
  const next = cartReducer(read(), action);
  mem = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    broken = true;
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

const noop = () => () => {};

type Ctx = { lines: CartLine[]; summary: CartSummary; ready: boolean; dispatch(a: CartAction): void };

// Sem provider (ex.: testes de cartão), carrinho vazio e ações sem efeito.
const CartContext = createContext<Ctx>({ lines: EMPTY, summary: summarize(EMPTY), ready: false, dispatch: () => {} });

export function CartProvider({ children }: { children: ReactNode }) {
  // No servidor e na hidratação o carrinho é vazio e ready é false; depois, o que estiver no localStorage.
  const lines = useSyncExternalStore(subscribe, read, () => EMPTY);
  const ready = useSyncExternalStore(noop, () => true, () => false);
  return <CartContext value={{ lines, summary: summarize(lines), ready, dispatch }}>{children}</CartContext>;
}

export function useCart(): Ctx {
  return useContext(CartContext);
}

export function CartCount({ className }: { className: string }) {
  const { summary } = useCart();
  return <i className={className} aria-label={`${summary.pieces} itens`}>{summary.pieces}</i>;
}

// Região sempre presente para o leitor de tela anunciar a confirmação.
export function AddedToCart({ show, className }: { show: boolean; className?: string }) {
  return (
    <p role="status" className={className}>
      {show && <>Adicionado ao carrinho. <Link href="/carrinho">Ver carrinho</Link></>}
    </p>
  );
}
