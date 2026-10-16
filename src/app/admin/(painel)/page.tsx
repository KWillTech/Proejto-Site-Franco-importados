import { redirect } from 'next/navigation';

// Só redireciona: não há o que validar para navegação instantânea.
export const instant = false;

export default function AdminIndex() {
  redirect('/admin/produtos');
}
