'use client';

import { useActionState, useState } from 'react';
import styles from '../admin.module.css';
import { signIn } from './actions';

export function LoginForm() {
  const [error, action, pending] = useActionState(signIn, null);
  // Controlado para o e-mail não sumir quando o React limpa o formulário após um erro.
  const [email, setEmail] = useState('');
  return (
    <form className={styles.form} action={action}>
      <label>
        E-mail
        <input type="email" name="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>
        Senha
        <input type="password" name="password" autoComplete="current-password" required />
      </label>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button className={styles.submit} type="submit" disabled={pending}>
        {pending ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  );
}
