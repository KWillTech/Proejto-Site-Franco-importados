'use client';

import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';
import type { Channel } from '@/lib/types';

const KEY = 'franco.channel';
const listeners = new Set<() => void>();

function read(): Channel {
  try {
    return sessionStorage.getItem(KEY) === 'atacado' ? 'atacado' : 'varejo';
  } catch {
    return 'varejo';
  }
}

function write(c: Channel) {
  try {
    sessionStorage.setItem(KEY, c);
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

type Ctx = { channel: Channel; setChannel(c: Channel): void };

// Sem provider (ex.: testes), a vitrine mostra varejo.
const ChannelContext = createContext<Ctx>({ channel: 'varejo', setChannel: () => {} });

export function ChannelProvider({ children }: { children: ReactNode }) {
  // No servidor e na hidratação vale varejo; depois, o que estiver no sessionStorage.
  const channel = useSyncExternalStore(subscribe, read, () => 'varejo' as Channel);
  return <ChannelContext value={{ channel, setChannel: write }}>{children}</ChannelContext>;
}

export function useChannel(): Ctx {
  return useContext(ChannelContext);
}
