-- Franco Importados: preço pelo dólar.
-- preço (centavos de R$) = round(custo em centavos de US$ × cotação) + margem (centavos de R$); atacado = varejo.
-- Custo e margem ficam em public.variant_costs, só de admin: public.variants é lida pela chave anon (0001).
-- A cotação vira colunas em public.settings (linha única e pública). public.recalc_prices() grava o preço
-- calculado em variants.retail_cents/wholesale_cents e marca variants.priced; a vitrine só mostra priced.
--
-- ===================================================================================================
-- ATENÇÃO: depois desta migração TODOS os produtos saem da vitrine até custo e margem serem preenchidos
-- na aba Cálculo do painel.
-- ===================================================================================================
--
-- Rode inteiro no SQL Editor do Supabase, depois da 0003, e publique o app com esta versão logo depois
-- (o app antigo não filtra priced, então continua mostrando os preços antigos, mas não quebra).
-- Verificação no fim do arquivo. Pode ser rodado de novo sem erro.

begin;

-- ---------- custo e margem por variação (sigilosos) ----------
-- null = não preenchido (fora da vitrine); margem 0 é válida.
create table if not exists public.variant_costs (
  variant_id uuid primary key references public.variants (id) on delete cascade,
  cost_usd_cents int check (cost_usd_cents >= 0),
  margin_cents int check (margin_cents >= 0)
);
alter table public.variant_costs enable row level security;
revoke all on public.variant_costs from anon;
-- service_role: o cron chama recalc_prices() com ela, e a função lê esta tabela.
grant select, insert, update, delete on public.variant_costs to authenticated, service_role;

drop policy if exists "variant_costs_select" on public.variant_costs;
drop policy if exists "variant_costs_insert" on public.variant_costs;
drop policy if exists "variant_costs_update" on public.variant_costs;
drop policy if exists "variant_costs_delete" on public.variant_costs;
create policy "variant_costs_select" on public.variant_costs for select to authenticated using ((select public.is_admin()));
create policy "variant_costs_insert" on public.variant_costs for insert to authenticated with check ((select public.is_admin()));
create policy "variant_costs_update" on public.variant_costs for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "variant_costs_delete" on public.variant_costs for delete to authenticated using ((select public.is_admin()));

-- ---------- cotação e marca de "tem preço calculado" ----------
alter table public.settings
  add column if not exists usd_rate numeric,
  add column if not exists usd_rate_at timestamptz;

alter table public.variants
  add column if not exists priced boolean not null default false;

-- ---------- recálculo ----------
-- security invoker: quem chama precisa poder gravar em variants (admin pela RLS da 0002, ou service_role);
-- outro usuário logado atinge 0 linhas sem erro.
-- price fica null se faltar custo, margem ou cotação: aí priced = false e os preços antigos ficam como estão.
create or replace function public.recalc_prices()
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.variants v
  set priced = p.price is not null,
      retail_cents = coalesce(p.price, v.retail_cents),
      wholesale_cents = coalesce(p.price, v.wholesale_cents)
  from (
    select v2.id, round(c.cost_usd_cents * s.usd_rate)::int + c.margin_cents as price
    from public.variants v2
    left join public.variant_costs c on c.variant_id = v2.id
    left join public.settings s on s.id = 1
  ) p
  where p.id = v.id;
$$;
revoke execute on function public.recalc_prices() from public, anon;
grant execute on function public.recalc_prices() to authenticated, service_role;

commit;

-- ---------- verificação (cole no SQL Editor depois de rodar) ----------
-- set role anon; select * from public.variant_costs; -- esperado: erro de permissão
-- reset role;
-- select public.recalc_prices(); select count(*) filter (where priced) from public.variants; -- esperado: 0
