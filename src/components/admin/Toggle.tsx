'use client';

import { useState, useTransition } from 'react';
import t from './Toggle.module.css';

/** Interruptor da lista que grava na hora; volta ao valor anterior se a action falhar. */
export function Toggle({ label, checked, action }: { label: string; checked: boolean; action: (value: boolean) => Promise<void> }) {
  const [on, setOn] = useState(checked);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <label className={t.toggle}>
      <input
        type="checkbox"
        className={t.switch}
        checked={on}
        disabled={pending}
        onChange={(e) => {
          const value = e.target.checked;
          setOn(value);
          setFailed(false);
          startTransition(async () => {
            try {
              await action(value);
            } catch {
              setOn(!value);
              setFailed(true);
            }
          });
        }}
      />
      <span className={on ? t.on : undefined}>{label}</span>
      {failed && <span className={t.error} role="alert">Não foi salvo</span>}
    </label>
  );
}
