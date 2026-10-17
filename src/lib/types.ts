export type Channel = 'varejo' | 'atacado';

export type CartLine = {
  variantId: string; productId: string; slug: string; name: string;
  optionLabel: string;            // "Azul, 256GB" ou ""
  image: string | null;
  retailCents: number; wholesaleCents: number;
  pixPercent: number | null; installments: number | null;
  qty: number;
};

export type PricedLine = CartLine & { unitCents: number; subtotalCents: number; subtotalPixCents: number };

export type CartSummary = {
  channel: Channel; pieces: number; missingForWholesale: number;
  lines: PricedLine[]; totalCents: number; totalPixCents: number;
};

export type Category = { id: string; name: string; slug: string; parentId: string | null; homeCard: boolean; homeCardImage: string | null; homeCardTag: string | null };
export type MenuCategory = Category & { children: Category[] };
export type Variant = { id: string; optionValues: string[]; retailCents: number; wholesaleCents: number; available: boolean };
export type Product = {
  id: string; slug: string; name: string; description: string; categorySlug: string;
  images: string[]; badge: string | null; available: boolean; featured: boolean;
  pixPercent: number | null; installments: number | null;
  optionNames: string[]; variants: Variant[];
};
export type Banner = { id: string; imageDesktop: string; imageMobile: string; alt: string; link: string | null };
export type Settings = { whatsappNumber: string; topbarText: string };
