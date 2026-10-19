-- Franco Importados: textos do rodapé editáveis em Painel → Configurações.
-- Os valores padrão são os textos que estavam fixos no código.
--
-- Rode inteiro no SQL Editor do Supabase. Pode ser rodado de novo sem erro.

begin;

alter table public.settings
  add column if not exists footer_hours text not null default 'Segunda à sexta das 09h00 às 18h00. Sábado das 10h00 às 14h00',
  add column if not exists footer_email text not null default 'contato@francoimportados.com.br',
  add column if not exists footer_payment text not null default 'Pix · Cartão de crédito — combinados no WhatsApp',
  add column if not exists footer_shipping text not null default 'Correios · Transportadora',
  add column if not exists footer_copyright text not null default 'Copyright FRANCO IMPORTADOS - 2026. Todos os direitos reservados.';

commit;
