import type { Metadata } from 'next';
import { CartView } from '@/components/cart/CartView';
import { getSettings } from '@/lib/data';

export const metadata: Metadata = { title: 'Meu carrinho', robots: { index: false } };

async function loadWhatsapp() {
  'use cache';
  return (await getSettings()).whatsappNumber;
}

export default async function CartPage() {
  const whatsappNumber = await loadWhatsapp();
  return (
    <main className="page-main">
      <section className="container">
        <h1 className="sec-title">Meu carrinho</h1>
        <CartView whatsappNumber={whatsappNumber} />
      </section>
    </main>
  );
}
