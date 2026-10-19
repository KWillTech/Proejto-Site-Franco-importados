import type { ReactNode } from 'react';
import { CartProvider } from '@/components/cart/CartProvider';
import { ChannelProvider } from '@/components/site/ChannelProvider';
import { Footer } from '@/components/site/Footer';
import { Header } from '@/components/site/Header';
import { MobileMenu } from '@/components/site/MobileMenu';
import { Nav } from '@/components/site/Nav';
import { Topbar } from '@/components/site/Topbar';
import { WhatsAppFloat } from '@/components/site/WhatsAppFloat';
import { getMenuCategories, getSettings } from '@/lib/data';
import { normalizePhone, whatsappUrl } from '@/lib/whatsapp';

// Configurações e categorias mudam pouco: cache até o painel chamar revalidatePath.
async function Shell({ children }: { children: ReactNode }) {
  'use cache';
  const [settings, categories] = await Promise.all([getSettings(), getMenuCategories()]);
  const phone = normalizePhone(settings.whatsappNumber);
  const whatsappHref = phone ? whatsappUrl(phone) : null;
  return (
    <>
      <Topbar text={settings.topbarText} />
      <Header whatsappHref={whatsappHref} />
      <Nav categories={categories} />
      <MobileMenu categories={categories} />
      <ChannelProvider>{children}</ChannelProvider>
      <Footer phone={phone} whatsappHref={whatsappHref} texts={settings.footer} />
      {whatsappHref && <WhatsAppFloat href={whatsappHref} />}
    </>
  );
}

export default function SiteLayout({ children }: LayoutProps<'/'>) {
  // Carrinho é estado do navegador: o provider fica fora do Shell cacheado.
  return <CartProvider><Shell>{children}</Shell></CartProvider>;
}
