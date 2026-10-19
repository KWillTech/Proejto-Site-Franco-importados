import type { FooterSettings, Settings } from './types';

/** Textos do rodapé antes de serem editáveis; valem enquanto a migração 0006 não roda. */
export const FOOTER_DEFAULTS: FooterSettings = {
  hours: 'Segunda à sexta das 09h00 às 18h00. Sábado das 10h00 às 14h00',
  email: 'contato@francoimportados.com.br',
  payment: 'Pix · Cartão de crédito — combinados no WhatsApp',
  shipping: 'Correios · Transportadora',
  copyright: 'Copyright FRANCO IMPORTADOS - 2026. Todos os direitos reservados.',
};

export type SettingsRow = {
  whatsapp_number: string; topbar_text: string;
  footer_hours?: string | null; footer_email?: string | null; footer_payment?: string | null;
  footer_shipping?: string | null; footer_copyright?: string | null;
};

// Coluna ausente (migração não rodada) usa o padrão; texto vazio é escolha do painel e esconde o bloco.
const pick = (v: string | null | undefined, d: string) => (v == null ? d : v);

export function mapSettings(r: SettingsRow): Settings {
  return {
    whatsappNumber: r.whatsapp_number,
    topbarText: r.topbar_text,
    footer: {
      hours: pick(r.footer_hours, FOOTER_DEFAULTS.hours),
      email: pick(r.footer_email, FOOTER_DEFAULTS.email),
      payment: pick(r.footer_payment, FOOTER_DEFAULTS.payment),
      shipping: pick(r.footer_shipping, FOOTER_DEFAULTS.shipping),
      copyright: pick(r.footer_copyright, FOOTER_DEFAULTS.copyright),
    },
  };
}
